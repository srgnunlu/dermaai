import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { LocalFileStorageService } from './localFileStorage';
import { CloudinaryStorageService } from './cloudinaryStorage';
import { analyzeWithGemini, compareWithGemini } from './gemini';
import { analyzeWithOpenAI } from './openai';
import { insertLesionTrackingSchema, insertLesionSnapshotSchema } from '@shared/schema';
import {
  insertPatientSchema,
  insertCaseSchema,
  updateUserSettingsSchema,
  updateUserProfileSchema,
} from '@shared/schema';
import { setupAuth, isAuthenticated } from './replitAuth';
import { setupMobileAuth } from './mobileAuth';
import { requireAdmin } from './middleware';
import multer from 'multer';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';
import logger from './logger';
import { sanitizeCSVFormula, formatSymptomsForCSV, mapDurationToTurkish } from './utils/csv';
import { sanitizeTextForPDF } from './utils/pdf';
import { lookupCaseWithAuth } from './utils/caseHelpers';
import { mergeAnalysesWithoutConsensus } from './utils/aiAnalysis';
import { sendAnalysisCompleteNotification } from './pushNotifications';
import {
  canUserAnalyze,
  incrementAnalysisCount,
  getUserSubscriptionStatus,
  processRevenueCatWebhook,
  SUBSCRIPTION_LIMITS,
} from './subscriptions';

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Auth middleware - setup Local Auth
  await setupAuth(app);

  // Setup mobile authentication endpoints
  setupMobileAuth(app);

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

  // Push notification token routes
  app.post('/api/push-tokens', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { token, platform, deviceId } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Push token is required' });
      }

      const savedToken = await storage.savePushToken(userId, token, platform, deviceId);
      logger.info(`Push token registered for user ${userId}`);
      res.json({ success: true, tokenId: savedToken.id });
    } catch (error) {
      logger.error('Error registering push token:', error);
      res.status(500).json({ error: 'Failed to register push token' });
    }
  });

  app.delete('/api/push-tokens', isAuthenticated, async (req: any, res) => {
    try {
      const { token } = req.body;

      if (token) {
        // Delete specific token
        await storage.deletePushToken(token);
      } else {
        // Delete all tokens for user (logout from all devices)
        const userId = req.user.id;
        await storage.deleteUserPushTokens(userId);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting push token:', error);
      res.status(500).json({ error: 'Failed to delete push token' });
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
        'Fitzpatrick Cilt Tipi',
        'Durum',
        'Oluşturma Tarihi',
        'Lezyon Lokasyonu',
        'Belirtiler',
        'Ek Belirtiler',
        'Belirti Süresi',
        'Dermatolog Tanısı',
        'Dermatolog Notları',
        'Tanı Tarihi',
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
          patient?.skinType ? sanitizeCSVFormula(patient.skinType) : 'Belirtilmedi',
          c.status === 'pending' ? 'Beklemede' : c.status === 'completed' ? 'Tamamlandı' : c.status,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR') : 'Yok',
          sanitizeCSVFormula(c.lesionLocation) || 'Belirtilmedi',
          formatSymptomsForCSV(c.symptoms as string[]),
          sanitizeCSVFormula(c.additionalSymptoms) || 'Yok',
          mapDurationToTurkish(c.symptomDuration),
          sanitizeCSVFormula(c.dermatologistDiagnosis) || 'Yok',
          sanitizeCSVFormula(c.dermatologistNotes) || 'Yok',
          c.dermatologistDiagnosedAt ? new Date(c.dermatologistDiagnosedAt).toLocaleDateString('tr-TR') : 'Yok',
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

  // Base64 image upload endpoint for mobile apps
  app.post('/api/upload/base64', async (req, res) => {
    try {
      const { base64, filename, mimeType } = req.body;

      if (!base64) {
        return res.status(400).json({ error: 'No base64 data provided' });
      }

      // Remove data URL prefix if present
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const finalFilename = filename || `image-${Date.now()}.jpg`;

      // Use Cloudinary if configured, fallback to local storage
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const cloudinaryService = new CloudinaryStorageService();
        const imageUrl = await cloudinaryService.uploadImage(buffer, finalFilename);
        res.json({ url: imageUrl, filePath: imageUrl });
      } else {
        const fileStorageService = new LocalFileStorageService();
        const filePath = await fileStorageService.saveUploadedFile(
          crypto.randomUUID(),
          buffer,
          finalFilename
        );
        // Return full URL for AI analysis
        // Construct base URL from env vars or request headers
        let baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL;
        if (!baseUrl) {
          // Fallback: construct from request headers
          const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
          const host = req.headers['x-forwarded-host'] || req.headers.host || 'dermaai-1d9i.onrender.com';
          baseUrl = `${protocol}://${host}`;
        }
        const fileUrl = `${baseUrl}/files/${filePath}`;
        res.json({ url: fileUrl, filePath });
      }
    } catch (error) {
      logger.error('Error uploading base64 file:', error);
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

      // Check subscription limits before allowing analysis
      const subscriptionCheck = await canUserAnalyze(userId);
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          error: 'subscription_limit_reached',
          message: subscriptionCheck.reason,
          tier: subscriptionCheck.tier,
          remainingAnalyses: subscriptionCheck.remainingAnalyses,
          upgradeRequired: true,
        });
      }

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

      // Extract language preference from request (default: 'en' for web, mobile can send 'tr')
      const language = (req.body.language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';

      // Check if this is a mobile request and get user's health professional status
      const isMobileRequest = req.body.isMobileRequest === true;
      let isHealthProfessional = false;
      if (isMobileRequest) {
        const currentUser = await storage.getUser(userId);
        isHealthProfessional = currentUser?.isHealthProfessional === true;
      }

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
            language,
            isHealthProfessional,
            isMobileRequest,
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
              language,
              isHealthProfessional,
              isMobileRequest,
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

      // Send push notification if user has registered tokens
      try {
        const userTokens = await storage.getUserPushTokens(userId);
        if (userTokens.length > 0) {
          const tokens = userTokens.map((t) => t.token);
          await sendAnalysisCompleteNotification(tokens, updatedCase.caseId, language);
        }
      } catch (pushError) {
        logger.error('Error sending push notification:', pushError);
        // Don't fail the request if push notification fails
      }

      // Return case plus non-persistent diagnostic info for the UI
      res.json({ ...updatedCase, analysisErrors });
    } catch (error) {
      logger.error('Error analyzing case:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  });

  // Fire-and-forget case submission for mobile (returns immediately, analyzes in background)
  app.post('/api/cases/submit', isAuthenticated, async (req: any, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      const userId = req.user.id;

      // Check subscription limits before allowing analysis
      const subscriptionCheck = await canUserAnalyze(userId);
      if (!subscriptionCheck.allowed) {
        return res.status(403).json({
          error: 'subscription_limit_reached',
          message: subscriptionCheck.reason,
          tier: subscriptionCheck.tier,
          remainingAnalyses: subscriptionCheck.remainingAnalyses,
          upgradeRequired: true,
        });
      }

      // Handle image URLs
      let imageUrls: string[] = [];
      if (caseData.imageUrls && Array.isArray(caseData.imageUrls) && caseData.imageUrls.length > 0) {
        imageUrls = (caseData.imageUrls as string[]).slice(0, 3);
      } else if (caseData.imageUrl) {
        imageUrls = [caseData.imageUrl];
      } else {
        return res.status(400).json({ error: 'At least one image is required' });
      }

      // Create case record with status 'analyzing'
      const caseDataToStore = {
        ...caseData,
        imageUrl: imageUrls[0],
        imageUrls: imageUrls,
      };

      const newCase = await storage.createCase(caseDataToStore, userId);

      // Increment analysis count for subscription tracking
      await incrementAnalysisCount(userId);

      // Update case status to 'analyzing'
      await storage.updateCase(newCase.id, userId, { status: 'analyzing' });

      // Extract language preference
      const language = (req.body.language === 'tr' ? 'tr' : 'en') as 'tr' | 'en';

      // Check if data anonymization is enabled (don't save to history)
      const anonymizeData = req.body.anonymizeData === true;

      // Return immediately - don't wait for analysis
      res.json({
        id: newCase.id,
        caseId: newCase.caseId,
        status: 'analyzing',
        message: language === 'tr'
          ? 'Analiz başlatıldı. Tamamlandığında bildirim alacaksınız.'
          : 'Analysis started. You will receive a notification when complete.',
      });

      // Run analysis in background (fire-and-forget)
      // This code runs AFTER response is sent
      setImmediate(async () => {
        try {
          logger.info(`[Background] Starting analysis for case ${newCase.caseId}`);

          const isMobileRequest = req.body.isMobileRequest === true;
          let isHealthProfessional = false;
          if (isMobileRequest) {
            const currentUser = await storage.getUser(userId);
            isHealthProfessional = currentUser?.isHealthProfessional === true;
          }

          const symptomsString = Array.isArray(caseData.symptoms)
            ? caseData.symptoms.join(', ')
            : caseData.symptoms || '';

          const sys = await storage.getSystemSettings();
          const runGemini = sys.enableGemini !== false;
          const runOpenAI = sys.enableOpenAI !== false;

          if (!runGemini && !runOpenAI) {
            logger.error(`[Background] Analysis disabled for case ${newCase.caseId}`);
            await storage.updateCase(newCase.id, userId, { status: 'failed' });
            return;
          }

          const tasks: Promise<any>[] = [];
          if (runGemini) {
            tasks.push(
              analyzeWithGemini(imageUrls, symptomsString, {
                lesionLocation: caseData.lesionLocation || undefined,
                medicalHistory: (caseData.medicalHistory as string[]) || undefined,
                language,
                isHealthProfessional,
                isMobileRequest,
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
                  language,
                  isHealthProfessional,
                  isMobileRequest,
                },
                {
                  model: sys.openaiModel || undefined,
                  allowFallback: sys.openaiAllowFallback !== false,
                }
              )
            );
          }

          const settled = await Promise.allSettled(tasks);

          let geminiResult: PromiseSettledResult<any> = { status: 'rejected', reason: 'Not run' } as any;
          let openaiResult: PromiseSettledResult<any> = { status: 'rejected', reason: 'Not run' } as any;
          let idx = 0;
          if (runGemini) geminiResult = settled[idx++];
          if (runOpenAI) openaiResult = settled[idx++];

          let geminiAnalysis = null;
          let openaiAnalysis = null;

          if (geminiResult.status === 'fulfilled' && !(geminiResult.value as any).error) {
            geminiAnalysis = geminiResult.value;
          }
          if (openaiResult.status === 'fulfilled' && !(openaiResult.value as any).error) {
            openaiAnalysis = openaiResult.value;
          }

          // Update case with results
          await storage.updateCase(newCase.id, userId, {
            geminiAnalysis,
            openaiAnalysis,
            finalDiagnoses: null,
            status: 'completed',
          });

          logger.info(`[Background] Analysis completed for case ${newCase.caseId}`);

          // Send push notification - always send, even for anonymized cases
          // (anonymized cases are now marked as hidden instead of deleted, so they're still accessible)
          try {
            const userTokens = await storage.getUserPushTokens(userId);
            if (userTokens.length > 0) {
              const tokens = userTokens.map((t) => t.token);
              await sendAnalysisCompleteNotification(tokens, newCase.caseId, language);
              logger.info(`[Background] Push notification sent for case ${newCase.caseId}`);
            }
          } catch (pushError) {
            logger.error('[Background] Push notification failed:', pushError);
          }

          // If anonymization is enabled, mark the case as hidden (won't appear in history)
          // Instead of deleting, we set isHidden=true so results can still be displayed
          if (anonymizeData) {
            try {
              await storage.updateCase(newCase.id, userId, { isHidden: true });
              logger.info(`[Background] Case ${newCase.caseId} marked as hidden due to anonymization setting`);
            } catch (hideError) {
              logger.error('[Background] Failed to hide anonymized case:', hideError);
            }
          }
        } catch (bgError) {
          logger.error(`[Background] Analysis failed for case ${newCase.caseId}:`, bgError);
          try {
            await storage.updateCase(newCase.id, userId, { status: 'failed' });
          } catch (updateError) {
            logger.error('[Background] Failed to update case status:', updateError);
          }
        }
      });
    } catch (error) {
      logger.error('Error submitting case:', error);
      res.status(500).json({ error: 'Failed to submit case' });
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
      const idParam = req.params.id;

      // Support both internal id and caseId (DR-2025-...) formats
      let caseRecord;
      if (idParam.startsWith('DR-')) {
        caseRecord = await storage.getCaseByCaseId(idParam, userId);
      } else {
        caseRecord = await storage.getCase(idParam, userId);
      }

      if (!caseRecord) {
        return res.status(403).json({ error: 'Access denied' });
      }
      res.json(caseRecord);
    } catch (error) {
      logger.error('Error fetching case:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete case endpoint (user-facing)
  app.delete('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const idParam = req.params.id;

      // Support both internal id and caseId (DR-2025-...) formats
      let existingCase;
      if (idParam.startsWith('DR-')) {
        existingCase = await storage.getCaseByCaseId(idParam, userId);
      } else {
        existingCase = await storage.getCase(idParam, userId);
      }

      if (!existingCase) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete using internal id
      const success = await storage.deleteCase(existingCase.id);

      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: 'Failed to delete case' });
      }
    } catch (error) {
      logger.error('Error deleting case:', error);
      res.status(500).json({ error: 'Failed to delete case' });
    }
  });

  // Select AI provider for case diagnosis (mobile endpoint)
  app.patch('/api/mobile/cases/:id/select-provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const idParam = req.params.id;
      const { provider } = req.body;

      // Validate provider
      if (!provider || !['gemini', 'openai'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider. Must be "gemini" or "openai"' });
      }

      // Support both internal id and caseId (DR-2025-...) formats
      let existingCase;
      if (idParam.startsWith('DR-')) {
        existingCase = await storage.getCaseByCaseId(idParam, userId);
      } else {
        existingCase = await storage.getCase(idParam, userId);
      }

      if (!existingCase) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update the selected provider using internal id
      const updatedCase = await storage.updateCase(existingCase.id, userId, {
        selectedAnalysisProvider: provider,
      });

      res.json(updatedCase);
    } catch (error) {
      logger.error('Error selecting analysis provider:', error);
      res.status(500).json({ error: 'Failed to update provider selection' });
    }
  });

  // Toggle favorite status for a case (Pro feature)
  app.patch('/api/mobile/cases/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const idParam = req.params.id;
      const { isFavorite } = req.body;

      // Validate isFavorite
      if (typeof isFavorite !== 'boolean') {
        return res.status(400).json({ error: 'isFavorite must be a boolean' });
      }

      // Support both internal id and caseId (DR-2025-...) formats
      let existingCase;
      if (idParam.startsWith('DR-')) {
        existingCase = await storage.getCaseByCaseId(idParam, userId);
      } else {
        existingCase = await storage.getCase(idParam, userId);
      }

      if (!existingCase) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update the favorite status
      const updatedCase = await storage.updateCase(existingCase.id, userId, {
        isFavorite,
      });

      res.json(updatedCase);
    } catch (error) {
      logger.error('Error updating favorite status:', error);
      res.status(500).json({ error: 'Failed to update favorite status' });
    }
  });

  // Update user notes for a case (Pro feature)
  app.patch('/api/mobile/cases/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const idParam = req.params.id;
      const { notes } = req.body;

      // Validate notes (can be null/empty to clear)
      if (notes !== null && notes !== undefined && typeof notes !== 'string') {
        return res.status(400).json({ error: 'notes must be a string or null' });
      }

      // Support both internal id and caseId (DR-2025-...) formats
      let existingCase;
      if (idParam.startsWith('DR-')) {
        existingCase = await storage.getCaseByCaseId(idParam, userId);
      } else {
        existingCase = await storage.getCase(idParam, userId);
      }

      if (!existingCase) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update the notes
      const updatedCase = await storage.updateCase(existingCase.id, userId, {
        userNotes: notes || null,
      });

      res.json(updatedCase);
    } catch (error) {
      logger.error('Error updating case notes:', error);
      res.status(500).json({ error: 'Failed to update notes' });
    }
  });

  // Dermatologist diagnosis endpoints
  app.post('/api/cases/:id/dermatologist-diagnosis', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const caseId = req.params.id;
      const { updateDermatologistDiagnosisSchema } = await import('@shared/schema');
      const diagnosisData = updateDermatologistDiagnosisSchema.parse(req.body);

      const updatedCase = await storage.updateCaseDermatologistDiagnosis(
        caseId,
        userId,
        diagnosisData.dermatologistDiagnosis,
        diagnosisData.dermatologistNotes
      );

      if (!updatedCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      res.json(updatedCase);
    } catch (error) {
      logger.error('Error saving dermatologist diagnosis:', error);
      res.status(500).json({ error: 'Failed to save diagnosis' });
    }
  });

  app.get('/api/dermatologist/cases', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Get all cases without AI analysis data for blind review
      const cases = await storage.getCasesForDermatologist();
      res.json(cases);
    } catch (error) {
      logger.error('Error fetching dermatologist cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
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

      // Case Information Section - Professional Grid Layout
      const boxStartY = doc.y;
      const boxWidth = pageWidth - 80;
      const boxHeight = 90;

      // Draw box background
      doc
        .rect(40, boxStartY, boxWidth, boxHeight)
        .fillAndStroke('#f8f9fa', '#1a5490');

      // Section title
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('CASE INFORMATION'), 50, boxStartY + 10);

      // Draw divider line
      doc
        .moveTo(50, boxStartY + 28)
        .lineTo(pageWidth - 50, boxStartY + 28)
        .stroke('#dee2e6');

      // Grid layout for case info (2 columns)
      const col1X = 50;
      const col2X = pageWidth / 2 + 20;
      let currentInfoY = boxStartY + 38;

      doc.fillColor('#000000').fontSize(9);

      // Column 1
      doc
        .font('Helvetica-Bold')
        .text('Case ID:', col1X, currentInfoY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(caseRecord.caseId)}`);

      currentInfoY += 15;
      doc
        .font('Helvetica-Bold')
        .text('Patient ID:', col1X, currentInfoY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(caseRecord.patientId || 'N/A')}`);

      // Column 2
      currentInfoY = boxStartY + 38;
      doc
        .font('Helvetica-Bold')
        .text('Date:', col2X, currentInfoY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(caseRecord.createdAt ? new Date(caseRecord.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A')}`);

      currentInfoY += 15;
      doc
        .font('Helvetica-Bold')
        .text('Status:', col2X, currentInfoY, { continued: true })
        .font('Helvetica')
        .fillColor(caseRecord.status === 'completed' ? '#22c55e' : '#f59e0b')
        .text(` ${sanitizeTextForPDF(caseRecord.status === 'completed' ? 'Completed' : 'Pending')}`);

      doc.fillColor('#000000');
      doc.y = boxStartY + boxHeight + 20;

      // Clinical Information Section - Card Style
      const clinicalStartY = doc.y;
      const clinicalHeight = 110;

      // Draw card background
      doc
        .rect(40, clinicalStartY, boxWidth, clinicalHeight)
        .fillAndStroke('#f8f9fa', '#1a5490');

      // Section title
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('CLINICAL INFORMATION'), 50, clinicalStartY + 10);

      // Draw divider line
      doc
        .moveTo(50, clinicalStartY + 28)
        .lineTo(pageWidth - 50, clinicalStartY + 28)
        .stroke('#dee2e6');

      let clinicalY = clinicalStartY + 38;
      doc.fillColor('#000000').fontSize(9);

      // Lesion Location
      doc
        .font('Helvetica-Bold')
        .text('Lesion Location:', 50, clinicalY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(caseRecord.lesionLocation || 'Not specified')}`);

      clinicalY += 15;

      // Symptoms
      doc
        .font('Helvetica-Bold')
        .text('Symptoms:', 50, clinicalY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(Array.isArray(caseRecord.symptoms) ? caseRecord.symptoms.join(', ') : caseRecord.symptoms || 'None reported')}`);

      clinicalY += 15;

      // Duration
      doc
        .font('Helvetica-Bold')
        .text('Duration:', 50, clinicalY, { continued: true })
        .font('Helvetica')
        .text(` ${sanitizeTextForPDF(caseRecord.symptomDuration || 'Not specified')}`);

      clinicalY += 15;

      // Additional Symptoms (if any)
      if (caseRecord.additionalSymptoms) {
        doc
          .font('Helvetica-Bold')
          .text('Additional Symptoms:', 50, clinicalY, { continued: true })
          .font('Helvetica')
          .text(` ${sanitizeTextForPDF(caseRecord.additionalSymptoms)}`);
        clinicalY += 15;
      }

      // Medical History (if any)
      if (caseRecord.medicalHistory && caseRecord.medicalHistory.length > 0) {
        doc
          .font('Helvetica-Bold')
          .text('Medical History:', 50, clinicalY, { continued: true })
          .font('Helvetica')
          .text(` ${sanitizeTextForPDF(caseRecord.medicalHistory.join(', '))}`);
      }

      doc.y = clinicalStartY + clinicalHeight + 20;

      // Lesion Images Section - Page 1
      const imageUrls = (caseRecord as any).imageUrls && Array.isArray((caseRecord as any).imageUrls)
        ? (caseRecord as any).imageUrls
        : caseRecord.imageUrl
          ? [caseRecord.imageUrl]
          : [];

      if (imageUrls && imageUrls.length > 0) {
        // Section divider
        doc
          .moveTo(40, doc.y)
          .lineTo(pageWidth - 40, doc.y)
          .stroke('#dee2e6');

        doc.moveDown(0.5);

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

        // Calculate image size based on count
        let imageWidth: number;
        let imageHeight: number;

        if (imageUrls.length === 1) {
          imageWidth = 350;
          imageHeight = 280;
        } else if (imageUrls.length === 2) {
          imageWidth = 240;
          imageHeight = 200;
        } else {
          imageWidth = 160;
          imageHeight = 140;
        }

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
              doc.image(Buffer.from(imageBase64, 'base64'), {
                fit: [imageWidth, imageHeight],
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
      }

      // PAGE 2: Gemini Analysis (dedicated page)
      doc.addPage();

      // Helper function to draw confidence bar
      const drawConfidenceBar = (x: number, y: number, width: number, confidence: number, color: string) => {
        const barWidth = (confidence / 100) * width;
        doc.rect(x, y, width, 8).fillAndStroke('#e5e7eb', '#d1d5db');
        doc.rect(x, y, barWidth, 8).fillAndStroke(color, color);
      };

      // Gemini Analysis Page
      if (caseRecord.geminiAnalysis?.diagnoses && caseRecord.geminiAnalysis.diagnoses.length > 0) {
        // Page header
        doc
          .rect(40, 40, pageWidth - 80, 30)
          .fillAndStroke('#9333ea', '#9333ea');

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(sanitizeTextForPDF('GEMINI 2.5 FLASH ANALYSIS'), 50, 50);

        doc.y = 85;
        doc.fillColor('#000000');

        // Display each diagnosis with full details
        caseRecord.geminiAnalysis.diagnoses.slice(0, 5).forEach((diagnosis: any, index: number) => {
          const startY = doc.y;

          // Check if we need a new page (keeping 100px margin at bottom)
          if (startY > doc.page.height - 150) {
            doc.addPage();
            doc.y = 50;
          }

          const cardY = doc.y;

          // Diagnosis header
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#9333ea')
            .text(`${index + 1}. ${sanitizeTextForPDF(diagnosis.name)}`, 50, cardY);

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#9333ea')
            .text(`${diagnosis.confidence}%`, pageWidth - 80, cardY);

          doc.y = cardY + 15;

          // Confidence bar
          drawConfidenceBar(50, doc.y, pageWidth - 100, diagnosis.confidence, '#9333ea');
          doc.y += 15;

          // Description
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(sanitizeTextForPDF(diagnosis.description || 'N/A'), 50, doc.y, {
              width: pageWidth - 100,
            });

          doc.moveDown(0.5);

          // Key Features
          if (diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0) {
            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#9333ea')
              .text('Key Features:', 50, doc.y);

            doc.moveDown(0.3);

            diagnosis.keyFeatures.forEach((feature: string) => {
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#000000')
                .text(`• ${sanitizeTextForPDF(feature)}`, 60, doc.y, {
                  width: pageWidth - 120,
                });
              doc.moveDown(0.3);
            });
          }

          // Recommendations
          if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
            doc.moveDown(0.3);
            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#9333ea')
              .text('Recommendations:', 50, doc.y);

            doc.moveDown(0.3);

            diagnosis.recommendations.forEach((rec: string) => {
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#000000')
                .text(`• ${sanitizeTextForPDF(rec)}`, 60, doc.y, {
                  width: pageWidth - 120,
                });
              doc.moveDown(0.3);
            });
          }

          // Divider between diagnoses
          if (index < 4) {
            doc.moveDown(0.5);
            doc
              .moveTo(50, doc.y)
              .lineTo(pageWidth - 50, doc.y)
              .stroke('#e5e7eb');
            doc.moveDown(0.5);
          }
        });
      } else {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text('No Gemini analysis available', 50, 100);
      }

      // PAGE 3: OpenAI Analysis (dedicated page)
      doc.addPage();

      if (caseRecord.openaiAnalysis?.diagnoses && caseRecord.openaiAnalysis.diagnoses.length > 0) {
        // Page header
        doc
          .rect(40, 40, pageWidth - 80, 30)
          .fillAndStroke('#16a34a', '#16a34a');

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(sanitizeTextForPDF('GPT-5 MINI ANALYSIS'), 50, 50);

        doc.y = 85;
        doc.fillColor('#000000');

        // Display each diagnosis with full details
        caseRecord.openaiAnalysis.diagnoses.slice(0, 5).forEach((diagnosis: any, index: number) => {
          const startY = doc.y;

          // Check if we need a new page (keeping 100px margin at bottom)
          if (startY > doc.page.height - 150) {
            doc.addPage();
            doc.y = 50;
          }

          const cardY = doc.y;

          // Diagnosis header
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#16a34a')
            .text(`${index + 1}. ${sanitizeTextForPDF(diagnosis.name)}`, 50, cardY);

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#16a34a')
            .text(`${diagnosis.confidence}%`, pageWidth - 80, cardY);

          doc.y = cardY + 15;

          // Confidence bar
          drawConfidenceBar(50, doc.y, pageWidth - 100, diagnosis.confidence, '#16a34a');
          doc.y += 15;

          // Description
          doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(sanitizeTextForPDF(diagnosis.description || 'N/A'), 50, doc.y, {
              width: pageWidth - 100,
            });

          doc.moveDown(0.5);

          // Key Features
          if (diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0) {
            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#16a34a')
              .text('Key Features:', 50, doc.y);

            doc.moveDown(0.3);

            diagnosis.keyFeatures.forEach((feature: string) => {
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#000000')
                .text(`• ${sanitizeTextForPDF(feature)}`, 60, doc.y, {
                  width: pageWidth - 120,
                });
              doc.moveDown(0.3);
            });
          }

          // Recommendations
          if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
            doc.moveDown(0.3);
            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#16a34a')
              .text('Recommendations:', 50, doc.y);

            doc.moveDown(0.3);

            diagnosis.recommendations.forEach((rec: string) => {
              doc
                .fontSize(8)
                .font('Helvetica')
                .fillColor('#000000')
                .text(`• ${sanitizeTextForPDF(rec)}`, 60, doc.y, {
                  width: pageWidth - 120,
                });
              doc.moveDown(0.3);
            });
          }

          // Divider between diagnoses
          if (index < 4) {
            doc.moveDown(0.5);
            doc
              .moveTo(50, doc.y)
              .lineTo(pageWidth - 50, doc.y)
              .stroke('#e5e7eb');
            doc.moveDown(0.5);
          }
        });
      } else {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#6b7280')
          .text('No OpenAI analysis available', 50, 100);
      }

      // PAGE 4: Final page with disclaimers
      doc.addPage();

      // Final page header
      doc
        .rect(40, 40, pageWidth - 80, 30)
        .fillAndStroke('#1a5490', '#1a5490');

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text(sanitizeTextForPDF('IMPORTANT INFORMATION'), 50, 50);

      doc.y = 90;
      doc.fillColor('#000000');

      // Medical Disclaimer Box
      doc
        .rect(40, doc.y, pageWidth - 80, 180)
        .fillAndStroke('#fff3cd', '#ffc107');

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#856404')
        .text(sanitizeTextForPDF('MEDICAL DISCLAIMER'), 50, doc.y + 15);

      doc.y += 35;

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
          sanitizeTextForPDF(
            'This report is generated by artificial intelligence (AI) analysis and is intended for informational and educational purposes only. It should NOT be used as a substitute for professional medical advice, diagnosis, or treatment.'
          ),
          50,
          doc.y,
          { width: pageWidth - 100 }
        );

      doc.moveDown(1);

      doc.text(
        sanitizeTextForPDF(
          'Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of information provided in this AI-generated report.'
        ),
        50,
        doc.y,
        { width: pageWidth - 100 }
      );

      doc.moveDown(1);

      doc.text(
        sanitizeTextForPDF(
          'The AI models used in this analysis are trained on medical literature and images, but they are not infallible and should be used only as a supplementary tool in clinical decision-making.'
        ),
        50,
        doc.y,
        { width: pageWidth - 100 }
      );

      doc.y += 50;

      // About the Models
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('About the AI Models'), 50, doc.y);

      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
          sanitizeTextForPDF(
            '• Gemini 2.5 Flash: Google\'s advanced vision-language model specialized in image analysis'
          ),
          50,
          doc.y,
          { width: pageWidth - 100 }
        );

      doc.moveDown(0.5);

      doc.text(
        sanitizeTextForPDF(
          '• GPT-5 Mini: OpenAI\'s efficient multimodal model with dermatological knowledge'
        ),
        50,
        doc.y,
        { width: pageWidth - 100 }
      );

      doc.moveDown(1.5);

      // Report Information
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a5490')
        .text(sanitizeTextForPDF('Report Information'), 50, doc.y);

      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(
          sanitizeTextForPDF(
            `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}`
          ),
          50,
          doc.y
        );

      doc.moveDown(0.3);

      doc.text(
        sanitizeTextForPDF(`Case ID: ${caseRecord.caseId}`),
        50,
        doc.y
      );

      doc.moveDown(0.3);

      doc.text(
        sanitizeTextForPDF('System: DermaAI - AI-Powered Dermatological Analysis Platform'),
        50,
        doc.y
      );

      // Professional Footer with page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        // Footer background
        doc
          .rect(0, doc.page.height - 60, doc.page.width, 60)
          .fill('#f5f5f5');

        // Footer content
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
            50,
            doc.page.height - 35,
            { align: 'center', width: doc.page.width - 100 }
          );

        // Page number
        doc
          .fontSize(8)
          .fillColor('#1a5490')
          .text(
            `Page ${i + 1} of ${pages.count}`,
            0,
            doc.page.height - 50,
            { align: 'right', width: doc.page.width - 50 }
          );
      }

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

  // AI Selection Statistics - Track which AI provider users prefer
  app.get('/api/admin/analytics/ai-selection', requireAdmin, async (_req, res) => {
    try {
      const stats = await storage.getAnalyticsAISelectionStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching AI selection stats:', error);
      res.status(500).json({ error: 'Failed to fetch AI selection statistics' });
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

  // ==========================================
  // Subscription Management Routes
  // ==========================================

  // Get user's subscription status
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const status = await getUserSubscriptionStatus(userId);
      res.json(status);
    } catch (error) {
      logger.error('Error fetching subscription status:', error);
      res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  });

  // Get subscription limits info (public - for paywall display)
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      res.json({
        plans: {
          free: {
            name: 'Free',
            monthlyAnalysisLimit: SUBSCRIPTION_LIMITS.free.monthlyAnalysisLimit,
            historyDays: SUBSCRIPTION_LIMITS.free.historyDays,
            aiProviders: SUBSCRIPTION_LIMITS.free.aiProviders,
            pdfReport: SUBSCRIPTION_LIMITS.free.pdfReport,
            pushNotifications: SUBSCRIPTION_LIMITS.free.pushNotifications,
          },
          basic: {
            name: 'Basic',
            monthlyAnalysisLimit: SUBSCRIPTION_LIMITS.basic.monthlyAnalysisLimit,
            historyDays: SUBSCRIPTION_LIMITS.basic.historyDays,
            aiProviders: SUBSCRIPTION_LIMITS.basic.aiProviders,
            pdfReport: SUBSCRIPTION_LIMITS.basic.pdfReport,
            pushNotifications: SUBSCRIPTION_LIMITS.basic.pushNotifications,
          },
          pro: {
            name: 'Pro',
            monthlyAnalysisLimit: SUBSCRIPTION_LIMITS.pro.monthlyAnalysisLimit,
            historyDays: SUBSCRIPTION_LIMITS.pro.historyDays,
            aiProviders: SUBSCRIPTION_LIMITS.pro.aiProviders,
            pdfReport: SUBSCRIPTION_LIMITS.pro.pdfReport,
            pushNotifications: SUBSCRIPTION_LIMITS.pro.pushNotifications,
            priorityAnalysis: (SUBSCRIPTION_LIMITS.pro as any).priorityAnalysis,
            patientManagement: (SUBSCRIPTION_LIMITS.pro as any).patientManagement,
          },
        },
        productIds: {
          basic_monthly: 'corio_basic_monthly',
          basic_yearly: 'corio_basic_yearly',
          pro_monthly: 'corio_pro_monthly',
          pro_yearly: 'corio_pro_yearly',
        },
      });
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
  });

  // ==========================================
  // Lesion Tracking Routes (Pro Feature)
  // ==========================================

  // Helper to check if user is Pro
  const requireProSubscription = async (userId: string): Promise<boolean> => {
    const status = await getUserSubscriptionStatus(userId);
    return status.tier === 'pro';
  };

  // Get all lesion trackings for user
  app.get('/api/lesion-trackings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Check Pro subscription
      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const trackings = await storage.getUserLesionTrackings(userId);
      res.json(trackings);
    } catch (error) {
      logger.error('Error fetching lesion trackings:', error);
      res.status(500).json({ error: 'Failed to fetch lesion trackings' });
    }
  });

  // Get single lesion tracking with all snapshots and comparisons
  app.get('/api/lesion-trackings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const data = await storage.getLesionTrackingWithSnapshots(id, userId);
      if (!data) {
        return res.status(404).json({ error: 'Lesion tracking not found' });
      }

      res.json(data);
    } catch (error) {
      logger.error('Error fetching lesion tracking:', error);
      res.status(500).json({ error: 'Failed to fetch lesion tracking' });
    }
  });

  // Create new lesion tracking from an existing case
  app.post('/api/lesion-trackings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const trackingData = insertLesionTrackingSchema.parse(req.body);
      
      // Create the tracking
      const tracking = await storage.createLesionTracking(trackingData, userId);

      // If initialCaseId is provided, create the first snapshot
      if (trackingData.initialCaseId) {
        const initialCase = await storage.getCase(trackingData.initialCaseId, userId);
        if (initialCase) {
          // Use original case creation date, not today's date
          const originalDate = initialCase.createdAt ? new Date(initialCase.createdAt) : undefined;
          await storage.createLesionSnapshot({
            lesionTrackingId: tracking.id,
            caseId: initialCase.id,
            imageUrls: initialCase.imageUrls || (initialCase.imageUrl ? [initialCase.imageUrl] : []),
            notes: null,
          }, originalDate);
        }
      }

      res.status(201).json(tracking);
    } catch (error) {
      logger.error('Error creating lesion tracking:', error);
      res.status(400).json({ error: 'Failed to create lesion tracking' });
    }
  });

  // Update lesion tracking
  app.patch('/api/lesion-trackings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const { name, bodyLocation, description, status } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (bodyLocation !== undefined) updates.bodyLocation = bodyLocation;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;

      const updated = await storage.updateLesionTracking(id, userId, updates);
      res.json(updated);
    } catch (error) {
      logger.error('Error updating lesion tracking:', error);
      res.status(400).json({ error: 'Failed to update lesion tracking' });
    }
  });

  // Delete lesion tracking
  app.delete('/api/lesion-trackings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const success = await storage.deleteLesionTracking(id, userId);
      if (!success) {
        return res.status(404).json({ error: 'Lesion tracking not found' });
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting lesion tracking:', error);
      res.status(500).json({ error: 'Failed to delete lesion tracking' });
    }
  });

  // Add new snapshot to tracking (with optional comparison)
  app.post('/api/lesion-trackings/:id/snapshots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id: trackingId } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      // Verify tracking ownership
      const tracking = await storage.getLesionTracking(trackingId, userId);
      if (!tracking) {
        return res.status(404).json({ error: 'Lesion tracking not found' });
      }

      const { caseId, imageUrls, notes, runComparison = true, language = 'tr' } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'At least one image URL is required' });
      }

      // Get user settings to check if health professional
      const userSettings = await storage.getUserSettings(userId);
      const isHealthProfessional = userSettings?.isHealthProfessional ?? false;

      // Create the snapshot
      const snapshot = await storage.createLesionSnapshot({
        lesionTrackingId: trackingId,
        caseId: caseId || null,
        imageUrls,
        notes: notes || null,
      });

      // If runComparison is true and there's a previous snapshot, run AI comparison
      let comparison = null;
      if (runComparison) {
        const allSnapshots = await storage.getLesionSnapshots(trackingId);
        if (allSnapshots.length >= 2) {
          const previousSnapshot = allSnapshots[allSnapshots.length - 2]; // Second to last

          if (previousSnapshot.imageUrls && previousSnapshot.imageUrls.length > 0) {
            try {
              // Get previous case for diagnosis info and original date
              let previousDiagnosis = undefined;
              let previousDate = previousSnapshot.createdAt?.toISOString().split('T')[0] || '';
              
              if (previousSnapshot.caseId) {
                const prevCase = await storage.getCaseForAdmin(previousSnapshot.caseId);
                if (prevCase) {
                  // Use the original case creation date, not snapshot creation date
                  if (prevCase.createdAt) {
                    previousDate = prevCase.createdAt.toISOString().split('T')[0];
                  }
                  if (prevCase.geminiAnalysis?.diagnoses?.[0]) {
                    const diag = prevCase.geminiAnalysis.diagnoses[0];
                    previousDiagnosis = {
                      name: diag.name,
                      confidence: diag.confidence,
                      keyFeatures: diag.keyFeatures || [],
                    };
                  }
                }
              }

              // Run Gemini comparison
              const comparisonResult = await compareWithGemini(imageUrls, {
                lesionName: tracking.name,
                bodyLocation: tracking.bodyLocation || undefined,
                language: language as 'tr' | 'en',
                isHealthProfessional,
                previousAnalysis: {
                  date: previousDate,
                  imageUrls: previousSnapshot.imageUrls,
                  topDiagnosis: previousDiagnosis,
                },
              });

              // Save comparison
              comparison = await storage.createLesionComparison({
                lesionTrackingId: trackingId,
                previousSnapshotId: previousSnapshot.id,
                currentSnapshotId: snapshot.id,
                comparisonAnalysis: comparisonResult,
              });

              // Update tracking status based on risk level
              if (comparisonResult.riskLevel === 'high') {
                await storage.updateLesionTracking(trackingId, userId, { status: 'urgent' });
              }

              logger.info(`[LesionTracking] Comparison completed for tracking ${trackingId}`);
            } catch (compError) {
              logger.error('Error running lesion comparison:', compError);
              // Don't fail the whole request if comparison fails
            }
          }
        }
      }

      res.status(201).json({
        snapshot,
        comparison,
      });
    } catch (error) {
      logger.error('Error adding lesion snapshot:', error);
      res.status(500).json({ error: 'Failed to add snapshot' });
    }
  });

  // Get comparison details
  app.get('/api/lesion-comparisons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const comparison = await storage.getLesionComparison(id);
      if (!comparison) {
        return res.status(404).json({ error: 'Comparison not found' });
      }

      // Verify user owns this comparison's tracking
      const tracking = await storage.getLesionTracking(comparison.lesionTrackingId, userId);
      if (!tracking) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get snapshot details
      const [prevSnapshot, currSnapshot] = await Promise.all([
        storage.getLesionSnapshot(comparison.previousSnapshotId),
        storage.getLesionSnapshot(comparison.currentSnapshotId),
      ]);

      res.json({
        comparison,
        previousSnapshot: prevSnapshot,
        currentSnapshot: currSnapshot,
        tracking,
      });
    } catch (error) {
      logger.error('Error fetching comparison:', error);
      res.status(500).json({ error: 'Failed to fetch comparison' });
    }
  });

  // Manually trigger comparison between two snapshots
  app.post('/api/lesion-trackings/:id/compare', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id: trackingId } = req.params;

      const isPro = await requireProSubscription(userId);
      if (!isPro) {
        return res.status(403).json({
          error: 'pro_required',
          message: 'Lesion tracking is a Pro feature. Please upgrade to access.',
        });
      }

      const tracking = await storage.getLesionTracking(trackingId, userId);
      if (!tracking) {
        return res.status(404).json({ error: 'Lesion tracking not found' });
      }

      const { previousSnapshotId, currentSnapshotId, language = 'tr' } = req.body;

      if (!previousSnapshotId || !currentSnapshotId) {
        return res.status(400).json({ error: 'Both previousSnapshotId and currentSnapshotId are required' });
      }

      const [prevSnapshot, currSnapshot] = await Promise.all([
        storage.getLesionSnapshot(previousSnapshotId),
        storage.getLesionSnapshot(currentSnapshotId),
      ]);

      if (!prevSnapshot || !currSnapshot) {
        return res.status(404).json({ error: 'One or both snapshots not found' });
      }

      if (!prevSnapshot.imageUrls?.length || !currSnapshot.imageUrls?.length) {
        return res.status(400).json({ error: 'Both snapshots must have images' });
      }

      // Get user settings to check if health professional
      const userSettings = await storage.getUserSettings(userId);
      const isHealthProfessional = userSettings?.isHealthProfessional ?? false;

      // Get previous diagnosis info and original date
      let previousDiagnosis = undefined;
      let previousDate = prevSnapshot.createdAt?.toISOString().split('T')[0] || '';
      
      if (prevSnapshot.caseId) {
        const prevCase = await storage.getCaseForAdmin(prevSnapshot.caseId);
        if (prevCase) {
          // Use the original case creation date, not snapshot creation date
          if (prevCase.createdAt) {
            previousDate = prevCase.createdAt.toISOString().split('T')[0];
          }
          if (prevCase.geminiAnalysis?.diagnoses?.[0]) {
            const diag = prevCase.geminiAnalysis.diagnoses[0];
            previousDiagnosis = {
              name: diag.name,
              confidence: diag.confidence,
              keyFeatures: diag.keyFeatures || [],
            };
          }
        }
      }

      // Run comparison
      const comparisonResult = await compareWithGemini(currSnapshot.imageUrls, {
        lesionName: tracking.name,
        bodyLocation: tracking.bodyLocation || undefined,
        language: language as 'tr' | 'en',
        isHealthProfessional,
        previousAnalysis: {
          date: previousDate,
          imageUrls: prevSnapshot.imageUrls,
          topDiagnosis: previousDiagnosis,
        },
      });

      // Save comparison
      const comparison = await storage.createLesionComparison({
        lesionTrackingId: trackingId,
        previousSnapshotId: prevSnapshot.id,
        currentSnapshotId: currSnapshot.id,
        comparisonAnalysis: comparisonResult,
      });

      // Update tracking status based on risk level
      if (comparisonResult.riskLevel === 'high') {
        await storage.updateLesionTracking(trackingId, userId, { status: 'urgent' });
      }

      res.json({
        comparison,
        analysis: comparisonResult,
      });
    } catch (error) {
      logger.error('Error running manual comparison:', error);
      res.status(500).json({ error: 'Failed to run comparison' });
    }
  });

  // RevenueCat Webhook endpoint
  // This endpoint receives purchase events from RevenueCat
  app.post('/api/webhooks/revenuecat', async (req, res) => {
    try {
      // Verify webhook authorization
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.REVENUECAT_WEBHOOK_SECRET;

      if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
        logger.warn('[RevenueCat] Invalid webhook authorization');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const event = req.body.event;

      if (!event) {
        return res.status(400).json({ error: 'No event data provided' });
      }

      logger.info(`[RevenueCat] Received webhook event: ${event.type}`);

      await processRevenueCatWebhook({
        type: event.type,
        app_user_id: event.app_user_id,
        product_id: event.product_id,
        expiration_at_ms: event.expiration_at_ms,
      });

      res.json({ received: true });
    } catch (error) {
      logger.error('Error processing RevenueCat webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
