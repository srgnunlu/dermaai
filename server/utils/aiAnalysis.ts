/**
 * AI Analysis Utilities
 * Functions for combining and processing AI model results
 */

interface DiagnosisSource {
  model: 'gemini' | 'openai';
  confidence: number;
}

interface Diagnosis {
  name: string;
  confidence: number;
  description: string;
  keyFeatures: string[];
  recommendations: string[];
  sources?: DiagnosisSource[];
}

interface FinalDiagnosis extends Diagnosis {
  rank: number;
  isUrgent: boolean;
}

/**
 * Combine analysis results from multiple AI models
 * Applies consensus boosting when models agree
 */
export function combineAnalyses(geminiAnalysis: any, openaiAnalysis: any): FinalDiagnosis[] {
  const diagnoses = new Map<string, Diagnosis & { sources: DiagnosisSource[] }>();

  // Combine diagnoses from both models
  if (geminiAnalysis?.diagnoses) {
    geminiAnalysis.diagnoses.forEach((diagnosis: Diagnosis) => {
      const key = diagnosis.name.toLowerCase();
      if (!diagnoses.has(key)) {
        diagnoses.set(key, { ...diagnosis, sources: [] });
      }
      diagnoses.get(key)!.sources.push({
        model: 'gemini',
        confidence: diagnosis.confidence,
      });
    });
  }

  if (openaiAnalysis?.diagnoses) {
    openaiAnalysis.diagnoses.forEach((diagnosis: Diagnosis) => {
      const key = diagnosis.name.toLowerCase();
      if (!diagnoses.has(key)) {
        diagnoses.set(key, { ...diagnosis, sources: [] });
      }
      diagnoses.get(key)!.sources.push({
        model: 'openai',
        confidence: diagnosis.confidence,
      });
    });
  }

  // Calculate combined confidence and rank
  const finalDiagnoses = Array.from(diagnoses.values())
    .map((diagnosis) => {
      const avgConfidence =
        diagnosis.sources.reduce((sum, source) => sum + source.confidence, 0) /
        diagnosis.sources.length;

      // Boost confidence if both models agree (10% boost)
      const consensusBoost = diagnosis.sources.length > 1 ? 1.1 : 1.0;
      const finalConfidence = Math.min(100, Math.round(avgConfidence * consensusBoost));

      // Determine urgency based on diagnosis name and confidence
      const isUrgent = isUrgentCondition(diagnosis.name, finalConfidence);

      return {
        rank: 0, // Will be set after sorting
        name: diagnosis.name,
        confidence: finalConfidence,
        description: diagnosis.description,
        keyFeatures: diagnosis.keyFeatures || [],
        recommendations: diagnosis.recommendations || [],
        isUrgent,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .map((diagnosis, index) => ({
      ...diagnosis,
      rank: index + 1,
    }));

  // Return top 5 diagnoses
  return finalDiagnoses.slice(0, 5);
}

/**
 * Check if a diagnosis requires urgent medical attention
 */
export function isUrgentCondition(diagnosisName: string, confidence: number): boolean {
  const urgentConditions = ['melanoma', 'basal cell carcinoma', 'squamous cell carcinoma'];

  return (
    urgentConditions.some((condition) =>
      diagnosisName.toLowerCase().includes(condition.toLowerCase())
    ) && confidence > 25
  );
}
