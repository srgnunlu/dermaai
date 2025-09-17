import OpenAI from "openai";

// Using GPT-5-mini as requested by user
let openai: OpenAI;

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
    });
  }
  return openai;
};

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

export async function analyzeWithOpenAI(
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

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this dermatological image and provide differential diagnoses based on the clinical information provided."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
    });

    const analysisTime = (Date.now() - startTime) / 1000;
    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Ensure we have exactly 5 diagnoses
    const diagnoses = result.diagnoses.slice(0, 5);
    
    return {
      diagnoses,
      analysisTime
    };
  } catch (error) {
    console.error("OpenAI analysis failed:", error);
    throw new Error(`OpenAI analysis failed: ${error}`);
  }
}
