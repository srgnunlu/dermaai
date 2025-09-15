import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Extend Express Request type to include user information
// Note: This extends the passport user type, not our custom user type
declare global {
  namespace Express {
    interface CustomUser {
      id: string;
      email: string | null;
    }
    interface Request {
      customUser?: CustomUser;
    }
  }
}

// Authentication middleware - validates user session/token
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("[DEBUG] requireAuth middleware called for:", req.method, req.path);
  try {
    // For now, we'll check for a simple Authorization header with userId
    // In production, this should be a proper JWT token or session management
    const authHeader = req.headers.authorization;
    console.log("[DEBUG] Authorization header:", authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "Please provide a valid authorization token" 
      });
    }

    const userId = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Invalid token", 
        message: "Authorization token is malformed" 
      });
    }

    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: "Invalid token", 
        message: "User not found or token expired" 
      });
    }

    // Attach user to request for use in route handlers
    req.customUser = {
      id: user.id,
      email: user.email
    };

    // Log access for audit trail
    logAccess(req, user.id, user.email || 'unknown');

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ 
      error: "Authentication failed", 
      message: "Internal server error during authentication" 
    });
  }
}

// Authorization middleware - verifies user owns the requested case OR is admin
export async function requireCaseOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.customUser) {
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "User not authenticated" 
      });
    }

    const caseId = req.params.id;
    if (!caseId) {
      return res.status(400).json({ 
        error: "Invalid request", 
        message: "Case ID is required" 
      });
    }

    // Get user to check role
    const user = await storage.getUser(req.customUser.id);
    
    // If user is admin, allow access to any case
    if (user && user.role === 'admin') {
      // Log admin access attempt for audit trail
      logAccess(req, req.customUser.id, req.customUser.email || 'unknown', `Admin accessed case ${caseId}`);
      return next();
    }

    // For regular users, check if they own this case
    const caseRecord = await storage.getCase(caseId, req.customUser.id);
    
    if (!caseRecord) {
      // Don't reveal whether case exists or user doesn't have access
      return res.status(403).json({ 
        error: "Access denied", 
        message: "You do not have permission to access this case" 
      });
    }

    // Log access attempt for audit trail
    logAccess(req, req.customUser.id, req.customUser.email || 'unknown', `Accessed case ${caseId}`);

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(500).json({ 
      error: "Authorization failed", 
      message: "Internal server error during authorization" 
    });
  }
}

// Admin role check middleware - works with Replit Auth
export async function requireAdmin(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated via Replit Auth
    if (!req.user || !req.user.claims) {
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "Please login to access admin resources" 
      });
    }

    const userId = req.user.claims.sub;
    if (!userId) {
      return res.status(401).json({ 
        error: "Invalid authentication", 
        message: "User ID not found in authentication token" 
      });
    }

    // Get user from storage to check role
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      // Log unauthorized admin access attempt
      console.log(`[SECURITY] Unauthorized admin access attempt by user: ${user?.email || 'unknown'} (${userId})`);
      return res.status(403).json({ 
        error: "Access denied", 
        message: "Admin privileges required to access this resource" 
      });
    }

    // Log successful admin access
    logAccess(req, userId, user.email || 'unknown', `Admin access to ${req.path}`);
    
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({ 
      error: "Authorization failed", 
      message: "Internal server error during admin authorization" 
    });
  }
}

// Access logging for audit trail
function logAccess(req: Request, userId: string, userEmail: string, additionalInfo?: string) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const logEntry = {
    timestamp,
    userId,
    userEmail,
    method,
    path,
    ip,
    userAgent,
    additionalInfo
  };

  // Log to console for now - in production this should go to a secure audit log
  console.log(`[AUDIT] ${timestamp} | User: ${userEmail} (${userId}) | ${method} ${path} | IP: ${ip} | ${additionalInfo || 'API access'}`);
  
  // TODO: In production, send to secure audit logging service
  // auditLogger.log(logEntry);
}

// Middleware to log access attempts (including failed ones)
export function logAccessAttempt(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const originalUrl = req.originalUrl; // Use originalUrl to handle Express mounting behavior
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log all access attempts to protected endpoints - originalUrl contains the full path
  console.log(`[ACCESS_ATTEMPT] ${timestamp} | ${method} ${originalUrl} | IP: ${ip}`);
  
  next();
}