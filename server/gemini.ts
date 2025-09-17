import { GoogleGenAI } from "@google/genai";

// the newest Gemini model is "gemini-2.5-flash" - do not change this unless explicitly requested by the user
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

interface DiagnosisResult {
  name: string;
  confidence: number;
  description: string;
  keyFeatures: string[];
  recommendations: string[];
}

interface AnalysisContext {
  lesionLocation?: string;
  medicalHistory?: string[];
}

export async function analyzeWithGemini(
  imageUrl: string,
  symptoms: string,
  context: AnalysisContext = {}
): Promise<{
  diagnoses: DiagnosisResult[];
  analysisTime: number;
}> {
  const startTime = Date.now();

  try {
    let file;
    
    // Check if it's a Cloudinary URL
    if (imageUrl.includes('cloudinary.com')) {
      const { CloudinaryStorageService } = await import("./cloudinaryStorage");
      const cloudinaryService = new CloudinaryStorageService();
      file = await cloudinaryService.getObjectEntityFile(imageUrl);
    } else {
      // Use local file storage
      const { LocalFileStorageService } = await import("./localFileStorage");
      const fileStorageService = new LocalFileStorageService();
      const normalizedPath = fileStorageService.normalizeObjectEntityPath(imageUrl);
      file = await fileStorageService.getObjectEntityFile(normalizedPath);
    }
    
    // Get image data and metadata directly from the file
    const [imageBuffer] = await file.download();
    const [metadata] = await file.getMetadata();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = metadata.contentType || "image/jpeg";
    
    const systemPrompt = `You are an expert dermatologist AI assistant. Analyze the provided skin lesion image and patient information to provide differential diagnoses.

Consider:
- Visual characteristics of the lesion (color, shape, size, texture, borders)
- Patient symptoms: ${symptoms}
- Lesion location: ${context.lesionLocation || "Not specified"}
- Medical history: ${context.medicalHistory?.join(", ") || "None specified"}

Provide exactly 5 differential diagnoses ranked by confidence level, with confidence scores between 0-100.

Respond with JSON in this exact format:
{
  "diagnoses": [
    {
      "name": "Diagnosis name",
      "confidence": 85,
      "description": "Brief clinical description",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }
  ]
}`;

    const contents = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
      systemPrompt,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            diagnoses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  confidence: { type: "number" },
                  description: { type: "string" },
                  keyFeatures: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } }
                },
                required: ["name", "confidence", "description", "keyFeatures", "recommendations"]
              }
            }
          },
          required: ["diagnoses"]
        }
      },
      contents: contents,
    });

    const analysisTime = (Date.now() - startTime) / 1000;
    const rawJson = response.text;

    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(rawJson);
    
    // Ensure we have exactly 5 diagnoses
    const diagnoses = result.diagnoses.slice(0, 5);
    
    return {
      diagnoses,
      analysisTime
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw new Error(`Gemini analysis failed: ${error}`);
  }
}
