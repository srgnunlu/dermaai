// Controlled terminology for dermatology research.
// A curated list of the most common dermatologic diagnoses with ICD-10 codes.
// `malignant` flags lesions that count as "positive" in malignancy-detection
// (sensitivity/specificity) analyses. Used by the dermatologist review panel
// (structured diagnosis entry) and the research analytics engine.

export interface DermatologyDiagnosis {
  code: string; // ICD-10
  name: string;
  category: DiagnosisCategory;
  malignant: boolean;
}

export type DiagnosisCategory =
  | 'malignant'
  | 'premalignant'
  | 'benign-tumor'
  | 'inflammatory'
  | 'infectious'
  | 'pigmentary'
  | 'hair-nail'
  | 'bullous'
  | 'vascular'
  | 'other';

export const DERMATOLOGY_DIAGNOSES: DermatologyDiagnosis[] = [
  // Malignant
  { code: 'C43.9', name: 'Malignant melanoma', category: 'malignant', malignant: true },
  { code: 'C44.91', name: 'Basal cell carcinoma', category: 'malignant', malignant: true },
  { code: 'C44.92', name: 'Squamous cell carcinoma', category: 'malignant', malignant: true },
  { code: 'C84.0', name: 'Mycosis fungoides (cutaneous T-cell lymphoma)', category: 'malignant', malignant: true },
  { code: 'C46.0', name: "Kaposi's sarcoma", category: 'malignant', malignant: true },
  // Premalignant
  { code: 'L57.0', name: 'Actinic keratosis', category: 'premalignant', malignant: false },
  { code: 'D04.9', name: 'Carcinoma in situ of skin (Bowen disease)', category: 'premalignant', malignant: true },
  { code: 'D48.5', name: 'Dysplastic / atypical nevus', category: 'premalignant', malignant: false },
  // Benign tumors / lesions
  { code: 'L82.1', name: 'Seborrheic keratosis', category: 'benign-tumor', malignant: false },
  { code: 'D22.9', name: 'Melanocytic nevus', category: 'benign-tumor', malignant: false },
  { code: 'D23.9', name: 'Dermatofibroma', category: 'benign-tumor', malignant: false },
  { code: 'D17.9', name: 'Lipoma', category: 'benign-tumor', malignant: false },
  { code: 'L72.0', name: 'Epidermoid / sebaceous cyst', category: 'benign-tumor', malignant: false },
  { code: 'D18.01', name: 'Cherry angioma / hemangioma', category: 'vascular', malignant: false },
  { code: 'L98.0', name: 'Pyogenic granuloma', category: 'vascular', malignant: false },
  { code: 'L91.0', name: 'Keloid scar', category: 'benign-tumor', malignant: false },
  { code: 'L81.4', name: 'Lentigo / solar lentigo', category: 'pigmentary', malignant: false },
  { code: 'D23.0', name: 'Skin tag (acrochordon)', category: 'benign-tumor', malignant: false },
  // Inflammatory / eczematous
  { code: 'L20.9', name: 'Atopic dermatitis', category: 'inflammatory', malignant: false },
  { code: 'L25.9', name: 'Contact dermatitis', category: 'inflammatory', malignant: false },
  { code: 'L21.9', name: 'Seborrheic dermatitis', category: 'inflammatory', malignant: false },
  { code: 'L30.0', name: 'Nummular eczema', category: 'inflammatory', malignant: false },
  { code: 'L40.0', name: 'Psoriasis vulgaris', category: 'inflammatory', malignant: false },
  { code: 'L43.9', name: 'Lichen planus', category: 'inflammatory', malignant: false },
  { code: 'L42', name: 'Pityriasis rosea', category: 'inflammatory', malignant: false },
  { code: 'L70.0', name: 'Acne vulgaris', category: 'inflammatory', malignant: false },
  { code: 'L71.9', name: 'Rosacea', category: 'inflammatory', malignant: false },
  { code: 'L50.9', name: 'Urticaria', category: 'inflammatory', malignant: false },
  { code: 'L73.2', name: 'Hidradenitis suppurativa', category: 'inflammatory', malignant: false },
  { code: 'L92.0', name: 'Granuloma annulare', category: 'inflammatory', malignant: false },
  { code: 'L93.0', name: 'Cutaneous lupus erythematosus', category: 'inflammatory', malignant: false },
  { code: 'L51.9', name: 'Erythema multiforme', category: 'inflammatory', malignant: false },
  // Infectious
  { code: 'B35.4', name: 'Tinea corporis', category: 'infectious', malignant: false },
  { code: 'B35.3', name: 'Tinea pedis', category: 'infectious', malignant: false },
  { code: 'B35.0', name: 'Tinea capitis', category: 'infectious', malignant: false },
  { code: 'B35.1', name: 'Onychomycosis', category: 'infectious', malignant: false },
  { code: 'B37.2', name: 'Cutaneous candidiasis', category: 'infectious', malignant: false },
  { code: 'L01.0', name: 'Impetigo', category: 'infectious', malignant: false },
  { code: 'L03.90', name: 'Cellulitis', category: 'infectious', malignant: false },
  { code: 'L73.9', name: 'Folliculitis', category: 'infectious', malignant: false },
  { code: 'B07.9', name: 'Verruca vulgaris (common wart)', category: 'infectious', malignant: false },
  { code: 'B08.1', name: 'Molluscum contagiosum', category: 'infectious', malignant: false },
  { code: 'B00.9', name: 'Herpes simplex', category: 'infectious', malignant: false },
  { code: 'B02.9', name: 'Herpes zoster', category: 'infectious', malignant: false },
  { code: 'B86', name: 'Scabies', category: 'infectious', malignant: false },
  // Pigmentary
  { code: 'L80', name: 'Vitiligo', category: 'pigmentary', malignant: false },
  { code: 'L81.1', name: 'Melasma', category: 'pigmentary', malignant: false },
  { code: 'L81.0', name: 'Post-inflammatory hyperpigmentation', category: 'pigmentary', malignant: false },
  // Hair & nail
  { code: 'L63.9', name: 'Alopecia areata', category: 'hair-nail', malignant: false },
  { code: 'L64.9', name: 'Androgenetic alopecia', category: 'hair-nail', malignant: false },
  // Bullous
  { code: 'L12.0', name: 'Bullous pemphigoid', category: 'bullous', malignant: false },
  { code: 'L10.0', name: 'Pemphigus vulgaris', category: 'bullous', malignant: false },
  // Other
  { code: 'L85.3', name: 'Xerosis cutis', category: 'other', malignant: false },
  { code: 'R23.9', name: 'Other / undetermined skin lesion', category: 'other', malignant: false },
];

// Stable list of category labels for grouping in the UI.
export const DIAGNOSIS_CATEGORY_LABELS: Record<DiagnosisCategory, string> = {
  malignant: 'Malignant',
  premalignant: 'Premalignant',
  'benign-tumor': 'Benign Tumor',
  inflammatory: 'Inflammatory',
  infectious: 'Infectious',
  pigmentary: 'Pigmentary',
  'hair-nail': 'Hair & Nail',
  bullous: 'Bullous',
  vascular: 'Vascular',
  other: 'Other',
};

const byCode = new Map(DERMATOLOGY_DIAGNOSES.map((d) => [d.code, d]));
const byName = new Map(DERMATOLOGY_DIAGNOSES.map((d) => [d.name.toLowerCase(), d]));

export function getDiagnosisByCode(code: string | null | undefined): DermatologyDiagnosis | undefined {
  if (!code) return undefined;
  return byCode.get(code);
}

export function getDiagnosisByName(name: string | null | undefined): DermatologyDiagnosis | undefined {
  if (!name) return undefined;
  return byName.get(name.trim().toLowerCase());
}

// Best-effort: is a free-text / AI diagnosis label malignant?
// Matches against the controlled list by name, then by malignant keyword.
const MALIGNANT_KEYWORDS = ['melanoma', 'carcinoma', 'malignant', 'sarcoma', 'lymphoma', 'bowen'];

export function isLabelMalignant(label: string | null | undefined): boolean {
  if (!label) return false;
  const known = getDiagnosisByName(label);
  if (known) return known.malignant;
  const lower = label.toLowerCase();
  return MALIGNANT_KEYWORDS.some((kw) => lower.includes(kw));
}

export const FITZPATRICK_LABELS: Record<string, string> = {
  type1: 'Type I',
  type2: 'Type II',
  type3: 'Type III',
  type4: 'Type IV',
  type5: 'Type V',
  type6: 'Type VI',
};

export const GOLD_STANDARD_SOURCES = ['biopsy', 'clinical', 'followup'] as const;
export type GoldStandardSource = (typeof GOLD_STANDARD_SOURCES)[number];

export const REVIEW_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const STUDY_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];
