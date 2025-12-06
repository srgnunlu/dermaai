import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Save, FileText, Plus, Sparkles, Zap } from 'lucide-react';
import type { Case } from '@shared/schema';

interface DiagnosisResultsProps {
  caseData: Case;
  onSaveCase: () => void;
  onGenerateReport: () => void;
  onNewAnalysis: () => void;
}

// Pure helper functions
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

// Single AI Analysis Card Component
interface AIAnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  analysis: any;
  color: string;
}

const AIAnalysisCard = memo(function AIAnalysisCard({
  title,
  icon,
  analysis,
  color,
}: AIAnalysisCardProps) {
  if (!analysis || !analysis.diagnoses || analysis.diagnoses.length === 0) {
    return (
      <Card className={`border-2 ${color}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No analysis available</p>
        </CardContent>
      </Card>
    );
  }

  const diagnoses = analysis.diagnoses || [];
  const analysisTime = analysis.analysisTime || 0;

  return (
    <Card className={`border-2 ${color}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {analysisTime.toFixed(1)}s
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnoses.map((diagnosis: any, index: number) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${index === 0 ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'
              }`}
          >
            {/* Rank and Confidence */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <h4 className="font-semibold text-lg">{diagnosis.name}</h4>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getConfidenceColor(diagnosis.confidence)}`}>
                  {diagnosis.confidence}%
                </div>
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${getConfidenceBarColor(diagnosis.confidence)}`}
                    style={{ width: `${diagnosis.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            {diagnosis.description && (
              <p className="text-sm text-muted-foreground mb-3">{diagnosis.description}</p>
            )}

            {/* Key Features */}
            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-semibold mb-2">Key Features:</h5>
                <ul className="space-y-1">
                  {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold mb-2">Recommendations:</h5>
                <ul className="space-y-1">
                  {diagnosis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start">
                      <span className="text-primary mr-2">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
});

export const DiagnosisResults = memo(function DiagnosisResults({
  caseData,
  onSaveCase,
  onGenerateReport,
  onNewAnalysis,
}: DiagnosisResultsProps) {
  const { geminiAnalysis, openaiAnalysis } = caseData;

  // Check if analysis is still in progress
  const isAnalyzing = !geminiAnalysis && !openaiAnalysis;

  if (isAnalyzing) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-8 text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"
            data-testid="loading-spinner"
          ></div>
          <p className="text-lg font-medium text-foreground mb-2">Processing Analysis...</p>
          <p className="text-sm text-muted-foreground">
            AI models are analyzing the image and symptoms
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Brain className="text-primary h-7 w-7" />
                AI Analysis Results
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Independent analysis from two AI models
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onSaveCase}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-save-case"
              >
                <Save size={16} />
                Save Case
              </Button>
              <Button
                onClick={onGenerateReport}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-generate-report"
              >
                <FileText size={16} />
                Generate Report
              </Button>
              <Button
                onClick={onNewAnalysis}
                variant="default"
                className="flex items-center gap-2"
                data-testid="button-new-analysis"
              >
                <Plus size={16} />
                New Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side AI Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemini Analysis */}
        <AIAnalysisCard
          title="Gemini 3"
          icon={<Sparkles className="h-5 w-5 text-purple-600" />}
          analysis={geminiAnalysis}
          color="border-purple-500/30"
        />

        {/* OpenAI Analysis */}
        <AIAnalysisCard
          title="GPT-5.1"
          icon={<Zap className="h-5 w-5 text-green-600" />}
          analysis={openaiAnalysis}
          color="border-green-500/30"
        />
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Medical Disclaimer:</strong> These AI-generated diagnoses are for informational
            purposes only. Please consult with a qualified healthcare professional for accurate
            diagnosis and treatment. The results from both AI models are shown independently for
            comparison.
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
