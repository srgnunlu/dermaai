// Research statistics engine.
// Computes inter-rater agreement (Cohen's Kappa), diagnostic accuracy
// (Top-1/Top-3), malignancy-detection performance (sensitivity/specificity/
// PPV/NPV), a category-level confusion matrix, and Fitzpatrick subgroup
// analysis from the raw research dataset. Pure functions — no DB access.

import type { Case, DermatologistReview } from '@shared/schema';
import {
  DERMATOLOGY_DIAGNOSES,
  DIAGNOSIS_CATEGORY_LABELS,
  getDiagnosisByName,
  isLabelMalignant,
  type DiagnosisCategory,
} from '@shared/dermatology-diagnoses';

export type ResearchCase = Case & { skinType: string | null };

type RankedDiagnosis = { name: string; confidence: number };

const CATEGORY_ORDER = Object.keys(DIAGNOSIS_CATEGORY_LABELS) as DiagnosisCategory[];

// ---------- label helpers ----------

function normalize(label: string | null | undefined): string {
  return (label ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Fuzzy label match for accuracy: exact, or one contains the other.
function labelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

function categoryOf(label: string | null | undefined): DiagnosisCategory {
  const known = getDiagnosisByName(label);
  if (known) return known.category;
  if (isLabelMalignant(label)) return 'malignant';
  return 'other';
}

// ---------- extract ranked labels per model ----------

function rankedFromAnalysis(analysis: unknown): RankedDiagnosis[] {
  const a = analysis as { diagnoses?: Array<{ name?: string; confidence?: number }> } | null;
  if (!a?.diagnoses?.length) return [];
  return a.diagnoses
    .filter((d) => d?.name)
    .map((d) => ({ name: d.name as string, confidence: Number(d.confidence) || 0 }))
    .sort((x, y) => y.confidence - x.confidence);
}

function rankedFinal(c: Case): RankedDiagnosis[] {
  const final = c.finalDiagnoses;
  if (!final?.length) return [];
  return [...final]
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((d) => ({ name: d.name, confidence: Number(d.confidence) || 0 }));
}

export type ModelKey = 'gemini' | 'openai' | 'claude' | 'final' | 'dermatologist';

// Majority-vote consensus label across completed expert reviews for a case.
function dermatologistConsensus(reviews: DermatologistReview[]): { label: string | null; confidence: number } {
  const completed = reviews.filter(
    (r) => r.status === 'completed' && (r.structuredDiagnosis || r.freeTextDiagnosis)
  );
  if (!completed.length) return { label: null, confidence: 0 };
  const counts = new Map<string, number>();
  for (const r of completed) {
    const label = r.structuredDiagnosis || r.freeTextDiagnosis || '';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  Array.from(counts.entries()).forEach(([label, n]) => {
    if (n > bestN) {
      best = label;
      bestN = n;
    }
  });
  const avgConf =
    completed.reduce((s, r) => s + (r.confidenceScore ?? 0), 0) / completed.length;
  return { label: best, confidence: avgConf };
}

function rankedForModel(
  model: ModelKey,
  c: Case,
  reviews: DermatologistReview[]
): RankedDiagnosis[] {
  switch (model) {
    case 'gemini':
      return rankedFromAnalysis(c.geminiAnalysis);
    case 'openai':
      return rankedFromAnalysis(c.openaiAnalysis);
    case 'claude':
      return rankedFromAnalysis(c.claudeAnalysis);
    case 'final':
      return rankedFinal(c);
    case 'dermatologist': {
      const { label, confidence } = dermatologistConsensus(reviews);
      return label ? [{ name: label, confidence }] : [];
    }
  }
}

// ---------- statistics primitives ----------

// Wilson score interval for a proportion.
function wilsonInterval(successes: number, n: number): { lower: number; upper: number } {
  if (n === 0) return { lower: 0, upper: 0 };
  const z = 1.96;
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return {
    lower: Math.max(0, (centre - margin) / denom),
    upper: Math.min(1, (centre + margin) / denom),
  };
}

// Cohen's Kappa with standard error (normal approximation) on category labels.
function cohensKappa(pairs: Array<[string, string]>): {
  kappa: number;
  se: number;
  ciLower: number;
  ciUpper: number;
  n: number;
  observedAgreement: number;
} {
  const n = pairs.length;
  if (n === 0) return { kappa: 0, se: 0, ciLower: 0, ciUpper: 0, n: 0, observedAgreement: 0 };

  const categories = Array.from(new Set(pairs.flatMap(([a, b]) => [a, b])));
  let observed = 0;
  const rowMargin = new Map<string, number>();
  const colMargin = new Map<string, number>();
  for (const [a, b] of pairs) {
    if (a === b) observed++;
    rowMargin.set(a, (rowMargin.get(a) ?? 0) + 1);
    colMargin.set(b, (colMargin.get(b) ?? 0) + 1);
  }
  const po = observed / n;
  let pe = 0;
  for (const cat of categories) {
    pe += ((rowMargin.get(cat) ?? 0) / n) * ((colMargin.get(cat) ?? 0) / n);
  }
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  // Approximate SE of kappa (Fleiss): sqrt(po(1-po)) / ((1-pe) sqrt(n))
  const se = pe === 1 ? 0 : Math.sqrt((po * (1 - po)) / n) / (1 - pe);
  return {
    kappa,
    se,
    ciLower: kappa - 1.96 * se,
    ciUpper: kappa + 1.96 * se,
    n,
    observedAgreement: po,
  };
}

export function interpretKappa(kappa: number): string {
  if (kappa < 0) return 'Poor';
  if (kappa <= 0.2) return 'Slight';
  if (kappa <= 0.4) return 'Fair';
  if (kappa <= 0.6) return 'Moderate';
  if (kappa <= 0.8) return 'Substantial';
  return 'Almost Perfect';
}

// ---------- public output types ----------

export interface AccuracyResult {
  n: number;
  top1: number;
  top1CiLower: number;
  top1CiUpper: number;
  top3: number;
  top3CiLower: number;
  top3CiUpper: number;
}

export interface DiagnosticPerformance {
  n: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  sensitivity: number;
  specificity: number;
  ppv: number;
  npv: number;
  accuracy: number;
}

export interface KappaResult {
  label: string;
  kappa: number;
  se: number;
  ciLower: number;
  ciUpper: number;
  n: number;
  observedAgreement: number;
  interpretation: string;
}

export interface ModelSummary {
  model: ModelKey;
  label: string;
  casesWithPrediction: number;
  accuracy: AccuracyResult;
  diagnostic: DiagnosticPerformance;
  avgConfidence: number; // 0-100
}

export interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
  rowTotals: number[];
  colTotals: number[];
}

export interface SubgroupAccuracy {
  group: string;
  label: string;
  n: number;
  top1: number;
}

export interface ResearchAnalytics {
  generatedAt: string;
  totalCases: number;
  casesWithGoldStandard: number;
  models: ModelSummary[];
  kappas: KappaResult[];
  confusionMatrix: ConfusionMatrix; // gold standard (rows) vs final model (cols), category-level
  fitzpatrickSubgroups: SubgroupAccuracy[];
}

const MODEL_LABELS: Record<ModelKey, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI (GPT)',
  claude: 'Claude',
  final: 'AI Consensus',
  dermatologist: 'Dermatologist',
};

// ---------- per-model computations ----------

function computeAccuracy(
  cases: Case[],
  reviewsByCase: Map<string, DermatologistReview[]>,
  model: ModelKey
): AccuracyResult {
  const withGold = cases.filter((c) => c.goldStandardDiagnosis);
  let n = 0;
  let top1 = 0;
  let top3 = 0;
  for (const c of withGold) {
    const ranked = rankedForModel(model, c, reviewsByCase.get(c.id) ?? []);
    if (!ranked.length) continue;
    n++;
    const gold = c.goldStandardDiagnosis;
    if (labelsMatch(ranked[0].name, gold)) top1++;
    if (ranked.slice(0, 3).some((d) => labelsMatch(d.name, gold))) top3++;
  }
  const t1 = wilsonInterval(top1, n);
  const t3 = wilsonInterval(top3, n);
  return {
    n,
    top1: n ? top1 / n : 0,
    top1CiLower: t1.lower,
    top1CiUpper: t1.upper,
    top3: n ? top3 / n : 0,
    top3CiLower: t3.lower,
    top3CiUpper: t3.upper,
  };
}

function computeDiagnostic(
  cases: Case[],
  reviewsByCase: Map<string, DermatologistReview[]>,
  model: ModelKey
): DiagnosticPerformance {
  // Malignancy detection vs gold standard.
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const c of cases) {
    if (!c.goldStandardDiagnosis) continue;
    const ranked = rankedForModel(model, c, reviewsByCase.get(c.id) ?? []);
    if (!ranked.length) continue;
    const predMalignant = isLabelMalignant(ranked[0].name);
    const goldMalignant = isLabelMalignant(c.goldStandardDiagnosis);
    if (predMalignant && goldMalignant) tp++;
    else if (predMalignant && !goldMalignant) fp++;
    else if (!predMalignant && !goldMalignant) tn++;
    else fn++;
  }
  const n = tp + fp + tn + fn;
  const safe = (num: number, den: number) => (den ? num / den : 0);
  return {
    n,
    tp,
    fp,
    tn,
    fn,
    sensitivity: safe(tp, tp + fn),
    specificity: safe(tn, tn + fp),
    ppv: safe(tp, tp + fp),
    npv: safe(tn, tn + fn),
    accuracy: safe(tp + tn, n),
  };
}

function computeAvgConfidence(
  cases: Case[],
  reviewsByCase: Map<string, DermatologistReview[]>,
  model: ModelKey
): number {
  let sum = 0;
  let n = 0;
  for (const c of cases) {
    const ranked = rankedForModel(model, c, reviewsByCase.get(c.id) ?? []);
    if (!ranked.length) continue;
    if (model === 'dermatologist') {
      // confidence stored 1-5 Likert -> percentage
      const conf = ranked[0].confidence;
      if (conf > 0) {
        sum += (conf / 5) * 100;
        n++;
      }
    } else {
      sum += ranked[0].confidence; // already 0-100
      n++;
    }
  }
  return n ? sum / n : 0;
}

function countPredictions(
  cases: Case[],
  reviewsByCase: Map<string, DermatologistReview[]>,
  model: ModelKey
): number {
  return cases.filter((c) => rankedForModel(model, c, reviewsByCase.get(c.id) ?? []).length > 0)
    .length;
}

// ---------- main entry ----------

export function computeResearchAnalytics(
  cases: ResearchCase[],
  reviews: DermatologistReview[]
): ResearchAnalytics {
  const reviewsByCase = new Map<string, DermatologistReview[]>();
  for (const r of reviews) {
    const list = reviewsByCase.get(r.caseId) ?? [];
    list.push(r);
    reviewsByCase.set(r.caseId, list);
  }

  const models: ModelKey[] = ['gemini', 'openai', 'claude', 'final', 'dermatologist'];
  const modelSummaries: ModelSummary[] = models.map((model) => ({
    model,
    label: MODEL_LABELS[model],
    casesWithPrediction: countPredictions(cases, reviewsByCase, model),
    accuracy: computeAccuracy(cases, reviewsByCase, model),
    diagnostic: computeDiagnostic(cases, reviewsByCase, model),
    avgConfidence: computeAvgConfidence(cases, reviewsByCase, model),
  }));

  // Kappa pairs (category-level agreement).
  const kappaPairDefs: Array<{ label: string; a: ModelKey; b: ModelKey | 'gold' }> = [
    { label: 'AI Consensus vs Dermatologist', a: 'final', b: 'dermatologist' },
    { label: 'Gemini vs Dermatologist', a: 'gemini', b: 'dermatologist' },
    { label: 'OpenAI vs Dermatologist', a: 'openai', b: 'dermatologist' },
    { label: 'Claude vs Dermatologist', a: 'claude', b: 'dermatologist' },
    { label: 'Gemini vs OpenAI', a: 'gemini', b: 'openai' },
    { label: 'Gemini vs Claude', a: 'gemini', b: 'claude' },
    { label: 'OpenAI vs Claude', a: 'openai', b: 'claude' },
    { label: 'Claude vs Gold Standard', a: 'claude', b: 'gold' },
    { label: 'AI Consensus vs Gold Standard', a: 'final', b: 'gold' },
    { label: 'Dermatologist vs Gold Standard', a: 'dermatologist', b: 'gold' },
  ];

  const kappas: KappaResult[] = kappaPairDefs.map(({ label, a, b }) => {
    const pairs: Array<[string, string]> = [];
    for (const c of cases) {
      const ra = rankedForModel(a, c, reviewsByCase.get(c.id) ?? []);
      if (!ra.length) continue;
      let labelB: string | null | undefined;
      if (b === 'gold') {
        labelB = c.goldStandardDiagnosis;
      } else {
        const rb = rankedForModel(b, c, reviewsByCase.get(c.id) ?? []);
        labelB = rb.length ? rb[0].name : null;
      }
      if (!labelB) continue;
      pairs.push([categoryOf(ra[0].name), categoryOf(labelB)]);
    }
    const k = cohensKappa(pairs);
    return {
      label,
      kappa: k.kappa,
      se: k.se,
      ciLower: k.ciLower,
      ciUpper: k.ciUpper,
      n: k.n,
      observedAgreement: k.observedAgreement,
      interpretation: interpretKappa(k.kappa),
    };
  });

  // Confusion matrix: gold standard (rows) vs final model (cols), category-level.
  const presentCats = new Set<DiagnosisCategory>();
  const cmPairs: Array<[DiagnosisCategory, DiagnosisCategory]> = [];
  for (const c of cases) {
    if (!c.goldStandardDiagnosis) continue;
    const ranked = rankedForModel('final', c, reviewsByCase.get(c.id) ?? []);
    if (!ranked.length) continue;
    const goldCat = categoryOf(c.goldStandardDiagnosis);
    const predCat = categoryOf(ranked[0].name);
    presentCats.add(goldCat);
    presentCats.add(predCat);
    cmPairs.push([goldCat, predCat]);
  }
  const cmLabels = CATEGORY_ORDER.filter((c) => presentCats.has(c));
  const idx = new Map(cmLabels.map((c, i) => [c, i]));
  const matrix = cmLabels.map(() => cmLabels.map(() => 0));
  for (const [g, p] of cmPairs) {
    matrix[idx.get(g)!][idx.get(p)!]++;
  }
  const confusionMatrix: ConfusionMatrix = {
    labels: cmLabels.map((c) => DIAGNOSIS_CATEGORY_LABELS[c]),
    matrix,
    rowTotals: matrix.map((row) => row.reduce((a, b) => a + b, 0)),
    colTotals: cmLabels.map((_, j) => matrix.reduce((s, row) => s + row[j], 0)),
  };

  // Fitzpatrick subgroup: Top-1 accuracy of the final model per skin type.
  const fitzGroups = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6'];
  const fitzLabels: Record<string, string> = {
    type1: 'Fitzpatrick I',
    type2: 'Fitzpatrick II',
    type3: 'Fitzpatrick III',
    type4: 'Fitzpatrick IV',
    type5: 'Fitzpatrick V',
    type6: 'Fitzpatrick VI',
  };
  const fitzpatrickSubgroups: SubgroupAccuracy[] = fitzGroups.map((group) => {
    const subset = cases.filter((c) => c.skinType === group && c.goldStandardDiagnosis);
    let n = 0;
    let hit = 0;
    for (const c of subset) {
      const ranked = rankedForModel('final', c, reviewsByCase.get(c.id) ?? []);
      if (!ranked.length) continue;
      n++;
      if (labelsMatch(ranked[0].name, c.goldStandardDiagnosis)) hit++;
    }
    return { group, label: fitzLabels[group], n, top1: n ? hit / n : 0 };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalCases: cases.length,
    casesWithGoldStandard: cases.filter((c) => c.goldStandardDiagnosis).length,
    models: modelSummaries,
    kappas,
    confusionMatrix,
    fitzpatrickSubgroups,
  };
}

// ---------- CSV export (long format, R/SPSS ready) ----------

export function buildResearchCsv(
  cases: ResearchCase[],
  reviews: DermatologistReview[]
): string {
  const reviewsByCase = new Map<string, DermatologistReview[]>();
  for (const r of reviews) {
    const list = reviewsByCase.get(r.caseId) ?? [];
    list.push(r);
    reviewsByCase.set(r.caseId, list);
  }

  const header = [
    'case_id',
    'rater_type', // gemini | openai | final | dermatologist | gold_standard
    'rater_id',
    'rank',
    'diagnosis',
    'diagnosis_category',
    'is_malignant',
    'confidence',
    'gold_standard',
    'gold_standard_category',
    'gold_standard_source',
    'fitzpatrick',
    'study_id',
    'correct_top1',
  ];

  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    // Prevent CSV formula injection
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const rows: string[] = [header.map(escape).join(',')];

  const addModelRows = (
    c: ResearchCase,
    raterType: string,
    ranked: RankedDiagnosis[],
    raterId: string,
    confScale: 'pct' | 'likert'
  ) => {
    ranked.slice(0, 3).forEach((d, i) => {
      const goldCat = c.goldStandardDiagnosis ? categoryOf(c.goldStandardDiagnosis) : '';
      rows.push(
        [
          c.caseId,
          raterType,
          raterId,
          i + 1,
          d.name,
          categoryOf(d.name),
          isLabelMalignant(d.name) ? 1 : 0,
          confScale === 'likert' ? d.confidence : Math.round(d.confidence),
          c.goldStandardDiagnosis ?? '',
          goldCat ? DIAGNOSIS_CATEGORY_LABELS[goldCat as DiagnosisCategory] : '',
          c.goldStandardSource ?? '',
          c.skinType ?? '',
          c.studyId ?? '',
          i === 0 && c.goldStandardDiagnosis && labelsMatch(d.name, c.goldStandardDiagnosis)
            ? 1
            : 0,
        ]
          .map(escape)
          .join(',')
      );
    });
  };

  for (const c of cases) {
    addModelRows(c, 'gemini', rankedFromAnalysis(c.geminiAnalysis), 'gemini', 'pct');
    addModelRows(c, 'openai', rankedFromAnalysis(c.openaiAnalysis), 'openai', 'pct');
    addModelRows(c, 'claude', rankedFromAnalysis(c.claudeAnalysis), 'claude', 'pct');
    addModelRows(c, 'final', rankedFinal(c), 'final', 'pct');
    // Each dermatologist review as its own row
    const caseReviews = reviewsByCase.get(c.id) ?? [];
    for (const r of caseReviews) {
      const label = r.structuredDiagnosis || r.freeTextDiagnosis;
      if (!label) continue;
      addModelRows(
        c,
        'dermatologist',
        [{ name: label, confidence: r.confidenceScore ?? 0 }],
        r.reviewerId,
        'likert'
      );
    }
  }

  return rows.join('\n');
}

// Surface the controlled list for clients that want it server-driven.
export function getControlledDiagnoses() {
  return DERMATOLOGY_DIAGNOSES;
}
