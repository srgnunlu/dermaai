import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Microscope, Sparkles, Zap, GitMerge, CheckCircle } from 'lucide-react';

interface AnalysisStage {
  id: string;
  text: string;
  threshold: number; // progress (%) at which this stage becomes active
  icon: React.ReactNode;
}

interface AnalysisProgressProps {
  isActive: boolean;
  onComplete?: () => void;
}

// Stages are driven by the (asymptotic) progress value, not a fixed timer — so the
// bar never claims "done" before the real API result arrives.
const ANALYSIS_STAGES: AnalysisStage[] = [
  { id: 'upload', text: 'Uploading images', threshold: 0, icon: <Microscope className="h-5 w-5 text-primary" /> },
  { id: 'prepare', text: 'Preparing AI models', threshold: 12, icon: <Brain className="h-5 w-5 text-primary" /> },
  { id: 'gemini', text: 'Gemini 3 is analyzing', threshold: 25, icon: <Sparkles className="h-5 w-5 text-purple-500" /> },
  { id: 'openai', text: 'GPT-5.5 is analyzing', threshold: 55, icon: <Zap className="h-5 w-5 text-green-500" /> },
  { id: 'merge', text: 'Merging results', threshold: 80, icon: <GitMerge className="h-5 w-5 text-primary" /> },
];

const TICK_MS = 120;
const PROGRESS_CAP = 93; // hold here until the real result completes
const TAU = 16000; // time constant — controls how quickly we approach the cap

export function AnalysisProgress({ isActive, onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setElapsed(0);
      return;
    }

    let total = 0;
    const interval = setInterval(() => {
      total += TICK_MS;
      // Exponential approach to the cap: fast at first, slowing as it nears completion.
      const value = PROGRESS_CAP * (1 - Math.exp(-total / TAU));
      setProgress(value);
      setElapsed(total);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isActive]);

  // Notify parent once we visually settle near the cap (parent owns real completion).
  useEffect(() => {
    if (isActive && progress >= PROGRESS_CAP - 0.5 && onComplete) {
      onComplete();
    }
  }, [isActive, progress, onComplete]);

  if (!isActive) return null;

  const currentStageIndex = ANALYSIS_STAGES.reduce(
    (acc, stage, idx) => (progress >= stage.threshold ? idx : acc),
    0
  );
  const currentStage = ANALYSIS_STAGES[currentStageIndex];
  const elapsedSeconds = Math.floor(elapsed / 1000);

  return (
    <Card className="glass-card-light overflow-hidden border-primary/20 shadow-lg">
      <CardContent className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="pulse-glow flex h-10 w-10 items-center justify-center rounded-full">
              <span className="animate-pulse">{currentStage.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">AI Analysis in Progress</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Two AI models are reviewing the case — this usually takes 30–60 seconds.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{currentStage.text}…</span>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" data-testid="progress-analysis" />
        </div>

        {/* Stage list */}
        <div className="space-y-2">
          {ANALYSIS_STAGES.map((stage, index) => {
            const isComplete = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 rounded-lg p-2 transition-all duration-300 ${
                  isCurrent
                    ? 'border border-primary/30 bg-primary/10'
                    : isComplete
                      ? 'bg-green-500/5'
                      : 'bg-muted/40'
                }`}
                data-testid={`stage-${stage.id}`}
              >
                <div className={isComplete ? 'text-green-600' : isCurrent ? 'animate-pulse' : 'text-muted-foreground'}>
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : stage.icon}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    isCurrent
                      ? 'font-medium text-foreground'
                      : isComplete
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {stage.text}
                </span>
                {isComplete && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>
            );
          })}
        </div>

        {/* Elapsed time */}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-center">
          <p className="text-sm text-muted-foreground">
            {progress >= PROGRESS_CAP - 0.5 ? (
              <>Almost done — finalizing results…</>
            ) : (
              <>
                Elapsed: <span className="font-semibold text-primary">{elapsedSeconds}s</span>
              </>
            )}
          </p>
          <div className="mt-2 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
