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
  if (caseItem.claudeAnalysis?.diagnoses && Array.isArray(caseItem.claudeAnalysis.diagnoses)) {
    allDiagnoses.push(...caseItem.claudeAnalysis.diagnoses);
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
  const formatConfidence = (confidence: number) => `${Math.round(confidence)}%`;

  const rows = [
    {
      key: 'gemini',
      label: 'Gemini 3',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      analysis: caseItem?.geminiAnalysis,
    },
    {
      key: 'openai',
      label: 'GPT-5.5',
      className: 'bg-green-50 text-green-700 border-green-200',
      analysis: caseItem?.openaiAnalysis,
    },
    {
      key: 'claude',
      label: 'Claude',
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      analysis: caseItem?.claudeAnalysis,
    },
  ].filter((r) => (r.analysis?.diagnoses?.length ?? 0) > 0);

  if (rows.length === 0) {
    return <span className="text-gray-400 text-sm">No AI analysis</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {rows.map((r) => {
        const topConfidence = Math.max(
          ...r.analysis.diagnoses.map((d: any) => d?.confidence ?? 0)
        );
        return (
          <div key={r.key} className="flex items-center gap-2">
            <Badge variant="outline" className={r.className}>
              {r.label}
            </Badge>
            <span className="text-sm font-medium">{formatConfidence(topConfidence)}</span>
            {typeof r.analysis?.analysisTime === 'number' && (
              <span className="text-xs text-muted-foreground">
                {r.analysis.analysisTime.toFixed(1)}s
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
