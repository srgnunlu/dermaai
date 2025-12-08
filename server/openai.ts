import OpenAI from 'openai';
import logger from './logger';

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
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || '';

    if (!apiKey) {
      logger.error('[OpenAI] API key is missing');
      throw new AIAnalysisError({
        provider: 'openai',
        code: 'MISSING_API_KEY',
        message: 'OpenAI API key is not configured',
        hint: 'Set OPENAI_API_KEY environment variable',
      });
    }

    logger.info('[OpenAI] Initializing OpenAI client');
    openai = new OpenAI({ apiKey });
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
  language?: 'tr' | 'en';
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
      try {
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

        if (!imageBuffer || imageBuffer.length === 0) {
          logger.error(`[OpenAI] Image buffer is empty for URL: ${imageUrl}`);
          throw new Error('Image buffer is empty');
        }

        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = metadata.contentType || 'image/jpeg';
        const imageBytes = imageBuffer.length;

        logger.info(`[OpenAI] Image processed: ${mimeType}, size: ${imageBytes} bytes, base64 length: ${imageBase64.length}`);

        imageDataArray.push({ mimeType, base64: imageBase64 });
        totalImageBytes += imageBytes;
      } catch (err) {
        logger.error(`[OpenAI] Failed to process image URL: ${imageUrl}`, err);
        throw new AIAnalysisError({
          provider: 'openai',
          code: 'IMAGE_LOAD_FAILED',
          message: `Failed to load image: ${imageUrl}`,
          details: { error: String(err) },
        });
      }
    }

    if (imageDataArray.length === 0) {
      throw new AIAnalysisError({
        provider: 'openai',
        code: 'NO_IMAGES',
        message: 'No images could be loaded',
      });
    }

    if (totalImageBytes > 18 * 1024 * 1024) {
      logger.warn(
        `[OpenAI] Large images detected (${(totalImageBytes / 1024 / 1024).toFixed(
          1
        )} MB total). Consider uploading smaller images (<18MB total).`
      );
    }

    const multipleImagesNote =
      urlArray.length > 1
        ? `\n\nYou are provided with ${urlArray.length} images of the same lesion from different angles or locations. Analyze all images together to provide a comprehensive diagnosis.`
        : '';

    // Language-specific instructions
    const languageInstruction = context.language === 'tr'
      ? `\n\nCRITICAL LANGUAGE REQUIREMENT:
ALL OUTPUT MUST BE IN TURKISH LANGUAGE.
- Use Turkish medical terminology (e.g., "Egzama" instead of "Eczema", "Sedef Hastalığı" instead of "Psoriasis")
- Write all descriptions in Turkish
- Provide all recommendations in Turkish
- Use proper Turkish grammar and punctuation
- Keep medical accuracy while using Turkish terms`
      : '';

    const systemPrompt = `You are an expert dermatologist AI assistant specializing in differential diagnosis of skin lesions.${languageInstruction}

CRITICAL INSTRUCTIONS:
1. FIRST verify the image shows an actual skin lesion or dermatological condition
2. If NOT a skin lesion, respond with ONLY: {"error": true, "message": "${context.language === 'tr' ? 'Yüklenen görsel bir cilt lezyonu görünmüyor. Lütfen analiz için net bir cilt problemi görseli yükleyin.' : 'The provided image does not appear to be a skin lesion. Please upload a clear image of a skin condition for analysis.'}"}
3. If valid skin lesion, provide REALISTIC differential diagnoses

DIFFERENTIAL DIAGNOSIS GUIDELINES:
- Focus on conditions that REASONABLY match the visual presentation
- Prioritize COMMON conditions over rare diseases
- Each diagnosis must be justified by visible clinical features
- Consider epidemiology and typical presentations

CONFIDENCE SCORING RULES:
- 70-100%: Strong visual match with classic presentation
- 40-69%: Probable match, compatible features
- 20-39%: Possible match, requires clinical correlation
- 15-19%: Less likely but worth considering as differential
- Below 15%: DO NOT include - insufficient evidence

ANALYSIS CRITERIA:
Visual features: Color, shape, size, texture, borders, distribution, symmetry
Clinical context: ${symptoms}
Anatomical location: ${context.lesionLocation || (context.language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
Medical history: ${context.medicalHistory?.join(', ') || (context.language === 'tr' ? 'Belirtilmedi' : 'None specified')}${multipleImagesNote}

OUTPUT REQUIREMENTS:
Provide exactly 5 differential diagnoses ranked by likelihood.
Each diagnosis must:
- Have confidence ≥15%
- Be clinically plausible based on visual features
- Include specific features visible in the image
- Provide actionable recommendations

Respond with JSON in this exact format:
{
  "diagnoses": [
    {
      "name": "${context.language === 'tr' ? 'Tanı adı (Türkçe tıbbi terminoloji kullanın)' : 'Diagnosis name (use standard medical terminology)'}",
      "confidence": 75,
      "description": "${context.language === 'tr' ? 'Bu tanıyı neden uygun olduğunu açıklayan kısa klinik açıklama' : 'Brief clinical description explaining why this matches'}",
      "keyFeatures": ["${context.language === 'tr' ? 'Görünen spesifik özellik 1' : 'Specific visual feature 1'}", "${context.language === 'tr' ? 'Özellik 2' : 'Feature 2'}", "${context.language === 'tr' ? 'Özellik 3' : 'Feature 3'}"],
      "recommendations": ["${context.language === 'tr' ? 'Spesifik öneri 1' : 'Specific recommendation 1'}", "${context.language === 'tr' ? 'Öneri 2' : 'Recommendation 2'}"]
    }
  ]
}

QUALITY CHECKLIST (verify before responding):
✓ All 5 diagnoses are plausible differentials
✓ All confidence scores are 15-100%
✓ Common conditions listed before rare ones (when applicable)
✓ Each diagnosis justified by visible features
✓ No absurd or unrelated conditions`;

    const model = options.model || process.env.OPENAI_MODEL || 'gpt-5.1';
    logger.info(`[OpenAI] Starting analysis with model: ${model}, images: ${urlArray.length}`);

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
          content: `You are an expert dermatologist AI assistant. CRITICAL: You MUST ALWAYS respond with ONLY valid JSON output, no other text.
${systemPrompt}

STRICT REQUIREMENTS:
- Your response MUST be valid JSON only
- Do NOT include any prose, explanations, or markdown
- Do NOT wrap JSON in code blocks
- Response must start with { and end with }
- If image is invalid, respond with: {"error":true,"message":"Invalid image"}
- If image is valid, respond with: {"diagnoses":[...]} format`,
        },
        {
          role: 'user' as const,
          content: userContent,
        },
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' as const },
    };

    // Retry configuration
    const maxRetries = Number(process.env.OPENAI_MAX_RETRIES ?? 2);
    const baseDelayMs = Number(process.env.OPENAI_RETRY_DELAY_MS ?? 1500);
    let response;
    let lastError;

    // Attempt with retries for transient errors
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[OpenAI] API call attempt ${attempt + 1}/${maxRetries + 1}`);
        response = await getOpenAIClient().chat.completions.create({
          model,
          ...baseRequest,
        });
        logger.info(`[OpenAI] API call successful on attempt ${attempt + 1}`);
        break;
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.error?.status ?? err?.response?.status;
        const code = err?.error?.code ?? err?.code;
        const message = err?.message || err?.error?.message || 'OpenAI request failed';
        const retryableStatuses = [429, 500, 503];

        if (retryableStatuses.includes(status) && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.warn(
            `[OpenAI] ${status || ''} ${code || ''} – retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`[OpenAI] Request failed after ${attempt + 1} attempts:`, {
          status,
          code,
          message,
        });

        // Don't throw yet, let it fall through to handle the error below
        break;
      }
    }

    if (!response && lastError) {
      // Handle the error from retry loop
      const status = lastError?.status ?? lastError?.error?.status ?? lastError?.response?.status;
      const code = lastError?.error?.code ?? lastError?.code;
      const message = lastError?.message || lastError?.error?.message || 'OpenAI request failed';

      throw new AIAnalysisError({
        provider: 'openai',
        code: status === 503 ? 'MODEL_OVERLOADED' : status === 429 ? 'RATE_LIMIT' : code || 'UNKNOWN',
        message,
        httpStatus: status,
        hint:
          status === 503
            ? 'OpenAI is temporarily overloaded. Please retry shortly.'
            : status === 429
              ? 'Reduce request frequency or check quota.'
              : undefined,
        details: { status, code },
      });
    }

    if (!response) {
      throw new AIAnalysisError({
        provider: 'openai',
        code: 'NO_RESPONSE',
        message: 'OpenAI returned no response',
      });
    }

    const analysisTime = (Date.now() - startTime) / 1000;
    let content = response.choices?.[0]?.message?.content ?? '';
    let refusal = (response.choices?.[0] as any)?.message?.refusal;
    let finishReason = (response.choices?.[0] as any)?.finish_reason;

    logger.info(`[OpenAI] Response received - content length: ${content?.length || 0}, finish_reason: ${finishReason}`);

    if (!content) {
      logger.warn('[OpenAI] Empty content received', {
        refusal,
        finishReason,
        model,
      });

      // Attempt fallback: if empty content and multi-image, try with first image only
      if (urlArray.length > 1) {
        logger.warn(`[OpenAI] Multi-image failed, retrying with single image`);
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
          max_completion_tokens: 2000,
          response_format: { type: 'json_object' as const },
        });
        content = response.choices?.[0]?.message?.content ?? '';
        refusal = (response.choices?.[0] as any)?.message?.refusal;
        finishReason = (response.choices?.[0] as any)?.finish_reason;
      }
    }

    // Attempt fallback: if still empty because of 'length', try compact JSON
    if (!content && finishReason === 'length') {
      logger.warn('[OpenAI] Response truncated due to length, trying compact JSON');
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
        max_completion_tokens: (baseRequest as any).max_completion_tokens + 500,
        response_format: { type: 'json_object' as const },
      };
      const resp2b = await getOpenAIClient().chat.completions.create({
        model,
        ...(compactBase as any),
      });
      content = resp2b.choices?.[0]?.message?.content ?? '';
      refusal = (resp2b.choices?.[0] as any)?.message?.refusal;
      finishReason = (resp2b.choices?.[0] as any)?.finish_reason;
    }

    // Attempt fallback: try fallback model
    if (!content && !model.includes('gpt-4o-mini') && (options.allowFallback ?? true)) {
      logger.warn('[OpenAI] Retrying with fallback model gpt-4o-mini');

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
            content: systemPrompt + '\nRespond with ONLY valid JSON, no other text.',
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
      logger.error('[OpenAI] All attempts failed - no content received', {
        refusal,
        finishReason,
        model,
        imageCount: urlArray.length,
        totalImageBytes,
      });
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
      logger.info('[OpenAI] Successfully parsed JSON response');
    } catch (parseError) {
      logger.warn('[OpenAI] Failed to parse JSON, attempting to extract JSON from content');
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        logger.error('[OpenAI] No JSON found in response', {
          preview: content.slice(0, 120),
        });
        throw new AIAnalysisError({
          provider: 'openai',
          code: 'NON_JSON_OUTPUT',
          message: 'Model returned non‑JSON output',
          hint: 'Remove strict JSON requirement or relax formatting.',
          details: { preview: content.slice(0, 120) },
        });
      }
      result = JSON.parse(match[0]);
      logger.info('[OpenAI] Successfully extracted and parsed JSON from content');
    }

    // Ensure we have exactly 5 diagnoses
    const diagnoses = (result.diagnoses || []).slice(0, 5);

    logger.info(`[OpenAI] Analysis completed successfully with ${diagnoses.length} diagnoses`);

    return {
      diagnoses,
      analysisTime,
    };
  } catch (error: any) {
    // Convert generic errors to structured diagnostics
    if (error instanceof AIAnalysisError) {
      logger.error('[OpenAI] Analysis failed with AIAnalysisError:', error.info);
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

    logger.error('[OpenAI] Analysis failed with error:', mapped);
    throw new AIAnalysisError(mapped);
  }
}
