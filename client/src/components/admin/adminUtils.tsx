import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
} from 'lucide-react';

// Merge diagnoses from finalDiagnoses or, when absent, from the separate AI results.
export const getMergedDiagnoses = (caseItem: any) => {
  if (caseItem.finalDiagnoses && caseItem.finalDiagnoses.length > 0) {
    return caseItem.finalDiagnoses;
  }

  const allDiagnoses: any[] = [];

  if (caseItem.geminiAnalysis?.diagnoses && Array.isArray(caseItem.geminiAnalysis.diagnoses)) {
    allDiagnoses.push(...caseItem.geminiAnalysis.diagnoses);
  }
  if (caseItem.openaiAnalysis?.diagnoses && Array.isArray(caseItem.openaiAnalysis.diagnoses)) {
    allDiagnoses.push(...caseItem.openaiAnalysis.diagnoses);
  }

  if (allDiagnoses.length === 0) return [];

  allDiagnoses.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  return allDiagnoses.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800" data-testid={`badge-status-${status}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800" data-testid={`badge-status-${status}`}>
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" data-testid={`badge-status-${status}`}>
          {status}
        </Badge>
      );
  }
};

export const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return (
        <Badge className="bg-blue-100 text-blue-800" data-testid={`badge-role-${role}`}>
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    case 'user':
      return (
        <Badge variant="outline" data-testid={`badge-role-${role}`}>
          <Users className="w-3 h-3 mr-1" />
          User
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" data-testid={`badge-role-${role}`}>
          {role}
        </Badge>
      );
  }
};

export const getUrgencyBadge = (diagnoses: any[]) => {
  if (!diagnoses || diagnoses.length === 0) return null;
  const hasUrgent = diagnoses.some((d) => d.isUrgent);
  if (hasUrgent) {
    return (
      <Badge variant="destructive" data-testid="badge-urgent">
        <AlertCircle className="w-3 h-3 mr-1" />
        Urgent
      </Badge>
    );
  }
  return null;
};

export const getAIAnalysisInfo = (caseItem: any) => {
  const geminiDiagnoses = caseItem?.geminiAnalysis?.diagnoses ?? [];
  const openaiDiagnoses = caseItem?.openaiAnalysis?.diagnoses ?? [];
  const hasGemini = geminiDiagnoses.length > 0;
  const hasOpenAI = openaiDiagnoses.length > 0;

  if (!hasGemini && !hasOpenAI) {
    return <span className="text-gray-400 text-sm">No AI analysis</span>;
  }

  const formatConfidence = (confidence: number) => `${Math.round(confidence)}%`;

  const geminiTopConfidence = hasGemini
    ? Math.max(...geminiDiagnoses.map((d: any) => d?.confidence ?? 0))
    : 0;
  const openaiTopConfidence = hasOpenAI
    ? Math.max(...openaiDiagnoses.map((d: any) => d?.confidence ?? 0))
    : 0;

  return (
    <div className="flex flex-col gap-1">
      {hasGemini && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Gemini 3
          </Badge>
          <span className="text-sm font-medium">{formatConfidence(geminiTopConfidence)}</span>
          {typeof caseItem?.geminiAnalysis?.analysisTime === 'number' && (
            <span className="text-xs text-muted-foreground">
              {caseItem.geminiAnalysis.analysisTime.toFixed(1)}s
            </span>
          )}
        </div>
      )}
      {hasOpenAI && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            GPT-5.5
          </Badge>
          <span className="text-sm font-medium">{formatConfidence(openaiTopConfidence)}</span>
          {typeof caseItem?.openaiAnalysis?.analysisTime === 'number' && (
            <span className="text-xs text-muted-foreground">
              {caseItem.openaiAnalysis.analysisTime.toFixed(1)}s
            </span>
          )}
        </div>
      )}
    </div>
  );
};
