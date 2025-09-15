import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { analyzeWithGemini } from "./gemini";
import { analyzeWithOpenAI } from "./openai";
import { insertPatientSchema, insertCaseSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.post("/api/cases/analyze", async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      
      // Create case record
      const newCase = await storage.createCase(caseData);
      
      // Start AI analysis in parallel
      const [geminiResult, openaiResult] = await Promise.allSettled([
        analyzeWithGemini(caseData.imageUrl, caseData.symptoms || "", {
          lesionLocation: caseData.lesionLocation,
          medicalHistory: caseData.medicalHistory
        }),
        analyzeWithOpenAI(caseData.imageUrl, caseData.symptoms || "", {
          lesionLocation: caseData.lesionLocation,
          medicalHistory: caseData.medicalHistory
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
      const updatedCase = await storage.updateCase(newCase.id, {
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

  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getCases();
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ error: "Case not found" });
      }
      res.json(caseRecord);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ error: "Internal server error" });
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
