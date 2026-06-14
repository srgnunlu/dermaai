import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_CLAUDE_MODEL } from '@shared/schema';
import logger from './logger';
import { buildDermatologySystemPrompt } from './prompts/dermatologyPrompt';

// Structured diagnostic error info (mirrors the OpenAI/Gemini providers so the
// orchestrator in routes.ts can treat all three uniformly).
export type AnalysisErrorInfo = {
  provider: 'claude';
  code: string;
  message: string;
  hint?: string;
  httpStatus?: number;
  details?: Record<string, any>;
};

export class ClaudeAnalysisError extends Error {
  info: AnalysisErrorInfo;
  constructor(info: AnalysisErrorInfo) {
    super(info.message);
    this.name = 'ClaudeAnalysisError';
    this.info = info;
  }
  toJSON() {
    return this.info;
  }
}

let anthropic: Anthropic;

const getClaudeClient = () => {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    if (!apiKey) {
      logger.error('[Claude] API key is missing');
      throw new ClaudeAnalysisError({
        provider: 'claude',
        code: 'MISSING_API_KEY',
        message: 'Anthropic API key is not configured',
        hint: 'Set ANTHROPIC_API_KEY environment variable',
      });
    }

    logger.info('[Claude] Initializing Anthropic client');
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
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
  isHealthProfessional?: boolean;
  isMobileRequest?: boolean;
}

// Anthropic vision accepts a fixed set of media types — normalize anything else.
const SUPPORTED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

function normalizeMediaType(mimeType: string): Anthropic.Base64ImageSource['media_type'] {
  const lower = (mimeType || '').toLowerCase();
  if (SUPPORTED_MEDIA_TYPES.has(lower)) {
    return lower as Anthropic.Base64ImageSource['media_type'];
  }
  // jpg, unknown, etc. → fall back to jpeg (Anthropic decodes by content anyway)
  return 'image/jpeg';
}

export async function analyzeWithClaude(
  imageUrls: string | string[],
  symptoms: string,
  context: AnalysisContext = {},
  options: { model?: string } = {}
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

    // Fetch and encode all images (same storage resolution as the other providers)
    const imageDataArray: { mimeType: string; base64: string }[] = [];
    let totalImageBytes = 0;

    for (const imageUrl of urlArray) {
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
        const [metadata] = await file.getMetadata();

        if (!imageBuffer || imageBuffer.length === 0) {
          logger.error(`[Claude] Image buffer is empty for URL: ${imageUrl}`);
          throw new Error('Image buffer is empty');
        }

        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = metadata.contentType || 'image/jpeg';
        const imageBytes = imageBuffer.length;

        logger.info(
          `[Claude] Image processed: ${mimeType}, size: ${imageBytes} bytes, base64 length: ${imageBase64.length}`
        );

        imageDataArray.push({ mimeType, base64: imageBase64 });
        totalImageBytes += imageBytes;
      } catch (err) {
        logger.error(`[Claude] Failed to process image URL: ${imageUrl}`, err);
        throw new ClaudeAnalysisError({
          provider: 'claude',
          code: 'IMAGE_LOAD_FAILED',
          message: `Failed to load image: ${imageUrl}`,
          details: { error: String(err) },
        });
      }
    }

    if (imageDataArray.length === 0) {
      throw new ClaudeAnalysisError({
        provider: 'claude',
        code: 'NO_IMAGES',
        message: 'No images could be loaded',
      });
    }

    // Anthropic per-request limit is ~100MB but practical vision quality drops well
    // before that — warn for parity with the OpenAI provider.
    if (totalImageBytes > 18 * 1024 * 1024) {
      logger.warn(
        `[Claude] Large images detected (${(totalImageBytes / 1024 / 1024).toFixed(
          1
        )} MB total). Consider uploading smaller images (<18MB total).`
      );
    }

    const systemPrompt = buildDermatologySystemPrompt({
      symptoms,
      lesionLocation: context.lesionLocation,
      medicalHistory: context.medicalHistory,
      language: context.language,
      isHealthProfessional: context.isHealthProfessional,
      isMobileRequest: context.isMobileRequest,
      imageCount: urlArray.length,
    });

    const model = options.model || process.env.ANTHROPIC_MODEL || DEFAULT_CLAUDE_MODEL;
    logger.info(`[Claude] Starting analysis with model: ${model}, images: ${urlArray.length}`);

    // Build user content with all images followed by the instruction text
    const userContent: Anthropic.ContentBlockParam[] = imageDataArray.map((imageData) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: normalizeMediaType(imageData.mimeType),
        data: imageData.base64,
      },
    }));
    userContent.push({
      type: 'text',
      text: `Please review ${
        urlArray.length > 1 ? 'these dermatological images' : 'this dermatological image'
      } and provide non-diagnostic possible findings based on the provided context. Respond with valid JSON only.`,
    });

    // Retry configuration (mirror OpenAI provider for transient errors)
    const maxRetries = Number(process.env.ANTHROPIC_MAX_RETRIES ?? 2);
    const baseDelayMs = Number(process.env.ANTHROPIC_RETRY_DELAY_MS ?? 1500);
    let response: Anthropic.Message | undefined;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[Claude] API call attempt ${attempt + 1}/${maxRetries + 1}`);
        response = await getClaudeClient().messages.create({
          model,
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }],
        });
        logger.info(`[Claude] API call successful on attempt ${attempt + 1}`);
        break;
      } catch (err: any) {
        lastError = err;
        const status = err?.status ?? err?.response?.status;
        const retryableStatuses = [429, 500, 503, 529];

        if (retryableStatuses.includes(status) && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.warn(
            `[Claude] ${status || ''} – retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        logger.error(`[Claude] Request failed after ${attempt + 1} attempts:`, {
          status,
          message: err?.message,
        });
        break;
      }
    }

    if (!response && lastError) {
      const status = lastError?.status ?? lastError?.response?.status;
      const message = lastError?.message || 'Anthropic request failed';
      throw new ClaudeAnalysisError({
        provider: 'claude',
        code:
          status === 529 || status === 503
            ? 'MODEL_OVERLOADED'
            : status === 429
              ? 'RATE_LIMIT'
              : status === 401
                ? 'AUTH_ERROR'
                : 'UNKNOWN',
        message,
        httpStatus: status,
        hint:
          status === 529 || status === 503
            ? 'Claude is temporarily overloaded. Please retry shortly.'
            : status === 429
              ? 'Reduce request frequency or check quota.'
              : status === 401
                ? 'Check ANTHROPIC_API_KEY env'
                : undefined,
        details: { status },
      });
    }

    if (!response) {
      throw new ClaudeAnalysisError({
        provider: 'claude',
        code: 'NO_RESPONSE',
        message: 'Claude returned no response',
      });
    }

    const analysisTime = (Date.now() - startTime) / 1000;

    // Concatenate text blocks from the response
    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    logger.info(
      `[Claude] Response received - content length: ${content.length}, stop_reason: ${response.stop_reason}`
    );

    if (!content) {
      logger.error('[Claude] Empty content received', {
        stopReason: response.stop_reason,
        model,
      });
      throw new ClaudeAnalysisError({
        provider: 'claude',
        code: 'EMPTY_CONTENT',
        message: 'Model returned no content',
        hint:
          response.stop_reason === 'refusal'
            ? 'The request may have been blocked by a safety filter.'
            : 'Try reducing image size/quality or retrying later.',
        details: { stopReason: response.stop_reason, model, imageCount: urlArray.length },
      });
    }

    // Be tolerant to non-strict JSON / accidental code fences
    let result: any;
    const cleaned = content.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    try {
      result = JSON.parse(cleaned);
      logger.info('[Claude] Successfully parsed JSON response');
    } catch {
      logger.warn('[Claude] Failed to parse JSON, attempting to extract JSON from content');
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        logger.error('[Claude] No JSON found in response', { preview: content.slice(0, 120) });
        throw new ClaudeAnalysisError({
          provider: 'claude',
          code: 'NON_JSON_OUTPUT',
          message: 'Model returned non-JSON output',
          hint: 'Relax formatting or retry.',
          details: { preview: content.slice(0, 120) },
        });
      }
      result = JSON.parse(match[0]);
      logger.info('[Claude] Successfully extracted and parsed JSON from content');
    }

    // Pass through the non-skin-lesion error sentinel (handled by the orchestrator)
    if (result?.error) {
      return result;
    }

    const diagnoses = (result.diagnoses || []).slice(0, 5);
    logger.info(`[Claude] Analysis completed successfully with ${diagnoses.length} diagnoses`);

    return {
      diagnoses,
      analysisTime,
    };
  } catch (error: any) {
    if (error instanceof ClaudeAnalysisError) {
      logger.error('[Claude] Analysis failed with ClaudeAnalysisError:', error.info);
      throw error;
    }

    const status = error?.status ?? error?.response?.status;
    const message = error?.message || 'Unknown Claude error';

    let mapped: AnalysisErrorInfo = {
      provider: 'claude',
      code: 'UNKNOWN',
      message,
      httpStatus: status,
    };

    if (status === 401) {
      mapped = {
        provider: 'claude',
        code: 'AUTH_ERROR',
        message: 'Invalid or missing Anthropic API key',
        httpStatus: status,
        hint: 'Check ANTHROPIC_API_KEY env',
      };
    } else if (status === 429) {
      mapped = {
        provider: 'claude',
        code: 'RATE_LIMIT',
        message: 'Rate limit or quota exceeded',
        httpStatus: status,
        hint: 'Wait and retry; check usage limits',
      };
    } else if (status >= 500) {
      mapped = {
        provider: 'claude',
        code: 'SERVER_ERROR',
        message: 'Claude server error',
        httpStatus: status,
        hint: 'Retry later',
      };
    } else if (/timeout/i.test(message)) {
      mapped = {
        provider: 'claude',
        code: 'TIMEOUT',
        message: 'Request timed out',
        httpStatus: status,
        hint: 'Retry; reduce image size',
      };
    }

    logger.error('[Claude] Analysis failed with error:', mapped);
    throw new ClaudeAnalysisError(mapped);
  }
}
