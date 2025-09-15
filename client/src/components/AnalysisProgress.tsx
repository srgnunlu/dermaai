import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Microscope, Zap, CheckCircle } from "lucide-react";

interface AnalysisStage {
  id: string;
  text: string;
  startPercent: number;
  endPercent: number;
  icon: React.ReactNode;
  duration: number; // in milliseconds
}

interface AnalysisProgressProps {
  isActive: boolean;
  onComplete?: () => void;
}

const analysisStages: AnalysisStage[] = [
  {
    id: "upload",
    text: "Görüntü yükleniyor...",
    startPercent: 0,
    endPercent: 10,
    icon: <Microscope className="h-5 w-5 text-blue-500" />,
    duration: 8000
  },
  {
    id: "prepare",
    text: "AI modelleri hazırlanıyor...",
    startPercent: 10,
    endPercent: 20,
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    duration: 6000
  },
  {
    id: "gemini",
    text: "Gemini analizi başlıyor...",
    startPercent: 20,
    endPercent: 50,
    icon: <Zap className="h-5 w-5 text-green-500" />,
    duration: 20000
  },
  {
    id: "openai",
    text: "OpenAI analizi başlıyor...",
    startPercent: 50,
    endPercent: 80,
    icon: <Brain className="h-5 w-5 text-orange-500" />,
    duration: 18000
  },
  {
    id: "combine",
    text: "Sonuçlar birleştiriliyor...",
    startPercent: 80,
    endPercent: 95,
    icon: <CheckCircle className="h-5 w-5 text-indigo-500" />,
    duration: 6000
  },
  {
    id: "complete",
    text: "Analiz tamamlanıyor...",
    startPercent: 95,
    endPercent: 100,
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    duration: 2000
  }
];

export function AnalysisProgress({ isActive, onComplete }: AnalysisProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setCurrentStageIndex(0);
      setTimeRemaining(60);
      return;
    }

    let totalElapsed = 0;
    const totalDuration = analysisStages.reduce((sum, stage) => sum + stage.duration, 0);
    
    const progressInterval = setInterval(() => {
      totalElapsed += 200; // Update every 200ms for smooth animation
      
      // Calculate which stage we're in
      let stageElapsed = 0;
      let currentStage = 0;
      
      for (let i = 0; i < analysisStages.length; i++) {
        if (totalElapsed <= stageElapsed + analysisStages[i].duration) {
          currentStage = i;
          break;
        }
        stageElapsed += analysisStages[i].duration;
      }
      
      setCurrentStageIndex(currentStage);
      
      // Calculate progress within current stage
      const stage = analysisStages[currentStage];
      const stageProgress = Math.min((totalElapsed - stageElapsed) / stage.duration, 1);
      const currentProgress = stage.startPercent + (stage.endPercent - stage.startPercent) * stageProgress;
      
      setProgress(Math.min(currentProgress, 100));
      
      // Calculate time remaining
      const remainingTime = Math.max(0, Math.ceil((totalDuration - totalElapsed) / 1000));
      setTimeRemaining(remainingTime);
      
      // Complete when we reach 100%
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        if (onComplete) {
          setTimeout(onComplete, 500); // Small delay for visual completion
        }
      }
    }, 200);

    return () => clearInterval(progressInterval);
  }, [isActive, onComplete]);

  if (!isActive) {
    return null;
  }

  const currentStage = analysisStages[currentStageIndex];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 shadow-lg">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-pulse">
              {currentStage.icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              AI Analizi Devam Ediyor
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Lütfen bekleyin, analiz {timeRemaining} saniye içinde tamamlanacak
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">
              İlerleme
            </span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 bg-gray-200 dark:bg-gray-700"
            data-testid="progress-analysis"
          />
        </div>

        {/* Current Stage */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
          <div className="flex items-center space-x-3">
            <div className="animate-bounce">
              {currentStage.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground" data-testid="text-current-stage">
                {currentStage.text}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${((progress - currentStage.startPercent) / (currentStage.endPercent - currentStage.startPercent)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground mb-3">Analiz Aşamaları:</h4>
          <div className="space-y-2">
            {analysisStages.map((stage, index) => {
              const isCompleted = progress >= stage.endPercent;
              const isCurrent = index === currentStageIndex;
              const isPending = progress < stage.startPercent;

              return (
                <div 
                  key={stage.id}
                  className={`flex items-center space-x-3 p-2 rounded-md transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
                      : isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                  }`}
                  data-testid={`stage-${stage.id}`}
                >
                  <div className={`transition-all duration-300 ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'animate-pulse' : 'text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      stage.icon
                    )}
                  </div>
                  <span className={`text-sm transition-all duration-300 ${
                    isCurrent 
                      ? 'font-medium text-blue-700 dark:text-blue-300' 
                      : isCompleted
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {stage.text}
                  </span>
                  {isCompleted && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="text-center p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-muted-foreground">
            Tahmini kalan süre: <span className="font-semibold text-primary">{timeRemaining} saniye</span>
          </p>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}