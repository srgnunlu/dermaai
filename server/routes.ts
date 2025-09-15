import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { analyzeWithGemini } from "./gemini";
import { analyzeWithOpenAI } from "./openai";
import { insertPatientSchema, insertCaseSchema, updateUserSettingsSchema, updateUserProfileSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAdmin } from "./middleware";
import multer from "multer";
import PDFDocument from "pdfkit";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      console.log("GET /api/settings - Authenticated user:", req.user?.claims?.sub);
      
      const userId = req.user.claims.sub;
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
      console.log("Authenticated user:", req.user?.claims?.sub);
      
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
  
  app.get('/api/admin/export/cases', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const cases = await storage.getAllCasesForAdmin();
      
      // Create CSV content
      const csvHeaders = ['Case ID', 'User Email', 'Patient ID', 'Status', 'Created Date', 'Top Diagnosis', 'Confidence', 'Is Urgent'];
      const csvRows = cases.map(c => {
        const topDiagnosis = c.finalDiagnoses && c.finalDiagnoses[0] ? c.finalDiagnoses[0] : null;
        return [
          c.caseId,
          c.user?.email || 'Unknown',
          c.patientId || 'N/A',
          c.status,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
          topDiagnosis?.name || 'N/A',
          topDiagnosis?.confidence || 'N/A',
          topDiagnosis?.isUrgent ? 'Yes' : 'No'
        ];
      });
      
      // Combine headers and rows
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Set response headers for CSV download with cache busting
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cases-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(csvContent);
      
    } catch (error) {
      console.error("Error exporting cases:", error);
      res.status(500).json({ error: "Failed to export cases" });
    }
  });
  
  // Object storage routes
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(404);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
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
      const userId = req.user.claims.sub;
      const newCase = await storage.createCase(caseData, userId);
      
      // Start AI analysis in parallel
      const [geminiResult, openaiResult] = await Promise.allSettled([
        analyzeWithGemini(caseData.imageUrl, caseData.symptoms || "", {
          lesionLocation: caseData.lesionLocation || undefined,
          medicalHistory: (caseData.medicalHistory as string[]) || undefined
        }),
        analyzeWithOpenAI(caseData.imageUrl, caseData.symptoms || "", {
          lesionLocation: caseData.lesionLocation || undefined,
          medicalHistory: (caseData.medicalHistory as string[]) || undefined
        })
      ]);

      let geminiAnalysis = null;
      let openaiAnalysis = null;

      if (geminiResult.status === "fulfilled") {
        geminiAnalysis = geminiResult.value;
      } else {
        console.error("Gemini analysis failed:", geminiResult.reason);
      }

      if (openaiResult.status === "fulfilled") {
        openaiAnalysis = openaiResult.value;
      } else {
        console.error("OpenAI analysis failed:", openaiResult.reason);
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

      res.json(updatedCase);
    } catch (error) {
      console.error("Error analyzing case:", error);
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.get("/api/cases", isAuthenticated, async (req: any, res) => {
    try {
      // Only return cases owned by the authenticated user
      const userId = req.user.claims.sub;
      const cases = await storage.getCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/cases/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const caseRecord = await storage.getCase(req.params.id, userId);
      if (!caseRecord) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Case-Report-${caseRecord.caseId}.pdf"`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);

      // Add header
      doc.fontSize(20)
         .text('Medical Case Report', { align: 'center' })
         .moveDown(2);

      // Case information
      doc.fontSize(14)
         .text(`Case ID: ${caseRecord.caseId}`, { continued: false })
         .text(`Patient ID: ${caseRecord.patientId || 'N/A'}`)
         .text(`Date: ${caseRecord.createdAt ? new Date(caseRecord.createdAt).toLocaleDateString() : 'N/A'}`)
         .text(`Status: ${caseRecord.status}`)
         .moveDown(1);

      // Clinical information
      doc.fontSize(16)
         .text('Clinical Information', { underline: true })
         .moveDown(0.5);

      doc.fontSize(12)
         .text(`Lesion Location: ${caseRecord.lesionLocation || 'Not specified'}`)
         .text(`Symptoms: ${caseRecord.symptoms || 'None reported'}`)
         .moveDown(1);

      // Medical history
      if (caseRecord.medicalHistory && caseRecord.medicalHistory.length > 0) {
        doc.text(`Medical History: ${caseRecord.medicalHistory.join(', ')}`)
           .moveDown(1);
      }

      // AI Diagnosis Results
      if (caseRecord.finalDiagnoses && caseRecord.finalDiagnoses.length > 0) {
        doc.fontSize(16)
           .text('AI Diagnosis Results', { underline: true })
           .moveDown(0.5);

        caseRecord.finalDiagnoses.forEach((diagnosis, index) => {
          doc.fontSize(12)
             .text(`${index + 1}. ${diagnosis.name}`, { continued: false })
             .fontSize(10)
             .text(`   Confidence: ${diagnosis.confidence}%`)
             .text(`   Description: ${diagnosis.description}`)
             .moveDown(0.3);

          if (diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0) {
            doc.text(`   Key Features: ${diagnosis.keyFeatures.join(', ')}`)
               .moveDown(0.3);
          }

          if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
            doc.text(`   Recommendations: ${diagnosis.recommendations.join(', ')}`)
               .moveDown(0.3);
          }

          if (diagnosis.isUrgent) {
            doc.fontSize(10)
               .fillColor('red')
               .text('   ⚠️ URGENT: Requires immediate medical attention', { continued: false })
               .fillColor('black')
               .moveDown(0.5);
          } else {
            doc.moveDown(0.5);
          }
        });
      }

      // Add footer
      doc.fontSize(8)
         .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, doc.page.height - 50, { align: 'center' })
         .text('This report is generated by AI analysis and should be reviewed by a qualified medical professional.', { align: 'center' });

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate report" });
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
