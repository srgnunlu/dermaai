import { GoogleGenAI } from '@google/genai';
import logger from './logger';

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

// the newest Gemini model is "gemini-3-pro-preview" - do not change this unless explicitly requested by the user
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
  language?: 'tr' | 'en';
  isHealthProfessional?: boolean;
  isMobileRequest?: boolean;
}

// Lesion Comparison Types
interface LesionComparisonResult {
  changeDetected: boolean;
  changeSummary: string;
  sizeChange: string | null;
  colorChange: string | null;
  borderChange: string | null;
  textureChange: string | null;
  overallProgression: 'stable' | 'improved' | 'worsened' | 'significant_change';
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  recommendations: string[];
  detailedAnalysis: string;
  timeElapsed: string;
  analysisTime: number;
}

interface PreviousAnalysisData {
  date: string;
  imageUrls: string[];
  topDiagnosis?: {
    name: string;
    confidence: number;
    keyFeatures: string[];
  };
}

interface ComparisonContext {
  lesionName?: string;
  bodyLocation?: string;
  language?: 'tr' | 'en';
  previousAnalysis: PreviousAnalysisData;
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
    logger.info(`[Gemini] Starting analysis with ${urlArray.length} image(s)`);
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

      logger.info(`[Gemini] Image processed: ${mimeType}, size: ${imageBuffer.length} bytes, base64 length: ${imageBase64.length}`);

      imageDataArray.push({ data: imageBase64, mimeType });
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

    // Audience-aware instructions for mobile app personalization
    // Web requests (isMobileRequest undefined/false) maintain default professional language
    let audienceInstruction = '';
    if (context.isMobileRequest) {
      if (context.isHealthProfessional) {
        audienceInstruction = context.language === 'tr'
          ? `\n\nHEDEF KİTLE: Sağlık Profesyoneli
Bu analiz, hastasının vakasını inceleyen bir sağlık çalışanı içindir.
- Kesin tıbbi terminoloji kullanın
- Ayırıcı tanı mantığını dahil edin
- Tedavi seçenekleri ve reçete önerileri sunun
- Uygun olduğunda klinik kılavuzlara referans verin
- Önerilerde "hastanız" olarak hitap edin`
          : `\n\nTARGET AUDIENCE: Health Professional
This analysis is for a healthcare professional reviewing their patient's case.
- Use precise medical terminology
- Include differential diagnosis reasoning
- Provide treatment options and prescription recommendations
- Reference clinical guidelines where appropriate
- Address the patient as "your patient" in recommendations`;
      } else {
        audienceInstruction = context.language === 'tr'
          ? `\n\nHEDEF KİTLE: Genel Kullanıcı
Bu analiz, kendi cilt durumunu inceleyen normal bir kullanıcı içindir.
- Basit, anlaşılır bir dil kullanın
- Karmaşık tıbbi terimlerden kaçının
- Durumları halkın anlayacağı şekilde açıklayın
- Kişisel bakım önerilerine odaklanın
- Uygun olduğunda bir dermatoloğa danışmayı önerin
- Önerilerde "size" veya "siz" olarak hitap edin`
          : `\n\nTARGET AUDIENCE: General Public
This analysis is for a regular person examining their own skin condition.
- Use simple, easy-to-understand language
- Avoid complex medical jargon
- Explain conditions in layman's terms
- Focus on self-care recommendations
- Recommend consulting a dermatologist when appropriate
- Address the user directly as "you" in recommendations`;
      }
    }

    const systemPrompt = `You are an expert dermatologist AI assistant specializing in differential diagnosis of skin lesions.${languageInstruction}${audienceInstruction}

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
        logger.info(`[Gemini] API call attempt ${attempt + 1}/${maxRetries + 1}`);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
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
        logger.info(`[Gemini] API call successful on attempt ${attempt + 1}`);
        break;
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status ?? err?.response?.status;
        const code = err?.error?.code ?? err?.code;
        const message = err?.message || err?.error?.message || 'Gemini request failed';
        const retryableStatuses = [429, 500, 503];
        if (retryableStatuses.includes(status) && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.warn(
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

    logger.info(`[Gemini] Analysis completed successfully with ${diagnoses.length} diagnoses in ${analysisTime.toFixed(1)}s`);

    return {
      diagnoses,
      analysisTime,
    };
  } catch (error: any) {
    if (error instanceof GeminiAnalysisError) {
      logger.error('[Gemini] Analysis failed with GeminiAnalysisError:', error.info);
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

    logger.error('[Gemini] Analysis failed with error:', mapped);
    throw new GeminiAnalysisError(mapped);
  }
}

/**
 * Compare two lesion images over time using Gemini AI
 * This is a PRO feature for lesion progression tracking
 */
export async function compareWithGemini(
  currentImageUrls: string[],
  context: ComparisonContext
): Promise<LesionComparisonResult> {
  const startTime = Date.now();

  try {
    const { previousAnalysis, language = 'tr', lesionName, bodyLocation } = context;

    // Validate inputs
    if (currentImageUrls.length === 0) {
      throw new Error('At least one current image URL is required');
    }
    if (previousAnalysis.imageUrls.length === 0) {
      throw new Error('At least one previous image URL is required');
    }

    logger.info(`[Gemini Comparison] Starting comparison with ${previousAnalysis.imageUrls.length} previous and ${currentImageUrls.length} current image(s)`);

    // Fetch and encode all images
    const allImageData: { data: string; mimeType: string; label: string }[] = [];

    // Process previous images
    for (let i = 0; i < previousAnalysis.imageUrls.length; i++) {
      const imageUrl = previousAnalysis.imageUrls[i];
      const imageData = await fetchAndEncodeImage(imageUrl);
      allImageData.push({ ...imageData, label: `PREVIOUS_${i + 1}` });
    }

    // Process current images
    for (let i = 0; i < currentImageUrls.length; i++) {
      const imageUrl = currentImageUrls[i];
      const imageData = await fetchAndEncodeImage(imageUrl);
      allImageData.push({ ...imageData, label: `CURRENT_${i + 1}` });
    }

    // Calculate time elapsed
    const previousDate = new Date(previousAnalysis.date);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeElapsed = daysDiff < 7 
      ? `${daysDiff} ${language === 'tr' ? 'gün' : 'days'}`
      : daysDiff < 30 
        ? `${Math.floor(daysDiff / 7)} ${language === 'tr' ? 'hafta' : 'weeks'}`
        : `${Math.floor(daysDiff / 30)} ${language === 'tr' ? 'ay' : 'months'}`;

    // Build comparison prompt
    const previousDiagnosisInfo = previousAnalysis.topDiagnosis
      ? `
Previous Analysis Diagnosis: ${previousAnalysis.topDiagnosis.name} (${previousAnalysis.topDiagnosis.confidence}% confidence)
Previous Key Features: ${previousAnalysis.topDiagnosis.keyFeatures.join(', ')}`
      : '';

    const systemPrompt = language === 'tr'
      ? `Sen dermatolojik lezyon takibi ve karşılaştırma konusunda uzman bir yapay zeka asistanısın.

GÖREV: İki farklı zamanda çekilen lezyon görsellerini karşılaştır ve değişimleri analiz et.

BAĞLAM:
- Lezyon Adı: ${lesionName || 'Belirtilmedi'}
- Vücut Bölgesi: ${bodyLocation || 'Belirtilmedi'}
- Önceki Analiz Tarihi: ${previousAnalysis.date}
- Geçen Süre: ${timeElapsed}${previousDiagnosisInfo}

GÖRSELLER:
- PREVIOUS_* etiketli görseller: Önceki kayıt (${previousAnalysis.date})
- CURRENT_* etiketli görseller: Şimdiki durum

KRİTİK ANALİZ KRİTERLERİ:
1. BOYUT DEĞİŞİMİ: Büyüme veya küçülme var mı? Tahmini ölçü değişimi
2. RENK DEĞİŞİMİ: Pigmentasyonda değişim, koyulaşma, açılma
3. KENAR DEĞİŞİMİ: Sınırlar düzensizleşti mi, belirsizleşti mi?
4. DOKU DEĞİŞİMİ: Yüzey yapısında değişim, kabuklanma, ülserasyon
5. ŞEKİL DEĞİŞİMİ: Asimetri artışı, düzensiz büyüme

RİSK SEVİYESİ BELİRLEME:
- low: Stabil veya iyileşme gösteren, endişe verici değişim yok
- moderate: Hafif değişimler mevcut, takip önerilir
- elevated: Dikkat gerektiren değişimler, dermatoloji konsültasyonu önerilir
- high: ACİL - Ciddi değişimler, hızlı tıbbi değerlendirme gerekli

JSON formatında yanıt ver:
{
  "changeDetected": true/false,
  "changeSummary": "Değişimlerin kısa özeti (1-2 cümle)",
  "sizeChange": "Boyut değişimi açıklaması veya null",
  "colorChange": "Renk değişimi açıklaması veya null", 
  "borderChange": "Kenar değişimi açıklaması veya null",
  "textureChange": "Doku değişimi açıklaması veya null",
  "overallProgression": "stable" | "improved" | "worsened" | "significant_change",
  "riskLevel": "low" | "moderate" | "elevated" | "high",
  "recommendations": ["Öneri 1", "Öneri 2", ...],
  "detailedAnalysis": "Detaylı karşılaştırma analizi (en az 3-4 cümle)"
}`
      : `You are an expert AI assistant specializing in dermatological lesion tracking and comparison.

TASK: Compare lesion images taken at two different times and analyze changes.

CONTEXT:
- Lesion Name: ${lesionName || 'Not specified'}
- Body Location: ${bodyLocation || 'Not specified'}
- Previous Analysis Date: ${previousAnalysis.date}
- Time Elapsed: ${timeElapsed}${previousDiagnosisInfo}

IMAGES:
- PREVIOUS_* labeled images: Previous recording (${previousAnalysis.date})
- CURRENT_* labeled images: Current state

CRITICAL ANALYSIS CRITERIA:
1. SIZE CHANGE: Growth or shrinkage? Estimated measurement change
2. COLOR CHANGE: Pigmentation changes, darkening, lightening
3. BORDER CHANGE: Have borders become irregular or blurred?
4. TEXTURE CHANGE: Surface structure changes, crusting, ulceration
5. SHAPE CHANGE: Increased asymmetry, irregular growth

RISK LEVEL DETERMINATION:
- low: Stable or improving, no concerning changes
- moderate: Minor changes present, follow-up recommended
- elevated: Changes requiring attention, dermatology consultation recommended
- high: URGENT - Serious changes, rapid medical evaluation required

Respond in JSON format:
{
  "changeDetected": true/false,
  "changeSummary": "Brief summary of changes (1-2 sentences)",
  "sizeChange": "Size change description or null",
  "colorChange": "Color change description or null",
  "borderChange": "Border change description or null",
  "textureChange": "Texture change description or null",
  "overallProgression": "stable" | "improved" | "worsened" | "significant_change",
  "riskLevel": "low" | "moderate" | "elevated" | "high",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "detailedAnalysis": "Detailed comparison analysis (at least 3-4 sentences)"
}`;

    // Build contents array with labeled images
    const contents: any[] = [];

    for (const imageData of allImageData) {
      contents.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType,
        },
      });
      contents.push(`[Image Label: ${imageData.label}]`);
    }

    contents.push(systemPrompt);

    // Make API call with retry logic
    const maxRetries = Number(process.env.GEMINI_MAX_RETRIES ?? 2);
    const baseDelayMs = Number(process.env.GEMINI_RETRY_DELAY_MS ?? 1500);
    let response;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`[Gemini Comparison] API call attempt ${attempt + 1}/${maxRetries + 1}`);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                changeDetected: { type: 'boolean' },
                changeSummary: { type: 'string' },
                sizeChange: { type: 'string', nullable: true },
                colorChange: { type: 'string', nullable: true },
                borderChange: { type: 'string', nullable: true },
                textureChange: { type: 'string', nullable: true },
                overallProgression: { 
                  type: 'string',
                  enum: ['stable', 'improved', 'worsened', 'significant_change']
                },
                riskLevel: {
                  type: 'string',
                  enum: ['low', 'moderate', 'elevated', 'high']
                },
                recommendations: { type: 'array', items: { type: 'string' } },
                detailedAnalysis: { type: 'string' },
              },
              required: [
                'changeDetected',
                'changeSummary',
                'overallProgression',
                'riskLevel',
                'recommendations',
                'detailedAnalysis',
              ],
            },
          },
          contents: contents,
        });
        logger.info(`[Gemini Comparison] API call successful on attempt ${attempt + 1}`);
        break;
      } catch (err: any) {
        const status = err?.status ?? err?.error?.status ?? err?.response?.status;
        const retryableStatuses = [429, 500, 503];
        if (retryableStatuses.includes(status) && attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.warn(`[Gemini Comparison] ${status} – retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw new GeminiAnalysisError({
        provider: 'gemini',
        code: 'NO_RESPONSE',
        message: 'Gemini returned no response for comparison',
      });
    }

    const analysisTime = (Date.now() - startTime) / 1000;
    const rawJson = response.text;

    if (!rawJson) {
      throw new GeminiAnalysisError({
        provider: 'gemini',
        code: 'EMPTY_CONTENT',
        message: 'Empty response from Gemini comparison',
      });
    }

    const result = JSON.parse(rawJson);

    logger.info(`[Gemini Comparison] Analysis completed in ${analysisTime.toFixed(1)}s - Risk: ${result.riskLevel}, Progression: ${result.overallProgression}`);

    return {
      ...result,
      timeElapsed,
      analysisTime,
    };
  } catch (error: any) {
    if (error instanceof GeminiAnalysisError) {
      throw error;
    }

    const message = error?.message || 'Gemini comparison failed';
    logger.error('[Gemini Comparison] Analysis failed:', message);
    
    throw new GeminiAnalysisError({
      provider: 'gemini',
      code: 'COMPARISON_FAILED',
      message,
      details: { raw: error },
    });
  }
}

// Helper function to fetch and encode images
async function fetchAndEncodeImage(imageUrl: string): Promise<{ data: string; mimeType: string }> {
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
  const imageBase64 = Buffer.from(imageBuffer).toString('base64');
  const mimeType = metadata.contentType || 'image/jpeg';

  return { data: imageBase64, mimeType };
}
