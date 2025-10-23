import OpenAI from 'openai';

// Structured diagnostic error info
export type AnalysisErrorInfo = {
  provider: 'openai';
  code: string;
  message: string;
  hint?: string;
  httpStatus?: number;
  details?: Record<string, any>;
};

export class AIAnalysisError extends Error {
  info: AnalysisErrorInfo;
  constructor(info: AnalysisErrorInfo) {
    super(info.message);
    this.name = 'AIAnalysisError';
    this.info = info;
  }
  toJSON() {
    return this.info;
  }
}

let openai: OpenAI;

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || '',
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
  imageUrls: string | string[],
  symptoms: string,
  context: AnalysisContext = {},
  options: { model?: string; allowFallback?: boolean } = {}
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
    const imageDataArray: { mimeType: string; base64: string }[] = [];
    let totalImageBytes = 0;

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
      const imageBytes = imageBuffer.length;

      imageDataArray.push({ mimeType, base64: imageBase64 });
      totalImageBytes += imageBytes;
    }

    if (totalImageBytes > 18 * 1024 * 1024) {
      console.warn(
        `[OpenAI] Large images detected (${(totalImageBytes / 1024 / 1024).toFixed(
          1
        )} MB total). Consider uploading smaller images (<18MB total).`
      );
    }

    const multipleImagesNote =
      urlArray.length > 1
        ? `\n\nYou are provided with ${urlArray.length} images of the same lesion from different angles or locations. Analyze all images together to provide a comprehensive diagnosis.`
        : '';

    const systemPrompt = `You are an expert dermatologist AI assistant. Analyze the provided skin lesion image(s) and patient information to provide differential diagnoses.

IMPORTANT VALIDATION:
- FIRST, verify that the image(s) show an actual skin lesion or dermatological condition
- If the image is NOT a skin lesion (e.g., non-medical image, random object, etc.), respond with ONLY this JSON:
{
  "error": true,
  "message": "The provided image does not appear to be a skin lesion. Please upload a clear image of a skin condition for analysis."
}
- Do NOT provide diagnoses for non-dermatological images

Consider:
- Visual characteristics of the lesion (color, shape, size, texture, borders)
- Patient symptoms: ${symptoms}
- Lesion location: ${context.lesionLocation || 'Not specified'}
- Medical history: ${context.medicalHistory?.join(', ') || 'None specified'}${multipleImagesNote}

If the image IS a valid skin lesion, provide exactly 5 differential diagnoses ranked by confidence level, with confidence scores between 0-100.

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

    const model = options.model || process.env.OPENAI_MODEL || 'gpt-5-mini';
    const isGpt5 = model.includes('gpt-5');

    // Build message content with all images
    const userContent: any[] = [
      {
        type: 'text',
        text: `Please analyze ${urlArray.length > 1 ? 'these dermatological images' : 'this dermatological image'} and provide differential diagnoses based on the clinical information provided.`,
      },
    ];

    for (const imageData of imageDataArray) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${imageData.mimeType};base64,${imageData.base64}` },
      });
    }

    const baseRequest = {
      messages: [
        {
          role: 'system' as const,
          content: isGpt5
            ? `You are an expert dermatologist AI assistant. CRITICAL: You MUST ALWAYS respond with ONLY valid JSON output, no other text.
${systemPrompt}

STRICT REQUIREMENTS:
- Your response MUST be valid JSON only
- Do NOT include any prose, explanations, or markdown
- Do NOT wrap JSON in code blocks
- Response must start with { and end with }
- If image is invalid, respond with: {"error":true,"message":"Invalid image"}
- If image is valid, respond with: {"diagnoses":[...]} format`
            : systemPrompt,
        },
        {
          role: 'user' as const,
          content: userContent,
        },
      ],
      max_completion_tokens: isGpt5 ? 1000 : 2000,
    };

    // Attempt 1: strict JSON output (skip response_format for gpt-5)
    let response = await getOpenAIClient().chat.completions.create({
      model,
      ...baseRequest,
      ...(isGpt5 ? {} : { response_format: { type: 'json_object' as const } }),
    });

    const analysisTime = (Date.now() - startTime) / 1000;
    let content = response.choices?.[0]?.message?.content ?? '';
    let refusal = (response.choices?.[0] as any)?.message?.refusal;
    let finishReason = (response.choices?.[0] as any)?.finish_reason;
    if (!content) {
      console.warn('[OpenAI] Empty content on first attempt', {
        refusal,
        finishReason,
        model,
      });

      // Attempt 2: For multi-image with GPT-5, try with first image only
      if (isGpt5 && urlArray.length > 1) {
        console.warn(`[OpenAI] GPT-5 multi-image failed, retrying with single image`);
        const singleImageContent: any[] = [
          {
            type: 'text',
            text: `Please analyze this dermatological image and provide differential diagnoses based on the clinical information provided. (Note: using first image of ${urlArray.length} images)`,
          },
        ];
        
        if (imageDataArray.length > 0) {
          singleImageContent.push({
            type: 'image_url',
            image_url: { url: `data:${imageDataArray[0].mimeType};base64,${imageDataArray[0].base64}` },
          });
        }

        response = await getOpenAIClient().chat.completions.create({
          model,
          messages: [
            {
              role: 'system' as const,
              content: systemPrompt + '\nRespond with ONLY valid JSON, no other text.',
            },
            {
              role: 'user' as const,
              content: singleImageContent,
            },
          ],
          max_completion_tokens: 1000,
        });
        content = response.choices?.[0]?.message?.content ?? '';
        refusal = (response.choices?.[0] as any)?.message?.refusal;
        finishReason = (response.choices?.[0] as any)?.finish_reason;
      } else {
        // Attempt 2b: regular retry
        response = await getOpenAIClient().chat.completions.create({
          model,
          ...baseRequest,
        });
        content = response.choices?.[0]?.message?.content ?? '';
        refusal = (response.choices?.[0] as any)?.message?.refusal;
        finishReason = (response.choices?.[0] as any)?.finish_reason;
      }
    }

    // Attempt 2b: if still empty because of 'length', try compact JSON without strict response_format
    if (!content && finishReason === 'length') {
      const compactBase = {
        messages: [
          {
            role: 'system' as const,
            content:
              systemPrompt +
              '\nKeep the JSON extremely concise: description <= 12 words, keyFeatures length <= 3, recommendations length <= 2.',
          },
          ...(baseRequest as any).messages.slice(1),
        ],
        max_completion_tokens: (baseRequest as any).max_completion_tokens + 200,
      };
      const resp2b = await getOpenAIClient().chat.completions.create({
        model,
        ...(compactBase as any),
        ...(isGpt5 ? {} : { response_format: { type: 'json_object' as const } }),
      });
      content = resp2b.choices?.[0]?.message?.content ?? '';
      refusal = (resp2b.choices?.[0] as any)?.message?.refusal;
      finishReason = (resp2b.choices?.[0] as any)?.finish_reason;
    }

    // Attempt 3: fallback model
    if (!content && !model.includes('gpt-4o-mini') && (options.allowFallback ?? true)) {
      console.warn('[OpenAI] Retrying with fallback model gpt-4o-mini');
      
      // For multi-image, use only first image with fallback
      const fallbackContent = urlArray.length > 1 ? [
        {
          type: 'text' as const,
          text: `Please analyze this dermatological image and provide differential diagnoses based on the clinical information provided. (Note: using first image of ${urlArray.length} images)`,
        },
        {
          type: 'image_url' as const,
          image_url: { url: `data:${imageDataArray[0].mimeType};base64,${imageDataArray[0].base64}` },
        },
      ] : userContent;

      response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system' as const,
            content: systemPrompt,
          },
          {
            role: 'user' as const,
            content: fallbackContent,
          },
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' as const },
      });
      content = response.choices?.[0]?.message?.content ?? '';
    }

    if (!content) {
      throw new AIAnalysisError({
        provider: 'openai',
        code: 'EMPTY_CONTENT',
        message: 'Model returned no content',
        hint: refusal
          ? 'The request may have been blocked by a safety filter.'
          : 'Try reducing image size/quality or retrying later.',
        details: { refusal, finishReason, model, imageCount: urlArray.length, totalImageBytes },
      });
    }

    // Be tolerant to non‑strict JSON
    let result: any;
    try {
      result = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match)
        throw new AIAnalysisError({
          provider: 'openai',
          code: 'NON_JSON_OUTPUT',
          message: 'Model returned non‑JSON output',
          hint: 'Remove strict JSON requirement or relax formatting.',
          details: { preview: content.slice(0, 120) },
        });
      result = JSON.parse(match[0]);
    }

    // Ensure we have exactly 5 diagnoses
    const diagnoses = (result.diagnoses || []).slice(0, 5);

    return {
      diagnoses,
      analysisTime,
    };
  } catch (error: any) {
    // Convert generic errors to structured diagnostics
    if (error instanceof AIAnalysisError) {
      console.error('OpenAI analysis failed:', error.info);
      throw error;
    }

    const status = error?.status ?? error?.response?.status;
    const code = error?.code || error?.error?.code;
    const type = error?.type || error?.error?.type;
    const message = error?.message || 'Unknown OpenAI error';

    let mapped: AnalysisErrorInfo = {
      provider: 'openai',
      code: 'UNKNOWN',
      message,
      httpStatus: status,
      details: { code, type },
    };

    if (code === 'unsupported_value') {
      mapped = {
        provider: 'openai',
        code: 'UNSUPPORTED_PARAMETER',
        message,
        httpStatus: status,
        hint: 'Remove temperature or use a model that supports it',
      };
    } else if (status === 401 || code === 'invalid_api_key') {
      mapped = {
        provider: 'openai',
        code: 'AUTH_ERROR',
        message: 'Invalid or missing OpenAI API key',
        httpStatus: status,
        hint: 'Check OPENAI_API_KEY env',
      };
    } else if (status === 429 || code === 'rate_limit_exceeded') {
      mapped = {
        provider: 'openai',
        code: 'RATE_LIMIT',
        message: 'Rate limit or quota exceeded',
        httpStatus: status,
        hint: 'Wait and retry; check usage limits',
      };
    } else if (status >= 500) {
      mapped = {
        provider: 'openai',
        code: 'SERVER_ERROR',
        message: 'OpenAI server error',
        httpStatus: status,
        hint: 'Retry later',
      };
    } else if (/timeout/i.test(message)) {
      mapped = {
        provider: 'openai',
        code: 'TIMEOUT',
        message: 'Request timed out',
        httpStatus: status,
        hint: 'Retry; reduce image size',
      };
    }

    console.error('OpenAI analysis failed:', mapped);
    throw new AIAnalysisError(mapped);
  }
}
