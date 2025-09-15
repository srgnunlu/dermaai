import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "" 
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
    // Fetch image and convert to base64 for OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

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

    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
      max_tokens: 2000,
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
