import { GoogleGenAI } from '@google/genai';

type GeminiErrorInfo = {
  provider: 'gemini';
  code: string;
  message: string;
  hint?: string;
  httpStatus?: number;
  details?: Record<string, any>;
};

class GeminiAnalysisError extends Error {
  info: GeminiErrorInfo;
  constructor(info: GeminiErrorInfo) {
    super(info.message);
    this.name = 'GeminiAnalysisError';
    this.info = info;
  }
  toJSON() {
    return this.info;
  }
}

// the newest Gemini model is "gemini-2.5-flash" - do not change this unless explicitly requested by the user
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
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
  imageUrls: string | string[],
  symptoms: string,
  context: AnalysisContext = {}
): Promise<{
  diagnoses: DiagnosisResult[];
  analysisTime: number;
}> {
  const startTime = Date.now();

  try {
    // Normalize input to array
    const urlArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

    // Limit to max 3 images
    if (urlArray.length > 3) {
      urlArray.length = 3;
    }

    if (urlArray.length === 0) {
      throw new Error('At least one image URL is required');
    }

    // Fetch and encode all images
    const imageDataArray: { data: string; mimeType: string }[] = [];

    for (const imageUrl of urlArray) {
      let file;

      // Check if it's a Cloudinary URL
      if (imageUrl.includes('cloudinary.com')) {
        const { CloudinaryStorageService } = await import('./cloudinaryStorage');
        const cloudinaryService = new CloudinaryStorageService();
        file = await cloudinaryService.getObjectEntityFile(imageUrl);
      } else {
        // Use local file storage
        const { LocalFileStorageService } = await import('./localFileStorage');
        const fileStorageService = new LocalFileStorageService();
        const normalizedPath = fileStorageService.normalizeObjectEntityPath(imageUrl);
        file = await fileStorageService.getObjectEntityFile(normalizedPath);
      }

      // Get image data and metadata directly from the file
      const [imageBuffer] = await file.download();
      const [metadata] = await file.getMetadata();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = metadata.contentType || 'image/jpeg';

      imageDataArray.push({ data: imageBase64, mimeType });
    }

    const multipleImagesNote =
      urlArray.length > 1
        ? `\n\nYou are provided with ${urlArray.length} images of the same lesion from different angles or locations. Analyze all images together to provide a comprehensive diagnosis.`
        : '';

    const systemPrompt = `You are an expert dermatologist AI assistant. Analyze the provided skin lesion image(s) and patient information to provide differential diagnoses.

Consider:
- Visual characteristics of the lesion (color, shape, size, texture, borders)
- Patient symptoms: ${symptoms}
- Lesion location: ${context.lesionLocation || 'Not specified'}
- Medical history: ${context.medicalHistory?.join(', ') || 'None specified'}${multipleImagesNote}

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

    // Build contents array with all images
    const contents: any[] = [];

    for (const imageData of imageDataArray) {
      contents.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType,
        },
      });
    }

    contents.push(systemPrompt);

    const maxRetries = Number(process.env.GEMINI_MAX_RETRIES ?? 2);
    const baseDelayMs = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 1500);
    let response;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                diagnoses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      confidence: { type: 'number' },
                      description: { type: 'string' },
                      keyFeatures: { type: 'array', items: { type: 'string' } },
                      recommendations: { type: 'array', items: { type: 'string' } },
                    },
                    required: [
                      'name',
                      'confidence',
                      'description',
                      'keyFeatures',
                      'recommendations',
                    ],
                  },
                },
              },
              required: ['diagnoses'],
            },
          },
          contents: contents,
        });
        break;
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status ?? err?.response?.status;
        const code = err?.error?.code ?? err?.code;
        const message = err?.message || err?.error?.message || 'Gemini request failed';
        const retryableStatuses = [429, 500, 503];
        if (retryableStatuses.includes(status) && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(
            `[Gemini] ${status || ''} ${code || ''} – retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new GeminiAnalysisError({
          provider: 'gemini',
          code: status === 503 ? 'MODEL_OVERLOADED' : status === 429 ? 'RATE_LIMIT' : 'UNKNOWN',
          message,
          httpStatus: status,
          hint:
            status === 503
              ? 'Gemini is temporarily overloaded. Please retry shortly.'
              : status === 429
                ? 'Reduce request frequency or check quota.'
                : undefined,
          details: { status, code },
        });
      }
    }

    if (!response) {
      throw new GeminiAnalysisError({
        provider: 'gemini',
        code: 'NO_RESPONSE',
        message: 'Gemini returned no response',
      });
    }

    const analysisTime = (Date.now() - startTime) / 1000;
    const rawJson = response.text;

    if (!rawJson) {
      throw new GeminiAnalysisError({
        provider: 'gemini',
        code: 'EMPTY_CONTENT',
        message: 'Empty response from Gemini',
      });
    }

    const result = JSON.parse(rawJson);
    const diagnoses = result.diagnoses.slice(0, 5);

    return {
      diagnoses,
      analysisTime,
    };
  } catch (error: any) {
    if (error instanceof GeminiAnalysisError) {
      console.error('Gemini analysis failed:', error.info);
      throw error;
    }

    const status = error?.status ?? error?.error?.status;
    const message = error?.message || error?.error?.message || 'Gemini analysis failed';
    const code = error?.error?.code || error?.code || 'UNKNOWN';

    const mapped: GeminiErrorInfo = {
      provider: 'gemini',
      code,
      message,
      httpStatus: status,
      details: { raw: error },
    };

    console.error('Gemini analysis failed:', mapped);
    throw new GeminiAnalysisError(mapped);
  }
}
