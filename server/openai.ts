import OpenAI from "openai";

// Structured diagnostic error info
export type AnalysisErrorInfo = {
  provider: "openai";
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
    this.name = "AIAnalysisError";
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
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "",
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
  context: AnalysisContext = {},
  options: { model?: string; allowFallback?: boolean } = {}
): Promise<{
  diagnoses: DiagnosisResult[];
  analysisTime: number;
}> {
  const startTime = Date.now();

  try {
    let file;

    // Check if it's a Cloudinary URL
    if (imageUrl.includes("cloudinary.com")) {
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
    const imageBytes = imageBuffer.length;
    if (imageBytes > 18 * 1024 * 1024) {
      console.warn(
        `[OpenAI] Large image detected (${(imageBytes / 1024 / 1024).toFixed(
          1,
        )} MB). Consider uploading a smaller image (<18MB).`,
      );
    }

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

    const model = options.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const isGpt5 = /^gpt-5($|-)/.test(model);

    const baseRequest = {
      messages: [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text:
                "Please analyze this dermatological image and provide differential diagnoses based on the clinical information provided.",
            },
            {
              type: "image_url" as const,
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_completion_tokens: isGpt5 ? 800 : 2000,
    };

    // Attempt 1: strict JSON output
    let response = await getOpenAIClient().chat.completions.create({
      model,
      ...baseRequest,
      messages: [...(baseRequest as any).messages],
      response_format: { type: "json_object" },
    });

    const analysisTime = (Date.now() - startTime) / 1000;
    let content = response.choices?.[0]?.message?.content ?? "";
    let refusal = (response.choices?.[0] as any)?.message?.refusal;
    let finishReason = (response.choices?.[0] as any)?.finish_reason;
    if (!content) {
      console.warn("[OpenAI] Empty content on first attempt", {
        refusal,
        finishReason,
      });

    // Attempt 2: relax response_format (some models e.g. gpt-5 only allow default temperature)
      const supportsTemp = !/^gpt-5($|-)/.test(model);
      response = await getOpenAIClient().chat.completions.create({
        model,
        ...baseRequest,
        ...(supportsTemp ? { temperature: 0.2 } : {}),
      });
      content = response.choices?.[0]?.message?.content ?? "";
      refusal = (response.choices?.[0] as any)?.message?.refusal;
      finishReason = (response.choices?.[0] as any)?.finish_reason;
    }

    // Attempt 2b: if still empty because of 'length', try compact JSON without strict response_format
    if (!content && finishReason === 'length') {
      const compactBase = {
        messages: [
          {
            role: 'system' as const,
            content:
              systemPrompt +
              "\nKeep the JSON extremely concise: description <= 12 words, keyFeatures length <= 3, recommendations length <= 2.",
          },
          ...(baseRequest as any).messages.slice(1),
        ],
        max_completion_tokens: (baseRequest as any).max_completion_tokens + 200,
      };
      const resp2b = await getOpenAIClient().chat.completions.create({
        model,
        ...(compactBase as any),
      });
      content = resp2b.choices?.[0]?.message?.content ?? "";
      refusal = (resp2b.choices?.[0] as any)?.message?.refusal;
      finishReason = (resp2b.choices?.[0] as any)?.finish_reason;
    }

    // Attempt 3: fallback model
    if (!content && model !== "gpt-4o-mini" && (options.allowFallback ?? true)) {
      console.warn("[OpenAI] Retrying with fallback model gpt-4o-mini");
      response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini",
        ...baseRequest,
        temperature: 0.2,
      });
      content = response.choices?.[0]?.message?.content ?? "";
    }

    if (!content) {
      throw new AIAnalysisError({
        provider: "openai",
        code: "EMPTY_CONTENT",
        message: "Model returned no content",
        hint: refusal
          ? "The request may have been blocked by a safety filter."
          : "Try reducing image size/quality or retrying later.",
        details: { refusal, finishReason, model, mimeType, imageBytes },
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
          provider: "openai",
          code: "NON_JSON_OUTPUT",
          message: "Model returned non‑JSON output",
          hint: "Remove strict JSON requirement or relax formatting.",
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
      console.error("OpenAI analysis failed:", error.info);
      throw error;
    }

    const status = error?.status ?? error?.response?.status;
    const code = error?.code || error?.error?.code;
    const type = error?.type || error?.error?.type;
    const message = error?.message || "Unknown OpenAI error";

    let mapped: AnalysisErrorInfo = {
      provider: "openai",
      code: "UNKNOWN",
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
    } else if (status === 401 || code === "invalid_api_key") {
      mapped = {
        provider: "openai",
        code: "AUTH_ERROR",
        message: "Invalid or missing OpenAI API key",
        httpStatus: status,
        hint: "Check OPENAI_API_KEY env",
      };
    } else if (status === 429 || code === "rate_limit_exceeded") {
      mapped = {
        provider: "openai",
        code: "RATE_LIMIT",
        message: "Rate limit or quota exceeded",
        httpStatus: status,
        hint: "Wait and retry; check usage limits",
      };
    } else if (status >= 500) {
      mapped = {
        provider: "openai",
        code: "SERVER_ERROR",
        message: "OpenAI server error",
        httpStatus: status,
        hint: "Retry later",
      };
    } else if (/timeout/i.test(message)) {
      mapped = {
        provider: "openai",
        code: "TIMEOUT",
        message: "Request timed out",
        httpStatus: status,
        hint: "Retry; reduce image size",
      };
    }

    console.error("OpenAI analysis failed:", mapped);
    throw new AIAnalysisError(mapped);
  }
}
