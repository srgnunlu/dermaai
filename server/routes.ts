import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { LocalFileStorageService } from "./localFileStorage";
import { CloudinaryStorageService } from "./cloudinaryStorage";
import { analyzeWithGemini } from "./gemini";
import { analyzeWithOpenAI } from "./openai";
import { insertPatientSchema, insertCaseSchema, updateUserSettingsSchema, updateUserProfileSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware";
import multer from "multer";
import PDFDocument from "pdfkit";
import crypto from "crypto";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Auth middleware - setup Local Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      console.log("GET /api/settings - Authenticated user:", req.user?.id);
      
      const userId = req.user.id;
      if (!userId) {
        console.error("No userId found in authenticated user");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const settings = await storage.getUserSettings(userId);
      console.log("Retrieved settings:", settings);
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings - Full error:", error);
      
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      console.log("PUT /api/settings - Request body:", req.body);
      console.log("Authenticated user:", req.user?.id);
      
      const userId = req.user.id;
      if (!userId) {
        console.error("No userId found in authenticated user");
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const settingsData = updateUserSettingsSchema.parse(req.body);
      console.log("Parsed settings data:", settingsData);
      
      const updatedSettings = await storage.updateUserSettings(userId, settingsData);
      console.log("Updated settings:", updatedSettings);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings - Full error:", error);
      
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        
        // Send more specific error message
        return res.status(400).json({ 
          error: "Failed to update settings",
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
      
      res.status(400).json({ error: "Invalid settings data" });
    }
  });
  
  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [profile, stats] = await Promise.all([
        storage.getUserProfile(userId),
        storage.getUserStatistics(userId)
      ]);
      
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      
      res.json({
        ...profile,
        statistics: stats
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = updateUserProfileSchema.parse(req.body);
      const updatedProfile = await storage.updateUserProfile(userId, profileData);
      
      // Also return the updated statistics
      const stats = await storage.getUserStatistics(userId);
      
      res.json({
        ...updatedProfile,
        statistics: stats
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });
  
  app.get('/api/profile/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStatistics(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  
  // Admin routes
  app.get('/api/admin/cases', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const cases = await storage.getAllCasesForAdmin();
      // Debug log to check if AI analysis data is present
      if (cases.length > 0) {
        console.log('[DEBUG ADMIN API] Sample case data:', {
          caseId: cases[0].caseId,
          hasGeminiAnalysis: !!cases[0].geminiAnalysis,
          hasOpenaiAnalysis: !!cases[0].openaiAnalysis,
          geminiType: typeof cases[0].geminiAnalysis,
          openaiType: typeof cases[0].openaiAnalysis,
        });
      }
      res.json(cases);
    } catch (error) {
      console.error("Error fetching admin cases:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });
  
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  
  // User management endpoints
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId/promote', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updatedUser = await storage.promoteUserToAdmin(userId);
      res.json({ 
        message: `User ${updatedUser.email} promoted to admin`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ error: "Failed to promote user" });
    }
  });

  app.put('/api/admin/users/:userId/demote', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updatedUser = await storage.demoteUserFromAdmin(userId);
      res.json({ 
        message: `User ${updatedUser.email} demoted from admin`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error demoting user from admin:", error);
      res.status(500).json({ error: "Failed to demote user" });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post('/api/admin/promote/:userId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updatedUser = await storage.promoteUserToAdmin(userId);
      res.json({ 
        message: `User ${updatedUser.email} promoted to admin`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ error: "Failed to promote user" });
    }
  });
  
  // Helper function to map duration values to Turkish display text
  const mapDurationToTurkish = (duration: string | null): string => {
    const durationMap: { [key: string]: string } = {
      "less-than-1-day": "1 günden az",
      "1-7-days": "1-7 gün", 
      "1-4-weeks": "1-4 hafta",
      "1-6-months": "1-6 ay",
      "more-than-6-months": "6 aydan fazla"
    };
    
    if (!duration) return 'Belirtilmedi';
    return durationMap[duration] || duration;
  };

  // Helper function to sanitize CSV fields against formula injection
  const sanitizeCSVFormula = (value: string | null | undefined): string => {
    if (!value) return '';
    const strValue = String(value);
    
    // Check if the value starts with dangerous formula characters
    if (strValue.startsWith('=') || strValue.startsWith('+') || 
        strValue.startsWith('-') || strValue.startsWith('@')) {
      // Prefix with single quote to neutralize formula execution
      return `'${strValue}`;
    }
    return strValue;
  };

  // Helper function to format symptoms array for CSV
  const formatSymptomsForCSV = (symptoms: string[] | null): string => {
    if (!symptoms || symptoms.length === 0) return 'Yok';
    // Sanitize each symptom before joining
    const sanitizedSymptoms = symptoms.map(symptom => sanitizeCSVFormula(symptom));
    return sanitizedSymptoms.join(', ');
  };

  app.get('/api/admin/export/cases', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const cases = await storage.getAllCasesForAdmin();
      
      // Get patient data for each case that has a patientId
      const patientMap = new Map();
      const patientIds = Array.from(new Set(cases.filter(c => c.patientId).map(c => c.patientId!)));
      
      for (const patientId of patientIds) {
        try {
          const patient = await storage.getPatient(patientId!);
          if (patient) {
            patientMap.set(patientId, patient);
          }
        } catch (error) {
          console.error(`Error fetching patient ${patientId}:`, error);
        }
      }
      
      // Create CSV content with Turkish headers including patient demographics
      const csvHeaders = [
        'Vaka ID', 
        'Kullanıcı Email', 
        'Hasta ID',
        'Yaş',
        'Cinsiyet', 
        'Durum', 
        'Oluşturma Tarihi', 
        'Ana Teşhis', 
        'Güven Oranı', 
        'Acil mi',
        'Belirtiler',
        'Ek Belirtiler', 
        'Belirti Süresi'
      ];
      
      const csvRows = cases.map(c => {
        const topDiagnosis = c.finalDiagnoses && c.finalDiagnoses[0] ? c.finalDiagnoses[0] : null;
        const patient = c.patientId ? patientMap.get(c.patientId) : null;
        
        return [
          c.caseId,
          sanitizeCSVFormula(c.user?.email) || 'Bilinmiyor',
          c.patientId || 'Yok',
          patient?.age ? patient.age.toString() : 'Belirtilmedi',
          patient?.gender ? sanitizeCSVFormula(patient.gender) : 'Belirtilmedi',
          c.status === 'pending' ? 'Beklemede' : c.status === 'completed' ? 'Tamamlandı' : c.status,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR') : 'Yok',
          sanitizeCSVFormula(topDiagnosis?.name) || 'Yok',
          topDiagnosis?.confidence ? `%${topDiagnosis.confidence}` : 'Yok',
          topDiagnosis?.isUrgent ? 'Evet' : 'Hayır',
          formatSymptomsForCSV(c.symptoms as string[]),
          sanitizeCSVFormula(c.additionalSymptoms) || 'Yok',
          mapDurationToTurkish(c.symptomDuration)
        ];
      });
      
      // Add UTF-8 BOM for proper Turkish character support
      const BOM = '\uFEFF';
      
      // Combine headers and rows with proper CSV escaping
      const csvContent = BOM + [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => {
          // Properly escape CSV values containing commas, quotes, or newlines
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(','))
      ].join('\n');
      
      // Set response headers for CSV download with UTF-8 charset
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="vaka-disa-aktarimi-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(csvContent);
      
    } catch (error) {
      console.error("Error exporting cases:", error);
      res.status(500).json({ error: "Failed to export cases" });
    }
  });

  // Admin delete case endpoint
  app.delete('/api/admin/cases/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const caseId = req.params.id;
      
      // Verify case exists before deletion
      const existingCase = await storage.getCaseForAdmin(caseId);
      if (!existingCase) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      const success = await storage.deleteCase(caseId);
      
      if (success) {
        res.json({ message: `Case ${existingCase.caseId} deleted successfully` });
      } else {
        res.status(500).json({ error: "Failed to delete case" });
      }
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  // Admin delete user endpoint
  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminUserId = req.user.id;
      
      // Prevent admin from deleting themselves
      if (userId === adminUserId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Verify user exists before deletion
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.json({ message: `User ${existingUser.email} deleted successfully` });
      } else {
        res.status(500).json({ error: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // File storage routes  
  app.get("/files/:filePath(*)", async (req, res) => {
    const fileStorageService = new LocalFileStorageService();
    try {
      await fileStorageService.downloadFile(req.params.filePath, res);
    } catch (error) {
      console.error("Error accessing file:", error);
      return res.sendStatus(404);
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Use Cloudinary if configured, fallback to local storage
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudinaryService = new CloudinaryStorageService();
        const imageUrl = await cloudinaryService.uploadImage(req.file.buffer, req.file.originalname);
        res.json({ url: imageUrl, filePath: imageUrl });
      } else {
        const fileStorageService = new LocalFileStorageService();
        const filePath = await fileStorageService.saveUploadedFile(
          crypto.randomUUID(), 
          req.file.buffer, 
          req.file.originalname
        );
        const fileUrl = `/files/${filePath}`;
        res.json({ url: fileUrl, filePath });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.post("/api/upload/:fileId", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileStorageService = new LocalFileStorageService();
      const filePath = await fileStorageService.saveUploadedFile(
        req.params.fileId, 
        req.file.buffer, 
        req.file.originalname
      );
      
      const fileUrl = `/files/${filePath}`;
      res.json({ url: fileUrl, filePath });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Patient management
  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(400).json({ error: "Invalid patient data" });
    }
  });

  app.get("/api/patients/:patientId", async (req, res) => {
    try {
      const patient = await storage.getPatientByPatientId(req.params.patientId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Case management and AI analysis
  app.post("/api/cases/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      
      // Create case record with authenticated user
      const userId = req.user.id;
      const newCase = await storage.createCase(caseData, userId);
      
      // Start AI analysis in parallel
      const symptomsString = Array.isArray(caseData.symptoms) 
        ? caseData.symptoms.join(", ") 
        : (caseData.symptoms || "");
      
      // Read system settings to decide which models to run
      const sys = await storage.getSystemSettings();
      const runGemini = sys.enableGemini !== false;
      const runOpenAI = sys.enableOpenAI !== false;

      if (!runGemini && !runOpenAI) {
        return res.status(503).json({ error: "Analysis disabled by admin settings" });
      }

      const tasks: Promise<any>[] = [];
      if (runGemini) {
        tasks.push(
          analyzeWithGemini(caseData.imageUrl, symptomsString, {
            lesionLocation: caseData.lesionLocation || undefined,
            medicalHistory: (caseData.medicalHistory as string[]) || undefined,
          })
        );
      }
      if (runOpenAI) {
        tasks.push(
          analyzeWithOpenAI(
            caseData.imageUrl,
            symptomsString,
            {
              lesionLocation: caseData.lesionLocation || undefined,
              medicalHistory: (caseData.medicalHistory as string[]) || undefined,
            },
            { model: sys.openaiModel || undefined, allowFallback: sys.openaiAllowFallback !== false }
          )
        );
      }

      const settled = await Promise.allSettled(tasks);
      // Map results back to providers by order
      let geminiResult: PromiseSettledResult<any> = { status: "rejected", reason: "Gemini not run" } as any;
      let openaiResult: PromiseSettledResult<any> = { status: "rejected", reason: "OpenAI not run" } as any;
      let idx = 0;
      if (runGemini) {
        geminiResult = settled[idx++];
      }
      if (runOpenAI) {
        openaiResult = settled[idx++];
      }

      let geminiAnalysis = null;
      let openaiAnalysis = null;
      const analysisErrors: Array<{ provider: string; code?: string; message: string; hint?: string; details?: any }> = [];

      if (geminiResult.status === "fulfilled") {
        geminiAnalysis = geminiResult.value;
      } else {
        console.error("Gemini analysis failed:", geminiResult.reason);
        const reason: any = geminiResult.reason;
        if (reason && typeof reason.toJSON === 'function') {
          analysisErrors.push(reason.toJSON());
        } else if (reason?.info) {
          analysisErrors.push(reason.info);
        } else {
          analysisErrors.push({ provider: 'gemini', message: String(reason) });
        }
      }

      if (openaiResult.status === "fulfilled") {
        openaiAnalysis = openaiResult.value;
      } else {
        console.error("OpenAI analysis failed:", openaiResult.reason);
        const reason: any = openaiResult.reason;
        if (reason && typeof reason.toJSON === 'function') {
          analysisErrors.push(reason.toJSON());
        } else if (reason?.info) {
          analysisErrors.push(reason.info);
        } else {
          analysisErrors.push({ provider: 'openai', message: String(reason) });
        }
      }

      // Combine and rank diagnoses
      const finalDiagnoses = combineAnalyses(geminiAnalysis, openaiAnalysis);
      
      // Update case with analysis results
      const updatedCase = await storage.updateCase(newCase.id, userId, {
        geminiAnalysis,
        openaiAnalysis,
        finalDiagnoses,
        status: "completed"
      });

      // Return case plus non-persistent diagnostic info for the UI
      res.json({ ...updatedCase, analysisErrors });
    } catch (error) {
      console.error("Error analyzing case:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.get("/api/cases", isAuthenticated, async (req: any, res) => {
    try {
      // Only return cases owned by the authenticated user
      const userId = req.user.id;
      const cases = await storage.getCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const caseRecord = await storage.getCase(req.params.id, userId);
      if (!caseRecord) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(caseRecord);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PDF report generation endpoint
  app.post("/api/cases/:id/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parameter = req.params.id;
      
      // Debug logging to track parameter types and lookup attempts
      console.log(`[REPORT] Parameter received: "${parameter}", User: ${userId}`);
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      const isAdmin = user && user.role === 'admin';
      console.log(`[REPORT] User role: ${user?.role || 'unknown'}, Is admin: ${isAdmin}`);
      
      let caseRecord;
      
      // Determine if parameter is a caseId (starts with "DR-") or UUID
      const isCaseId = parameter.startsWith('DR-');
      console.log(`[REPORT] Parameter type detected: ${isCaseId ? 'caseId' : 'UUID id'}`);
      
      if (isAdmin) {
        // Admins can access any case - try both lookup methods
        if (isCaseId) {
          console.log(`[REPORT] Admin lookup by caseId: ${parameter}`);
          caseRecord = await storage.getCaseByCaseIdForAdmin(parameter);
          
          // Fallback to UUID lookup if caseId lookup fails
          if (!caseRecord) {
            console.log(`[REPORT] Admin caseId lookup failed, trying UUID lookup: ${parameter}`);
            caseRecord = await storage.getCaseForAdmin(parameter);
          }
        } else {
          console.log(`[REPORT] Admin lookup by UUID: ${parameter}`);
          caseRecord = await storage.getCaseForAdmin(parameter);
          
          // Fallback to caseId lookup if UUID lookup fails
          if (!caseRecord) {
            console.log(`[REPORT] Admin UUID lookup failed, trying caseId lookup: ${parameter}`);
            caseRecord = await storage.getCaseByCaseIdForAdmin(parameter);
          }
        }
      } else {
        // Regular users can only access their own cases - try both lookup methods
        if (isCaseId) {
          console.log(`[REPORT] User lookup by caseId: ${parameter}, userId: ${userId}`);
          caseRecord = await storage.getCaseByCaseId(parameter, userId);
          
          // Fallback to UUID lookup if caseId lookup fails
          if (!caseRecord) {
            console.log(`[REPORT] User caseId lookup failed, trying UUID lookup: ${parameter}`);
            caseRecord = await storage.getCase(parameter, userId);
          }
        } else {
          console.log(`[REPORT] User lookup by UUID: ${parameter}, userId: ${userId}`);
          caseRecord = await storage.getCase(parameter, userId);
          
          // Fallback to caseId lookup if UUID lookup fails
          if (!caseRecord) {
            console.log(`[REPORT] User UUID lookup failed, trying caseId lookup: ${parameter}`);
            caseRecord = await storage.getCaseByCaseId(parameter, userId);
          }
        }
      }
      
      console.log(`[REPORT] Case lookup result: ${caseRecord ? 'Found' : 'Not found'} for parameter: ${parameter}`);
      
      if (!caseRecord) {
        console.log(`[REPORT] Case not found or access denied for parameter: ${parameter}, user: ${userId}`);
        return res.status(404).json({ error: "Case not found" });
      }
      
      console.log(`[REPORT] Generating PDF for case: ${caseRecord.caseId} (UUID: ${caseRecord.id})`);
    

      // Create a new PDF document with explicit UTF-8 support
      const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true,
        autoFirstPage: true,
        compress: false // Disable compression to avoid encoding issues
      });
      
      // Helper function to handle Turkish characters for PDF compatibility
      const sanitizeTextForPDF = (text: string): string => {
        if (!text) return '';
        
        // Turkish character mappings for PDF compatibility
        const turkishCharMap: { [key: string]: string } = {
          'ğ': 'g',
          'Ğ': 'G', 
          'ü': 'u',
          'Ü': 'U',
          'ş': 's',
          'Ş': 'S',
          'ı': 'i',
          'İ': 'I',
          'ö': 'o',
          'Ö': 'O',
          'ç': 'c',
          'Ç': 'C'
        };
        
        return text.replace(/[ğĞüÜşŞıİöÖçÇ]/g, (match) => turkishCharMap[match] || match);
      };
      
      // Configure font - try Unicode font first, fallback to Helvetica with character replacement
      let useUnicodeFont = false;
      try {
        // Try to use a Unicode-capable font
        doc.font('Helvetica-Bold');
        useUnicodeFont = true;
      } catch (error) {
        // Fallback to standard Helvetica
        console.warn('Using Helvetica with Turkish character replacement for PDF compatibility');
        doc.font('Helvetica');
        useUnicodeFont = false;
      }
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Case-Report-${caseRecord.caseId}.pdf"`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);

      // Add header
      doc.fontSize(20)
         .text(sanitizeTextForPDF('Medical Case Report'), { align: 'center' })
         .moveDown(2);

      // Case information
      doc.fontSize(14)
         .text(sanitizeTextForPDF(`Case ID: ${caseRecord.caseId}`), { continued: false })
         .text(sanitizeTextForPDF(`Patient ID: ${caseRecord.patientId || 'N/A'}`))
         .text(sanitizeTextForPDF(`Date: ${caseRecord.createdAt ? new Date(caseRecord.createdAt).toLocaleDateString() : 'N/A'}`))
         .text(sanitizeTextForPDF(`Status: ${caseRecord.status}`))
         .moveDown(1);

      // Clinical information
      doc.fontSize(16)
         .text(sanitizeTextForPDF('Clinical Information'), { underline: true })
         .moveDown(0.5);

      doc.fontSize(12)
         .text(sanitizeTextForPDF(`Lesion Location: ${caseRecord.lesionLocation || 'Not specified'}`))
         .text(sanitizeTextForPDF(`Symptoms: ${Array.isArray(caseRecord.symptoms) ? caseRecord.symptoms.join(', ') : (caseRecord.symptoms || 'None reported')}`))
         .text(sanitizeTextForPDF(`Additional Symptoms: ${caseRecord.additionalSymptoms || 'None reported'}`))
         .text(sanitizeTextForPDF(`Symptom Duration: ${caseRecord.symptomDuration || 'Not specified'}`))
         .moveDown(1);

      // Medical history
      if (caseRecord.medicalHistory && caseRecord.medicalHistory.length > 0) {
        doc.text(sanitizeTextForPDF(`Medical History: ${caseRecord.medicalHistory.join(', ')}`))
           .moveDown(1);
      }

      // AI Diagnosis Results
      if (caseRecord.finalDiagnoses && caseRecord.finalDiagnoses.length > 0) {
        doc.fontSize(16)
           .text(sanitizeTextForPDF('AI Diagnosis Results'), { underline: true })
           .moveDown(0.5);

        caseRecord.finalDiagnoses.forEach((diagnosis, index) => {
          doc.fontSize(12)
             .text(sanitizeTextForPDF(`${index + 1}. ${diagnosis.name}`), { continued: false })
             .fontSize(10)
             .text(sanitizeTextForPDF(`   Confidence: ${diagnosis.confidence}%`))
             .text(sanitizeTextForPDF(`   Description: ${diagnosis.description}`))
             .moveDown(0.3);

          if (diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0) {
            doc.text(sanitizeTextForPDF(`   Key Features: ${diagnosis.keyFeatures.join(', ')}`))
               .moveDown(0.3);
          }

          if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
            doc.text(sanitizeTextForPDF(`   Recommendations: ${diagnosis.recommendations.join(', ')}`))
               .moveDown(0.3);
          }

          if (diagnosis.isUrgent) {
            doc.fontSize(10)
               .fillColor('red')
               .text(sanitizeTextForPDF('   ⚠️ URGENT: Requires immediate medical attention'), { continued: false })
               .fillColor('black')
               .moveDown(0.5);
          } else {
            doc.moveDown(0.5);
          }
        });
      }

      // Add footer
      doc.fontSize(8)
         .text(sanitizeTextForPDF(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`), 50, doc.page.height - 50, { align: 'center' })
         .text(sanitizeTextForPDF('This report is generated by AI analysis and should be reviewed by a qualified medical professional.'), { align: 'center' });

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Admin: System settings
  app.get('/api/admin/system-settings', requireAdmin, async (_req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load system settings' });
    }
  });

  app.put('/api/admin/system-settings', requireAdmin, async (req, res) => {
    try {
      const { updateSystemSettingsSchema } = await import('@shared/schema');
      const updates = updateSystemSettingsSchema.parse(req.body);
      const updated = await storage.updateSystemSettings(updates);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || 'Invalid settings' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function combineAnalyses(geminiAnalysis: any, openaiAnalysis: any) {
  const diagnoses = new Map();
  
  // Combine diagnoses from both models
  if (geminiAnalysis?.diagnoses) {
    geminiAnalysis.diagnoses.forEach((diagnosis: any) => {
      const key = diagnosis.name.toLowerCase();
      if (!diagnoses.has(key)) {
        diagnoses.set(key, { ...diagnosis, sources: [] });
      }
      diagnoses.get(key).sources.push({ model: "gemini", confidence: diagnosis.confidence });
    });
  }

  if (openaiAnalysis?.diagnoses) {
    openaiAnalysis.diagnoses.forEach((diagnosis: any) => {
      const key = diagnosis.name.toLowerCase();
      if (!diagnoses.has(key)) {
        diagnoses.set(key, { ...diagnosis, sources: [] });
      }
      diagnoses.get(key).sources.push({ model: "openai", confidence: diagnosis.confidence });
    });
  }

  // Calculate combined confidence and rank
  const finalDiagnoses = Array.from(diagnoses.values()).map((diagnosis: any, index) => {
    const avgConfidence = diagnosis.sources.reduce((sum: number, source: any) => sum + source.confidence, 0) / diagnosis.sources.length;
    
    // Boost confidence if both models agree
    const consensusBoost = diagnosis.sources.length > 1 ? 1.1 : 1.0;
    const finalConfidence = Math.min(100, Math.round(avgConfidence * consensusBoost));
    
    // Determine urgency based on diagnosis name and confidence
    const urgentConditions = ["melanoma", "basal cell carcinoma", "squamous cell carcinoma"];
    const isUrgent = urgentConditions.some(condition => 
      diagnosis.name.toLowerCase().includes(condition.toLowerCase())
    ) && finalConfidence > 25;

    return {
      rank: index + 1,
      name: diagnosis.name,
      confidence: finalConfidence,
      description: diagnosis.description,
      keyFeatures: diagnosis.keyFeatures || [],
      recommendations: diagnosis.recommendations || [],
      isUrgent
    };
  }).sort((a, b) => b.confidence - a.confidence).map((diagnosis, index) => ({
    ...diagnosis,
    rank: index + 1
  }));

  return finalDiagnoses.slice(0, 5); // Return top 5 diagnoses
}
