import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

interface AiSelectionStats {
  gemini: number;
  openai: number;
  total: number;
  geminiPercentage: number;
  openaiPercentage: number;
}

function SelectionBar({
  label,
  badgeClass,
  barClass,
  count,
  percentage,
}: {
  label: string;
  badgeClass: string;
  barClass: string;
  count: number;
  percentage: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={badgeClass}>
          {label}
        </Badge>
        <span className="text-sm font-medium">
          {count} selections ({percentage}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ${barClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function AdminAnalytics() {
  const { data: stats, isLoading } = useQuery<AiSelectionStats>({
    queryKey: ['/api/admin/analytics/ai-selection'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/ai-selection', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch AI selection stats');
      return response.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-600" />
          AI Selection Statistics
        </CardTitle>
        <CardDescription>
          Track which AI provider users prefer when confirming diagnoses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            <SelectionBar
              label="Gemini 3"
              badgeClass="bg-purple-50 text-purple-700 border-purple-200"
              barClass="bg-gradient-to-r from-purple-500 to-purple-600"
              count={stats?.gemini || 0}
              percentage={stats?.geminiPercentage || 0}
            />
            <SelectionBar
              label="GPT-5.5"
              badgeClass="bg-green-50 text-green-700 border-green-200"
              barClass="bg-gradient-to-r from-green-500 to-green-600"
              count={stats?.openai || 0}
              percentage={stats?.openaiPercentage || 0}
            />
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total Confirmed Diagnoses</span>
                <span className="font-semibold text-foreground">{stats?.total || 0} cases</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminAnalytics;
