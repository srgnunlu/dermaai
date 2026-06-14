import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminStatsProps {
  stats: {
    totalCases?: number;
    pendingCases?: number;
    activeUsers?: number;
    totalUsers?: number;
    avgDiagnosisTime?: number;
  };
  isLoading: boolean;
}

export function AdminStats({ stats, isLoading }: AdminStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Cases</CardDescription>
          <CardTitle className="text-2xl" data-testid="stat-total-cases">
            {stats?.totalCases || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Pending Cases</CardDescription>
          <CardTitle className="text-2xl text-yellow-600" data-testid="stat-pending-cases">
            {stats?.pendingCases || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Active Users</CardDescription>
          <CardTitle className="text-2xl" data-testid="stat-active-users">
            {stats?.activeUsers || 0} / {stats?.totalUsers || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Avg. Diagnosis Time</CardDescription>
          <CardTitle className="text-2xl" data-testid="stat-avg-diagnosis-time">
            {stats?.avgDiagnosisTime || 0} min
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default AdminStats;
