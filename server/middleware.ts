import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
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
    req.user = {
      id: user.id,
      username: user.username
    };

    // Log access for audit trail
    logAccess(req, user.id, user.username);

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ 
      error: "Authentication failed", 
      message: "Internal server error during authentication" 
    });
  }
}

// Authorization middleware - verifies user owns the requested case
export async function requireCaseOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
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

    // Check if user owns this case
    const caseRecord = await storage.getCase(caseId, req.user.id);
    
    if (!caseRecord) {
      // Don't reveal whether case exists or user doesn't have access
      return res.status(403).json({ 
        error: "Access denied", 
        message: "You do not have permission to access this case" 
      });
    }

    // Log access attempt for audit trail
    logAccess(req, req.user.id, req.user.username, `Accessed case ${caseId}`);

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(500).json({ 
      error: "Authorization failed", 
      message: "Internal server error during authorization" 
    });
  }
}

// Access logging for audit trail
function logAccess(req: Request, userId: string, username: string, additionalInfo?: string) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  const logEntry = {
    timestamp,
    userId,
    username,
    method,
    path,
    ip,
    userAgent,
    additionalInfo
  };

  // Log to console for now - in production this should go to a secure audit log
  console.log(`[AUDIT] ${timestamp} | User: ${username} (${userId}) | ${method} ${path} | IP: ${ip} | ${additionalInfo || 'API access'}`);
  
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