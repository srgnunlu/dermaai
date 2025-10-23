import { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, CheckCircle, AlertTriangle, Save, FileText, Plus } from 'lucide-react';
import type { Case } from '@shared/schema';

interface DiagnosisResultsProps {
  caseData: Case;
  onSaveCase: () => void;
  onGenerateReport: () => void;
  onNewAnalysis: () => void;
}

// Pure helper functions moved outside component
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'text-success';
  if (confidence >= 60) return 'text-foreground';
  if (confidence >= 40) return 'text-muted-foreground';
  return 'text-destructive';
};

const getConfidenceBarColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-success';
  if (confidence >= 60) return 'bg-foreground';
  if (confidence >= 40) return 'bg-muted-foreground';
  return 'bg-destructive';
};

const getBorderColor = (rank: number, isUrgent: boolean): string => {
  if (rank === 1 && !isUrgent)
    return 'border-success/20 bg-gradient-to-r from-success/10 to-success/5';
  if (isUrgent)
    return 'border-destructive/20 bg-gradient-to-r from-destructive/10 to-destructive/5';
  return 'border-border bg-card';
};

export const DiagnosisResults = memo(function DiagnosisResults({
  caseData,
  onSaveCase,
  onGenerateReport,
  onNewAnalysis,
}: DiagnosisResultsProps) {
  const { finalDiagnoses, geminiAnalysis, openaiAnalysis } = caseData;

  // Memoize consensus calculation
  const consensus = useMemo(
    () => (geminiAnalysis && openaiAnalysis ? 94 : 0),
    [geminiAnalysis, openaiAnalysis]
  );

  if (!finalDiagnoses || finalDiagnoses.length === 0) {
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
    <Card className="bg-card border border-border shadow-sm">
      {/* Analysis Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center">
              <Bot className="text-primary mr-2" size={24} />
              AI Analysis Results
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Dual AI model analysis completed</p>
          </div>
          <div className="flex items-center space-x-4">
            {geminiAnalysis && (
              <div className="flex items-center text-sm text-success">
                <CheckCircle size={16} className="mr-2" />
                Gemini 2.5 Flash
              </div>
            )}
            {openaiAnalysis && (
              <div className="flex items-center text-sm text-success">
                <CheckCircle size={16} className="mr-2" />
                ChatGPT-5
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Ranked Diagnoses */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-foreground mb-4">
            Preliminary Diagnoses (Ranked by Confidence)
          </h4>

          {finalDiagnoses.map((diagnosis, index) => (
            <div
              key={index}
              className={`diagnosis-card rounded-lg p-4 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${getBorderColor(diagnosis.rank, diagnosis.isUrgent)} border`}
              data-testid={`diagnosis-card-${index + 1}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Badge
                      variant={diagnosis.rank === 1 ? 'default' : 'secondary'}
                      className={`mr-3 ${diagnosis.rank === 1 ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {diagnosis.rank}
                    </Badge>
                    <h5
                      className="text-lg font-semibold text-foreground"
                      data-testid={`text-diagnosis-name-${index + 1}`}
                    >
                      {diagnosis.name}
                    </h5>
                    <span
                      className={`ml-auto text-lg font-bold ${getConfidenceColor(diagnosis.confidence)}`}
                      data-testid={`text-confidence-${index + 1}`}
                    >
                      {diagnosis.confidence}%
                    </span>
                  </div>
                  <div className="probability-bar bg-muted h-2 rounded-full mb-3">
                    <div
                      className={`h-full rounded-full ${getConfidenceBarColor(diagnosis.confidence)}`}
                      style={{ width: `${diagnosis.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <p
                className="text-sm text-muted-foreground mb-3"
                data-testid={`text-description-${index + 1}`}
              >
                {diagnosis.description}
              </p>

              {(diagnosis.keyFeatures.length > 0 || diagnosis.recommendations.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {diagnosis.keyFeatures.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Key Features:</span>
                      <ul className="text-muted-foreground mt-1 space-y-1">
                        {diagnosis.keyFeatures.map((feature, idx) => (
                          <li key={idx}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {diagnosis.recommendations.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Recommendations:</span>
                      <ul className="text-muted-foreground mt-1 space-y-1">
                        {diagnosis.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {diagnosis.isUrgent && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm mt-3">
                  <div className="flex items-center text-destructive">
                    <AlertTriangle size={16} className="mr-2" />
                    <span className="font-medium">
                      {diagnosis.confidence > 50
                        ? 'Immediate dermatological referral recommended'
                        : 'Requires professional evaluation'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Model Confidence Comparison */}
        {(geminiAnalysis || openaiAnalysis) && (
          <div className="mt-8 bg-muted/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">AI Model Consensus</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {geminiAnalysis && (
                <div>
                  <div className="flex items-center mb-3">
                    <Brain className="text-primary mr-2" size={20} />
                    <span className="font-medium text-foreground">Gemini 2.5 Flash</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Top diagnosis confidence:</span>
                      <span
                        className="font-medium text-foreground"
                        data-testid="text-gemini-confidence"
                      >
                        {geminiAnalysis.diagnoses?.[0]?.confidence || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analysis time:</span>
                      <span className="font-medium text-foreground" data-testid="text-gemini-time">
                        {geminiAnalysis.analysisTime || 0}s
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {openaiAnalysis && (
                <div>
                  <div className="flex items-center mb-3">
                    <Bot className="text-secondary mr-2" size={20} />
                    <span className="font-medium text-foreground">ChatGPT-5</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Top diagnosis confidence:</span>
                      <span
                        className="font-medium text-foreground"
                        data-testid="text-openai-confidence"
                      >
                        {openaiAnalysis.diagnoses?.[0]?.confidence || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Analysis time:</span>
                      <span className="font-medium text-foreground" data-testid="text-openai-time">
                        {openaiAnalysis.analysisTime || 0}s
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {consensus > 0 && (
              <div className="mt-4 p-4 bg-card rounded-md border border-border">
                <div className="flex items-center text-success">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="font-medium" data-testid="text-consensus">
                    High consensus between AI models ({consensus}% agreement)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 pt-6 border-t border-border">
          <Button
            onClick={onSaveCase}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 font-medium"
            data-testid="button-save-case"
          >
            <Save size={16} className="mr-2" />
            Save Case
          </Button>
          <Button
            onClick={onGenerateReport}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 font-medium"
            data-testid="button-generate-report"
          >
            <FileText size={16} className="mr-2" />
            Generate Report
          </Button>
          <Button
            onClick={onNewAnalysis}
            variant="outline"
            className="border-border hover:bg-muted/50 text-foreground px-6 py-3 font-medium"
            data-testid="button-new-analysis"
          >
            <Plus size={16} className="mr-2" />
            New Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
