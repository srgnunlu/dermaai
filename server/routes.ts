import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { LocalFileStorageService } from './localFileStorage';
import { CloudinaryStorageService } from './cloudinaryStorage';
import { analyzeWithGemini } from './gemini';
import { analyzeWithOpenAI } from './openai';
import {
  insertPatientSchema,
  insertCaseSchema,
  updateUserSettingsSchema,
  updateUserProfileSchema,
} from '@shared/schema';
import { setupAuth, isAuthenticated } from './replitAuth';
import { requireAdmin } from './middleware';
import multer from 'multer';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import logger from './logger';
import { sanitizeCSVFormula, formatSymptomsForCSV, mapDurationToTurkish } from './utils/csv';
import { sanitizeTextForPDF } from './utils/pdf';
import { lookupCaseWithAuth } from './utils/caseHelpers';
import { mergeAnalysesWithoutConsensus } from './utils/aiAnalysis';

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
      logger.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        logger.error('No userId found in authenticated user');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      logger.error('Error fetching settings', { error });
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        logger.error('No userId found in authenticated user');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const settingsData = updateUserSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateUserSettings(userId, settingsData);

      res.json(updatedSettings);
    } catch (error) {
      logger.error('Error updating settings', { error });

      if (error instanceof Error) {
        return res.status(400).json({
          error: 'Failed to update settings',
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
      }

      res.status(400).json({ error: 'Invalid settings data' });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const [profile, stats] = await Promise.all([
        storage.getUserProfile(userId),
        storage.getUserStatistics(userId),
      ]);

      if (!profile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      res.json({
        ...profile,
        statistics: stats,
      });
    } catch (error) {
      logger.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
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
        statistics: stats,
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(400).json({ error: 'Invalid profile data' });
    }
  });

  app.get('/api/profile/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStatistics(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Admin routes
  // Paginated endpoint (preferred for performance)
  app.get('/api/admin/cases/paginated', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getCasesForAdminPaginated(page, limit);
      res.json(result);
    } catch (error) {
      logger.error('Error fetching paginated admin cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  // Legacy endpoint (kept for backwards compatibility)
  app.get('/api/admin/cases', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const cases = await storage.getAllCasesForAdmin();
      res.json(cases);
    } catch (error) {
      logger.error('Error fetching admin cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStatistics();
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching system statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // User management endpoints
  // Paginated endpoint (preferred for performance)
  app.get('/api/admin/users/paginated', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getUsersPaginated(page, limit);
      res.json(result);
    } catch (error) {
      logger.error('Error fetching paginated users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Legacy endpoint (kept for backwards compatibility)
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      logger.error('Error fetching all users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.put(
    '/api/admin/users/:userId/promote',
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const updatedUser = await storage.promoteUserToAdmin(userId);
        res.json({
          message: `User ${updatedUser.email} promoted to admin`,
          user: updatedUser,
        });
      } catch (error) {
        logger.error('Error promoting user to admin:', error);
        res.status(500).json({ error: 'Failed to promote user' });
      }
    }
  );

  app.put(
    '/api/admin/users/:userId/demote',
    isAuthenticated,
    requireAdmin,
    async (req: any, res) => {
      try {
        const { userId } = req.params;
        const updatedUser = await storage.demoteUserFromAdmin(userId);
        res.json({
          message: `User ${updatedUser.email} demoted from admin`,
          user: updatedUser,
        });
      } catch (error) {
        logger.error('Error demoting user from admin:', error);
        res.status(500).json({ error: 'Failed to demote user' });
      }
    }
  );

  // Legacy endpoint for backward compatibility
  app.post('/api/admin/promote/:userId', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updatedUser = await storage.promoteUserToAdmin(userId);
      res.json({
        message: `User ${updatedUser.email} promoted to admin`,
        user: updatedUser,
      });
    } catch (error) {
      logger.error('Error promoting user to admin:', error);
      res.status(500).json({ error: 'Failed to promote user' });
    }
  });

  app.get('/api/admin/export/cases', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const cases = await storage.getAllCasesForAdmin();

      // Get patient data for each case that has a patientId
      const patientMap = new Map();
      const patientIds = Array.from(
        new Set(cases.filter((c) => c.patientId).map((c) => c.patientId!))
      );

      for (const patientId of patientIds) {
        try {
          const patient = await storage.getPatient(patientId!);
          if (patient) {
            patientMap.set(patientId, patient);
          }
        } catch (error) {
          logger.error(`Error fetching patient ${patientId}:`, error);
        }
      }

      // Create CSV content with Turkish headers including separate AI results
      const csvHeaders = [
        'Vaka ID',
        'Kullanıcı Email',
        'Hasta ID',
        'Yaş',
        'Cinsiyet',
        'Durum',
        'Oluşturma Tarihi',
        'Belirtiler',
        'Ek Belirtiler',
        'Belirti Süresi',
        'Gemini Top1 Tanı',
        'Gemini Top1 Güven',
        'Gemini Top2 Tanı',
        'Gemini Top2 Güven',
        'Gemini Top3 Tanı',
        'Gemini Top3 Güven',
        'Gemini Top4 Tanı',
        'Gemini Top4 Güven',
        'Gemini Top5 Tanı',
        'Gemini Top5 Güven',
        'ChatGPT Top1 Tanı',
        'ChatGPT Top1 Güven',
        'ChatGPT Top2 Tanı',
        'ChatGPT Top2 Güven',
        'ChatGPT Top3 Tanı',
        'ChatGPT Top3 Güven',
        'ChatGPT Top4 Tanı',
        'ChatGPT Top4 Güven',
        'ChatGPT Top5 Tanı',
        'ChatGPT Top5 Güven',
      ];

      const csvRows = cases.map((c) => {
        const patient = c.patientId ? patientMap.get(c.patientId) : null;
        const geminiDiagnoses = c.geminiAnalysis?.diagnoses ?? [];
        const openaiDiagnoses = c.openaiAnalysis?.diagnoses ?? [];

        // Build base row
        const baseRow = [
          c.caseId,
          sanitizeCSVFormula(c.user?.email) || 'Bilinmiyor',
          c.patientId || 'Yok',
          patient?.age ? patient.age.toString() : 'Belirtilmedi',
          patient?.gender ? sanitizeCSVFormula(patient.gender) : 'Belirtilmedi',
          c.status === 'pending' ? 'Beklemede' : c.status === 'completed' ? 'Tamamlandı' : c.status,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR') : 'Yok',
          formatSymptomsForCSV(c.symptoms as string[]),
          sanitizeCSVFormula(c.additionalSymptoms) || 'Yok',
          mapDurationToTurkish(c.symptomDuration),
        ];

        // Add Gemini diagnoses (top 5)
        for (let i = 0; i < 5; i++) {
          if (geminiDiagnoses[i]) {
            baseRow.push(sanitizeCSVFormula(geminiDiagnoses[i].name) || 'Yok');
            baseRow.push(`%${geminiDiagnoses[i].confidence}`);
          } else {
            baseRow.push('Yok');
            baseRow.push('Yok');
          }
        }

        // Add ChatGPT diagnoses (top 5)
        for (let i = 0; i < 5; i++) {
          if (openaiDiagnoses[i]) {
            baseRow.push(sanitizeCSVFormula(openaiDiagnoses[i].name) || 'Yok');
            baseRow.push(`%${openaiDiagnoses[i].confidence}`);
          } else {
            baseRow.push('Yok');
            baseRow.push('Yok');
          }
        }

        return baseRow;
      });

      // Add UTF-8 BOM for proper Turkish character support
      const BOM = '\uFEFF';

      // Combine headers and rows with proper CSV escaping
      const csvContent =
        BOM +
        [
          csvHeaders.join(','),
          ...csvRows.map((row) =>
            row
              .map((cell) => {
                // Properly escape CSV values containing commas, quotes, or newlines
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                  return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
              })
              .join(',')
          ),
        ].join('\n');

      // Set response headers for CSV download with UTF-8 charset
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="vaka-disa-aktarimi-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(csvContent);
    } catch (error) {
      logger.error('Error exporting cases:', error);
      res.status(500).json({ error: 'Failed to export cases' });
    }
  });

  // Admin delete case endpoint
  app.delete('/api/admin/cases/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const caseId = req.params.id;

      // Verify case exists before deletion
      const existingCase = await storage.getCaseForAdmin(caseId);
      if (!existingCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const success = await storage.deleteCase(caseId);

      if (success) {
        res.json({ message: `Case ${existingCase.caseId} deleted successfully` });
      } else {
        res.status(500).json({ error: 'Failed to delete case' });
      }
    } catch (error) {
      logger.error('Error deleting case:', error);
      res.status(500).json({ error: 'Failed to delete case' });
    }
  });

  // Admin delete user endpoint
  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminUserId = req.user.id;

      // Prevent admin from deleting themselves
      if (userId === adminUserId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Verify user exists before deletion
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const success = await storage.deleteUser(userId);

      if (success) {
        res.json({ message: `User ${existingUser.email} deleted successfully` });
      } else {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // File storage routes
  app.get('/files/:filePath(*)', async (req, res) => {
    const fileStorageService = new LocalFileStorageService();
    try {
      await fileStorageService.downloadFile(req.params.filePath, res);
    } catch (error) {
      logger.error('Error accessing file:', error);
      return res.sendStatus(404);
    }
  });

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Use Cloudinary if configured, fallback to local storage
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudinaryService = new CloudinaryStorageService();
        const imageUrl = await cloudinaryService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
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
      logger.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  app.post('/api/upload/:fileId', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
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
      logger.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Patient management
  app.post('/api/patients', async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      logger.error('Error creating patient:', error);
      res.status(400).json({ error: 'Invalid patient data' });
    }
  });

  app.get('/api/patients/:patientId', async (req, res) => {
    try {
      const patient = await storage.getPatientByPatientId(req.params.patientId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      res.json(patient);
    } catch (error) {
      logger.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Case management and AI analysis
  app.post('/api/cases/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);

      // Create case record with authenticated user
      const userId = req.user.id;
      
      // Handle both single imageUrl (backward compatibility) and multiple imageUrls
      let imageUrls: string[] = [];
      if (caseData.imageUrls && Array.isArray(caseData.imageUrls) && caseData.imageUrls.length > 0) {
        imageUrls = (caseData.imageUrls as string[]).slice(0, 3); // Max 3 images
      } else if (caseData.imageUrl) {
        imageUrls = [caseData.imageUrl];
      } else {
        return res.status(400).json({ error: 'At least one image is required' });
      }

      // Create case record - store both imageUrl (first one for backward compatibility) and imageUrls (array)
      const caseDataToStore = {
        ...caseData,
        imageUrl: imageUrls[0], // Keep first URL for backward compatibility
        imageUrls: imageUrls, // Store all URLs
      };

      const newCase = await storage.createCase(caseDataToStore, userId);

      // Start AI analysis in parallel
      const symptomsString = Array.isArray(caseData.symptoms)
        ? caseData.symptoms.join(', ')
        : caseData.symptoms || '';

      // Read system settings to decide which models to run
      const sys = await storage.getSystemSettings();
      const runGemini = sys.enableGemini !== false;
      const runOpenAI = sys.enableOpenAI !== false;

      if (!runGemini && !runOpenAI) {
        return res.status(503).json({ error: 'Analysis disabled by admin settings' });
      }

      const tasks: Promise<any>[] = [];
      if (runGemini) {
        tasks.push(
          analyzeWithGemini(imageUrls, symptomsString, {
            lesionLocation: caseData.lesionLocation || undefined,
            medicalHistory: (caseData.medicalHistory as string[]) || undefined,
          })
        );
      }
      if (runOpenAI) {
        tasks.push(
          analyzeWithOpenAI(
            imageUrls,
            symptomsString,
            {
              lesionLocation: caseData.lesionLocation || undefined,
              medicalHistory: (caseData.medicalHistory as string[]) || undefined,
            },
            {
              model: sys.openaiModel || undefined,
              allowFallback: sys.openaiAllowFallback !== false,
            }
          )
        );
      }

      const settled = await Promise.allSettled(tasks);
      // Map results back to providers by order
      let geminiResult: PromiseSettledResult<any> = {
        status: 'rejected',
        reason: 'Gemini not run',
      } as any;
      let openaiResult: PromiseSettledResult<any> = {
        status: 'rejected',
        reason: 'OpenAI not run',
      } as any;
      let idx = 0;
      if (runGemini) {
        geminiResult = settled[idx++];
      }
      if (runOpenAI) {
        openaiResult = settled[idx++];
      }

      let geminiAnalysis = null;
      let openaiAnalysis = null;
      const analysisErrors: Array<{
        provider: string;
        code?: string;
        message: string;
        hint?: string;
        details?: any;
      }> = [];

      if (geminiResult.status === 'fulfilled') {
        geminiAnalysis = geminiResult.value;
        // Check if AI returned an error (non-skin-lesion image)
        if ((geminiAnalysis as any).error) {
          analysisErrors.push({
            provider: 'gemini',
            code: 'INVALID_IMAGE',
            message: (geminiAnalysis as any).message || 'Image does not appear to be a skin lesion',
          });
          geminiAnalysis = null;
        }
      } else {
        logger.error('Gemini analysis failed:', geminiResult.reason);
        const reason: any = geminiResult.reason;
        if (reason && typeof reason.toJSON === 'function') {
          analysisErrors.push(reason.toJSON());
        } else if (reason?.info) {
          analysisErrors.push(reason.info);
        } else {
          analysisErrors.push({ provider: 'gemini', message: String(reason) });
        }
      }

      if (openaiResult.status === 'fulfilled') {
        openaiAnalysis = openaiResult.value;
        // Check if AI returned an error (non-skin-lesion image)
        if ((openaiAnalysis as any).error) {
          analysisErrors.push({
            provider: 'openai',
            code: 'INVALID_IMAGE',
            message: (openaiAnalysis as any).message || 'Image does not appear to be a skin lesion',
          });
          openaiAnalysis = null;
        }
      } else {
        logger.error('OpenAI analysis failed:', openaiResult.reason);
        const reason: any = openaiResult.reason;
        if (reason && typeof reason.toJSON === 'function') {
          analysisErrors.push(reason.toJSON());
        } else if (reason?.info) {
          analysisErrors.push(reason.info);
        } else {
          analysisErrors.push({ provider: 'openai', message: String(reason) });
        }
      }

      // Store separate AI analyses (no consensus combining)
      // Each AI's results will be displayed separately in the UI

      // Update case with analysis results
      const updatedCase = await storage.updateCase(newCase.id, userId, {
        geminiAnalysis,
        openaiAnalysis,
        finalDiagnoses: null, // No longer combining results
        status: 'completed',
      });

      // Return case plus non-persistent diagnostic info for the UI
      res.json({ ...updatedCase, analysisErrors });
    } catch (error) {
      logger.error('Error analyzing case:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  app.get('/api/cases', isAuthenticated, async (req: any, res) => {
    try {
      // Only return cases owned by the authenticated user
      const userId = req.user.id;
      const cases = await storage.getCases(userId);
      res.json(cases);
    } catch (error) {
      logger.error('Error fetching cases:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const caseRecord = await storage.getCase(req.params.id, userId);
      if (!caseRecord) {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.json(caseRecord);
    } catch (error) {
      logger.error('Error fetching case:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PDF report generation endpoint
  app.post('/api/cases/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parameter = req.params.id;

      // Check if user is admin
      const user = await storage.getUser(userId);
      const isAdmin = Boolean(user && user.role === 'admin');

      // Lookup case with proper authorization
      const caseRecord = await lookupCaseWithAuth(parameter, userId, isAdmin);

      if (!caseRecord) {
        return res.status(404).json({ error: 'Case not found' });
      }

      // Create a new PDF document with explicit UTF-8 support
      const doc = new PDFDocument({
        margin: 40,
        bufferPages: true,
        autoFirstPage: true,
        compress: false,
      });

      // Configure font
      doc.font('Helvetica');

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Case-Report-${caseRecord.caseId}.pdf"`
      );

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Professional Header with background
      const pageWidth = doc.page.width;
      doc
        .rect(0, 0, pageWidth, 80)
        .fill('#1a5490')
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(sanitizeTextForPDF('MEDICAL CASE REPORT'), 0, 20, {
          align: 'center',
          width: pageWidth,
        })
        .fontSize(11)
        .font('Helvetica')
        .text(sanitizeTextForPDF('AI-Powered Dermatological Analysis'), 0, 50, {
          align: 'center',
          width: pageWidth,
        })
        .fillColor('#000000')
        .moveDown(3);

      // Case Header Section - with border
      doc
        .rect(doc.x, doc.y, pageWidth - 80, 80)
        .stroke('#1a5490');

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(sanitizeTextForPDF('CASE INFORMATION'), doc.x + 10, doc.y + 5, {
          width: pageWidth - 100,
        })
        .font('Helvetica')
        .fontSize(9)
        .moveDown(0.3)
        .text(sanitizeTextForPDF(`Case ID: ${caseRecord.caseId}`), doc.x + 10)
        .text(sanitizeTextForPDF(`Patient ID: ${caseRecord.patientId || 'N/A'}`))
        .text(
          sanitizeTextForPDF(
            `Date: ${caseRecord.createdAt ? new Date(caseRecord.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}`
          )
        )
        .text(
          sanitizeTextForPDF(
            `Status: ${caseRecord.status === 'completed' ? 'Completed' : 'Pending'}`
          )
        )
        .moveDown(1.5);

      // Clinical Information Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('CLINICAL INFORMATION'), {
          underline: true,
        })
        .fillColor('#000000')
        .font('Helvetica')
        .fontSize(10)
        .moveDown(0.5);

      const clinicalData = [
        [`Lesion Location:`, sanitizeTextForPDF(caseRecord.lesionLocation || 'Not specified')],
        [
          `Symptoms:`,
          sanitizeTextForPDF(
            Array.isArray(caseRecord.symptoms)
              ? caseRecord.symptoms.join(', ')
              : caseRecord.symptoms || 'None reported'
          ),
        ],
        [
          `Duration:`,
          sanitizeTextForPDF(caseRecord.symptomDuration || 'Not specified'),
        ],
      ];

      clinicalData.forEach(([label, value]) => {
        doc
          .font('Helvetica-Bold')
          .text(label, { continued: true })
          .font('Helvetica')
          .text(` ${value}`);
      });

      if (caseRecord.additionalSymptoms) {
        doc
          .font('Helvetica-Bold')
          .text('Additional Symptoms:', { continued: true })
          .font('Helvetica')
          .text(` ${sanitizeTextForPDF(caseRecord.additionalSymptoms)}`);
      }

      if (caseRecord.medicalHistory && caseRecord.medicalHistory.length > 0) {
        doc
          .font('Helvetica-Bold')
          .text('Medical History:', { continued: true })
          .font('Helvetica')
          .text(` ${sanitizeTextForPDF(caseRecord.medicalHistory.join(', '))}`);
      }

      doc.moveDown(1.5);

      // Lesion Images Section
      const imageUrls = (caseRecord as any).imageUrls && Array.isArray((caseRecord as any).imageUrls)
        ? (caseRecord as any).imageUrls
        : caseRecord.imageUrl
          ? [caseRecord.imageUrl]
          : [];

      if (imageUrls && imageUrls.length > 0) {
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1a5490')
          .text(sanitizeTextForPDF('LESION IMAGE' + (imageUrls.length > 1 ? 'S' : '')), {
            underline: true,
          })
          .fillColor('#000000')
          .fontSize(10)
          .moveDown(0.5);

        for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
          const imageUrl = imageUrls[imgIdx];
          try {
            let file;

            if (imageUrl.includes('cloudinary.com')) {
              const { CloudinaryStorageService } = await import('./cloudinaryStorage');
              const cloudinaryService = new CloudinaryStorageService();
              file = await cloudinaryService.getObjectEntityFile(imageUrl);
            } else {
              const { LocalFileStorageService } = await import('./localFileStorage');
              const fileStorageService = new LocalFileStorageService();
              const normalizedPath = fileStorageService.normalizeObjectEntityPath(imageUrl);
              file = await fileStorageService.getObjectEntityFile(normalizedPath);
            }

            const [imageBuffer] = await file.download();
            const imageBase64 = Buffer.from(imageBuffer).toString('base64');

            if (imageUrls.length > 1) {
              doc
                .fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#1a5490')
                .text(sanitizeTextForPDF(`Image ${imgIdx + 1} of ${imageUrls.length}`))
                .fillColor('#000000')
                .moveDown(0.2);
            }

            try {
              const maxWidth = imageUrls.length === 1 ? 300 : 200;
              doc.image(Buffer.from(imageBase64, 'base64'), {
                fit: [maxWidth, 220],
                align: 'center',
              });
            } catch (imgErr) {
              console.warn(`Failed to embed image ${imgIdx + 1} in PDF:`, imgErr);
            }

            doc.moveDown(0.3);
          } catch (error) {
            console.warn(`Failed to fetch image ${imgIdx + 1}:`, error);
          }
        }

        doc.moveDown(1);
      }

      // Add page break for diagnoses if images are large
      if (imageUrls.length > 0) {
        doc.addPage();
      }

      // AI Diagnosis Results Section
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('AI ANALYSIS RESULTS'), {
          underline: true,
        })
        .fillColor('#000000')
        .font('Helvetica')
        .fontSize(10)
        .moveDown(0.5);

      // Gemini Results
      if (caseRecord.geminiAnalysis?.diagnoses && caseRecord.geminiAnalysis.diagnoses.length > 0) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#6b4423')
          .text(sanitizeTextForPDF('Gemini 2.5 Flash Analysis'), { underline: true })
          .fillColor('#000000')
          .font('Helvetica')
          .fontSize(9)
          .moveDown(0.5);

        // Table header
        const tableY = doc.y;
        const colWidths = [30, 70, 50, 250];
        const rowHeight = 20;
        const tableLeft = 50;

        doc
          .rect(tableLeft, tableY, 500, rowHeight)
          .fill('#f0f0f0');

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Rank', tableLeft + 5, tableY + 3, { width: colWidths[0] - 5 })
          .text('Confidence', tableLeft + colWidths[0] + 5, tableY + 3, {
            width: colWidths[1] - 5,
          })
          .text('Name', tableLeft + colWidths[0] + colWidths[1] + 5, tableY + 3, {
            width: colWidths[2] - 5,
          })
          .text('Description', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableY + 3, {
            width: colWidths[3] - 5,
          });

        let currentY = tableY + rowHeight;

        caseRecord.geminiAnalysis.diagnoses.slice(0, 5).forEach((diagnosis: any, index: number) => {
          const diagY = currentY;
          const shortDesc = diagnosis.description
            ? sanitizeTextForPDF(diagnosis.description.substring(0, 80))
            : '';

          doc
            .rect(tableLeft, diagY, 500, rowHeight)
            .stroke('#cccccc');

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#000000')
            .text(String(index + 1), tableLeft + 5, diagY + 5, { width: colWidths[0] - 5 })
            .text(`${diagnosis.confidence}%`, tableLeft + colWidths[0] + 5, diagY + 5, {
              width: colWidths[1] - 5,
            })
            .text(sanitizeTextForPDF(diagnosis.name), tableLeft + colWidths[0] + colWidths[1] + 5, diagY + 5, {
              width: colWidths[2] - 5,
            })
            .text(shortDesc, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, diagY + 5, {
              width: colWidths[3] - 5,
            });

          currentY += rowHeight;
        });

        doc.moveDown(4);
      }

      // OpenAI Results
      if (caseRecord.openaiAnalysis?.diagnoses && caseRecord.openaiAnalysis.diagnoses.length > 0) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#2d5d5d')
          .text(sanitizeTextForPDF('GPT-4o Mini Analysis'), { underline: true })
          .fillColor('#000000')
          .font('Helvetica')
          .fontSize(9)
          .moveDown(0.5);

        // Table header
        const tableY = doc.y;
        const colWidths = [30, 70, 50, 250];
        const rowHeight = 20;
        const tableLeft = 50;

        doc
          .rect(tableLeft, tableY, 500, rowHeight)
          .fill('#f0f0f0');

        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Rank', tableLeft + 5, tableY + 3, { width: colWidths[0] - 5 })
          .text('Confidence', tableLeft + colWidths[0] + 5, tableY + 3, {
            width: colWidths[1] - 5,
          })
          .text('Name', tableLeft + colWidths[0] + colWidths[1] + 5, tableY + 3, {
            width: colWidths[2] - 5,
          })
          .text('Description', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableY + 3, {
            width: colWidths[3] - 5,
          });

        let currentY = tableY + rowHeight;

        caseRecord.openaiAnalysis.diagnoses.slice(0, 5).forEach((diagnosis: any, index: number) => {
          const diagY = currentY;
          const shortDesc = diagnosis.description
            ? sanitizeTextForPDF(diagnosis.description.substring(0, 80))
            : '';

          doc
            .rect(tableLeft, diagY, 500, rowHeight)
            .stroke('#cccccc');

          doc
            .fontSize(8)
            .font('Helvetica')
            .fillColor('#000000')
            .text(String(index + 1), tableLeft + 5, diagY + 5, { width: colWidths[0] - 5 })
            .text(`${diagnosis.confidence}%`, tableLeft + colWidths[0] + 5, diagY + 5, {
              width: colWidths[1] - 5,
            })
            .text(sanitizeTextForPDF(diagnosis.name), tableLeft + colWidths[0] + colWidths[1] + 5, diagY + 5, {
              width: colWidths[2] - 5,
            })
            .text(shortDesc, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 5, diagY + 5, {
              width: colWidths[3] - 5,
            });

          currentY += rowHeight;
        });

        doc.moveDown(3);
      }

      if (
        (!caseRecord.geminiAnalysis?.diagnoses || caseRecord.geminiAnalysis.diagnoses.length === 0) &&
        (!caseRecord.openaiAnalysis?.diagnoses || caseRecord.openaiAnalysis.diagnoses.length === 0)
      ) {
        doc.text(sanitizeTextForPDF('No AI analysis results available')).moveDown(1);
      }

      // Professional Footer
      doc.moveDown(2);
      doc
        .rect(0, doc.page.height - 60, doc.page.width, 60)
        .fill('#f5f5f5');

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#555555')
        .text(
          sanitizeTextForPDF(
            `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}`
          ),
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        )
        .fontSize(7)
        .text(
          sanitizeTextForPDF(
            'MEDICAL DISCLAIMER: This report is generated by AI analysis and should be reviewed by a qualified medical professional. It is for informational purposes only.'
          ),
          { align: 'center' }
        );

      // Finalize the PDF
      doc.end();
    } catch (error) {
      logger.error('Error generating PDF report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
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

  // Analytics endpoints
  app.get('/api/admin/analytics/diagnosis-distribution', requireAdmin, async (_req, res) => {
    try {
      const distribution = await storage.getAnalyticsDiagnosisDistribution();
      res.json(distribution);
    } catch (error) {
      logger.error('Error fetching diagnosis distribution:', error);
      res.status(500).json({ error: 'Failed to fetch diagnosis distribution' });
    }
  });

  app.get('/api/admin/analytics/timeseries', requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getAnalyticsTimeSeriesData(days);
      res.json(data);
    } catch (error) {
      logger.error('Error fetching timeseries data:', error);
      res.status(500).json({ error: 'Failed to fetch timeseries data' });
    }
  });

  app.get('/api/admin/analytics/ai-performance', requireAdmin, async (_req, res) => {
    try {
      const performance = await storage.getAnalyticsAIPerformance();
      res.json(performance);
    } catch (error) {
      logger.error('Error fetching AI performance:', error);
      res.status(500).json({ error: 'Failed to fetch AI performance' });
    }
  });

  app.get('/api/admin/analytics/user-activity', requireAdmin, async (_req, res) => {
    try {
      const activity = await storage.getAnalyticsUserActivity();
      res.json(activity);
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });

  // Bulk operations
  app.post('/api/admin/bulk/delete-cases', requireAdmin, async (req, res) => {
    try {
      const { caseIds } = req.body;

      if (!Array.isArray(caseIds) || caseIds.length === 0) {
        return res.status(400).json({ error: 'caseIds must be a non-empty array' });
      }

      let successCount = 0;
      let failCount = 0;

      for (const caseId of caseIds) {
        const success = await storage.deleteCase(caseId);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      logger.info(`Bulk delete: ${successCount} succeeded, ${failCount} failed`);

      res.json({
        success: true,
        deleted: successCount,
        failed: failCount,
        total: caseIds.length,
      });
    } catch (error) {
      logger.error('Error in bulk delete:', error);
      res.status(500).json({ error: 'Failed to delete cases' });
    }
  });

  app.post('/api/admin/bulk/export-cases', requireAdmin, async (req, res) => {
    try {
      const { caseIds, format = 'csv' } = req.body;

      if (!Array.isArray(caseIds) || caseIds.length === 0) {
        return res.status(400).json({ error: 'caseIds must be a non-empty array' });
      }

      // Get all cases
      const allCases = await storage.getAllCasesForAdmin();
      const selectedCases = allCases.filter((c) => caseIds.includes(c.id));

      if (selectedCases.length === 0) {
        return res.status(404).json({ error: 'No cases found' });
      }

      if (format === 'csv') {
        const { generateCSV, escapeCSVCell } = await import('./utils/csv');

        // Get unique patient IDs
        const patientIds = Array.from(
          new Set(
            selectedCases
              .map((c) => c.patientId)
              .filter((id): id is string => id !== null && id !== undefined)
          )
        );

        // Fetch patient data
        const patientMap = new Map();
        for (const patientId of patientIds) {
          try {
            const patient = await storage.getPatient(patientId!);
            if (patient) {
              patientMap.set(patientId, patient);
            }
          } catch (error) {
            logger.error(`Error fetching patient ${patientId}:`, error);
          }
        }

        // Build CSV data
        const headers = [
          'Case ID',
          'Patient ID',
          'Status',
          'Created At',
          'Lesion Location',
          'Symptoms',
        ];
        const rows = selectedCases.map((c) => [
          c.caseId,
          c.patientId || '',
          c.status || '',
          c.createdAt ? new Date(c.createdAt).toISOString() : '',
          c.lesionLocation || '',
          Array.isArray(c.symptoms) ? c.symptoms.join(', ') : '',
        ]);

        const csv = generateCSV(headers, rows);
        const filename = `bulk_export_${Date.now()}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        res.status(400).json({ error: 'Unsupported format. Use csv.' });
      }
    } catch (error) {
      logger.error('Error in bulk export:', error);
      res.status(500).json({ error: 'Failed to export cases' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
