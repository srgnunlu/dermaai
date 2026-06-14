import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Save,
  FileText,
  Plus,
  Sparkles,
  Zap,
  Bot,
  Check,
  Users,
  GitCompareArrows,
  CheckCircle2,
} from 'lucide-react';
import type { Case } from '@shared/schema';

interface DiagnosisResultsProps {
  caseData: Case;
  onSaveCase: () => void;
  onGenerateReport: () => void;
  onNewAnalysis: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

type Diagnosis = {
  name: string;
  confidence: number;
  description?: string;
  keyFeatures?: string[];
  recommendations?: string[];
};

type ModelAnalysis = { diagnoses?: Diagnosis[]; analysisTime?: number } | null | undefined;

const normalize = (name: string) => name.trim().toLowerCase();

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'text-green-600 dark:text-green-500';
  if (confidence >= 60) return 'text-blue-600 dark:text-blue-500';
  if (confidence >= 40) return 'text-yellow-600 dark:text-yellow-500';
  return 'text-red-600 dark:text-red-500';
};

const getConfidenceBarColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-blue-500';
  if (confidence >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Animated confidence bar — grows from 0 to the target width on mount.
function ConfidenceBar({ confidence }: { confidence: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence), 80);
    return () => clearTimeout(t);
  }, [confidence]);
  return (
    <div className="mt-1 h-2 w-20 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${getConfidenceBarColor(confidence)}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

interface AIAnalysisCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  analysis: ModelAnalysis;
  color: string;
  // Map of normalized diagnosis name → how many models agree on it.
  agreementCounts: Map<string, number>;
  modelsPresent: number;
}

const AIAnalysisCard = memo(function AIAnalysisCard({
  title,
  subtitle,
  icon,
  analysis,
  color,
  agreementCounts,
  modelsPresent,
}: AIAnalysisCardProps) {
  if (!analysis || !analysis.diagnoses || analysis.diagnoses.length === 0) {
    return (
      <Card className={`glass-card-light border-2 ${color}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            <span className="flex flex-col">
              <span>{title}</span>
              <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">No analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const diagnoses = analysis.diagnoses || [];
  const analysisTime = analysis.analysisTime || 0;

  return (
    <Card className={`glass-card-light border-2 ${color}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            <span className="flex flex-col">
              <span>{title}</span>
              <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>
            </span>
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {analysisTime.toFixed(1)}s
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnoses.map((diagnosis: Diagnosis, index: number) => {
          const agreement = agreementCounts.get(normalize(diagnosis.name)) ?? 1;
          const isShared = agreement >= 2;
          const isFullConsensus = modelsPresent >= 2 && agreement >= modelsPresent;
          return (
            <div
              key={index}
              className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${
                isShared
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-muted-foreground/20 bg-muted/20'
              }`}
            >
              {/* Rank and Confidence */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold leading-tight">{diagnosis.name}</h4>
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${
                        isShared
                          ? 'text-green-600 dark:text-green-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isFullConsensus ? (
                        <>
                          <Users className="h-3 w-3" /> All models agree
                        </>
                      ) : isShared ? (
                        <>
                          <Check className="h-3 w-3" /> {agreement} models agree
                        </>
                      ) : (
                        <>
                          <GitCompareArrows className="h-3 w-3" /> Single model
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(diagnosis.confidence)}`}>
                    {diagnosis.confidence}%
                  </div>
                  <ConfidenceBar confidence={diagnosis.confidence} />
                </div>
              </div>

              {diagnosis.description && (
                <p className="mb-3 text-sm text-muted-foreground">{diagnosis.description}</p>
              )}

              {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                <div className="mb-3">
                  <h5 className="mb-2 text-sm font-semibold">Key Features:</h5>
                  <ul className="space-y-1">
                    {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="mr-2 text-primary">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                <div>
                  <h5 className="mb-2 text-sm font-semibold">Recommendations:</h5>
                  <ul className="space-y-1">
                    {diagnosis.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="mr-2 text-primary">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

export const DiagnosisResults = memo(function DiagnosisResults({
  caseData,
  onSaveCase,
  onGenerateReport,
  onNewAnalysis,
  isSaving = false,
  isSaved = false,
}: DiagnosisResultsProps) {
  const { geminiAnalysis, openaiAnalysis, claudeAnalysis } = caseData;

  const isAnalyzing = !geminiAnalysis && !openaiAnalysis && !claudeAnalysis;

  if (isAnalyzing) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-8 text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            data-testid="loading-spinner"
          ></div>
          <p className="mb-2 text-lg font-medium text-foreground">Processing Analysis...</p>
          <p className="text-sm text-muted-foreground">
            AI models are analyzing the image and symptoms
          </p>
        </CardContent>
      </Card>
    );
  }

  // Models that actually returned results.
  const models: ModelAnalysis[] = [geminiAnalysis, openaiAnalysis, claudeAnalysis];
  const presentModels = models.filter((m) => (m?.diagnoses?.length ?? 0) > 0);
  const modelsPresent = presentModels.length;

  // Cross-model agreement: for each normalized diagnosis name, count how many
  // models include it. ≥2 = shared, === modelsPresent = full consensus.
  const agreementCounts = new Map<string, number>();
  for (const m of presentModels) {
    const seen = new Set<string>();
    for (const d of m?.diagnoses ?? []) {
      const key = normalize(d.name);
      if (seen.has(key)) continue; // count each model at most once per diagnosis
      seen.add(key);
      agreementCounts.set(key, (agreementCounts.get(key) ?? 0) + 1);
    }
  }

  // Human-readable labels for findings shared by ≥2 models (original casing,
  // preferring the first model that mentions each).
  const sharedLabelMap = new Map<string, string>();
  for (const m of presentModels) {
    for (const d of m?.diagnoses ?? []) {
      const key = normalize(d.name);
      if ((agreementCounts.get(key) ?? 0) >= 2 && !sharedLabelMap.has(key)) {
        sharedLabelMap.set(key, d.name);
      }
    }
  }
  const sharedLabels = Array.from(sharedLabelMap.values());

  const hasMultiple = modelsPresent >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card-light overflow-hidden border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Brain className="h-7 w-7 text-primary" />
                AI Analysis Results
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Independent analysis from three AI models
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onSaveCase}
                variant="outline"
                disabled={isSaving || isSaved}
                className="flex-1 gap-2 sm:flex-none"
                data-testid="button-save-case"
              >
                {isSaved ? <Check size={16} /> : <Save size={16} />}
                {isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save Case'}
              </Button>
              <Button
                onClick={onGenerateReport}
                variant="outline"
                className="flex-1 gap-2 sm:flex-none"
                data-testid="button-generate-report"
              >
                <FileText size={16} />
                Generate Report
              </Button>
              <Button
                onClick={onNewAnalysis}
                variant="default"
                className="flex-1 gap-2 bg-gradient-to-r from-[#0891B2] to-[#14B8A6] text-white hover:opacity-95 sm:flex-none"
                data-testid="button-new-analysis"
              >
                <Plus size={16} />
                New Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consensus banner */}
      {hasMultiple && (
        <Card
          className={`border-2 ${
            sharedLabels.length > 0
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-orange-400/30 bg-orange-400/5'
          }`}
        >
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {sharedLabels.length > 0 ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600 dark:text-green-500" />
              ) : (
                <GitCompareArrows className="mt-0.5 h-6 w-6 shrink-0 text-orange-600 dark:text-orange-500" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {sharedLabels.length > 0
                    ? `${modelsPresent} models agree on ${sharedLabels.length} finding${sharedLabels.length > 1 ? 's' : ''}`
                    : `${modelsPresent} models diverge on all findings`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sharedLabels.length > 0
                    ? 'Findings shared by 2+ models are highlighted in green; model-specific findings are muted.'
                    : 'No overlapping findings — review each model carefully.'}
                </p>
              </div>
            </div>
            {sharedLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(sharedLabelMap.entries()).map(([key, label]) => (
                  <Badge
                    key={key}
                    className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                    variant="outline"
                  >
                    {label}
                    <span className="ml-1 opacity-70">×{agreementCounts.get(key)}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Side-by-side AI Results (stacks on mobile, 3 columns on desktop) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AIAnalysisCard
          title="Gemini 3"
          subtitle="Google"
          icon={<Sparkles className="h-5 w-5 text-blue-600" />}
          analysis={geminiAnalysis}
          color="border-blue-500/30"
          agreementCounts={agreementCounts}
          modelsPresent={modelsPresent}
        />
        <AIAnalysisCard
          title="GPT-5.5"
          subtitle="OpenAI"
          icon={<Zap className="h-5 w-5 text-green-600" />}
          analysis={openaiAnalysis}
          color="border-green-500/30"
          agreementCounts={agreementCounts}
          modelsPresent={modelsPresent}
        />
        <AIAnalysisCard
          title="Claude Sonnet 4.6"
          subtitle="Anthropic"
          icon={<Bot className="h-5 w-5 text-orange-600" />}
          analysis={claudeAnalysis}
          color="border-orange-500/30"
          agreementCounts={agreementCounts}
          modelsPresent={modelsPresent}
        />
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Medical Disclaimer:</strong> These AI-assisted possible findings are for
            awareness and preliminary assessment only. They do not provide a diagnosis or treatment
            recommendation. Consult a qualified healthcare professional for medical concerns. The
            results from all three AI models are shown independently for comparison.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
