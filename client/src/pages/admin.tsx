import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, UserCog, BarChart3, Shield } from 'lucide-react';
import { AdminStats } from '@/components/admin/AdminStats';
import { useAuth } from '@/hooks/useAuth';
import { AccessDenied } from '@/components/AccessDenied';

// Each tab is its own chunk — only the active tab's code is fetched.
const AdminCases = lazy(() => import('@/components/admin/AdminCases'));
const AdminUsers = lazy(() => import('@/components/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('@/components/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));

type AdminTab = 'cases' | 'users' | 'analytics' | 'settings';

function TabFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<AdminTab>('cases');

  const { data: stats = {}, isLoading: statsLoading } = useQuery<{
    totalCases?: number;
    pendingCases?: number;
    activeUsers?: number;
    totalUsers?: number;
    avgDiagnosisTime?: number;
  }>({
    queryKey: ['/api/admin/stats'],
    enabled: user?.role === 'admin',
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export/cases', {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to export cases');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting cases:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto space-y-6 p-4">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Admin panel is admin-only — dermatologists and users are blocked here.
  if (user?.role !== 'admin') {
    return <AccessDenied message="The admin panel is restricted to administrators." />;
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-admin-panel">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage all cases and view system statistics</p>
        </div>
        <Button onClick={handleExportCSV} data-testid="button-export-csv" className="sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <AdminStats stats={stats} isLoading={statsLoading} />

      {/* Tabbed Interface */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="cases" data-testid="tab-cases" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Case Management</span>
            <span className="sm:hidden">Cases</span>
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users" className="gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">User Management</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings" className="gap-2">
            <Shield className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Render only the active tab so its chunk loads on demand. */}
        <div className="mt-4">
          <Suspense fallback={<TabFallback />}>
            {tab === 'cases' && <AdminCases />}
            {tab === 'users' && <AdminUsers />}
            {tab === 'analytics' && <AdminAnalytics />}
            {tab === 'settings' && <AdminSettings />}
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
