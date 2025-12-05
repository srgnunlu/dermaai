import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  Search,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  FileDown,
  UserCog,
  Shield,
  UserX,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Helper function to get merged diagnoses from finalDiagnoses or separate AI results
const getMergedDiagnoses = (caseItem: any) => {
  if (caseItem.finalDiagnoses && caseItem.finalDiagnoses.length > 0) {
    return caseItem.finalDiagnoses;
  }

  // If finalDiagnoses is null, merge separate AI results
  const allDiagnoses: any[] = [];

  if (caseItem.geminiAnalysis?.diagnoses && Array.isArray(caseItem.geminiAnalysis.diagnoses)) {
    allDiagnoses.push(...caseItem.geminiAnalysis.diagnoses);
  }

  if (caseItem.openaiAnalysis?.diagnoses && Array.isArray(caseItem.openaiAnalysis.diagnoses)) {
    allDiagnoses.push(...caseItem.openaiAnalysis.diagnoses);
  }

  if (allDiagnoses.length === 0) return [];

  // Sort by confidence and deduplicate
  allDiagnoses.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  const unique = allDiagnoses.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
};

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);
  const [isDeletingCase, setIsDeletingCase] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);
  const [casesPage, setCasesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const casesPerPage = 20;
  const usersPerPage = 20;
  const { toast } = useToast();

  // Handle individual case view
  const handleViewCase = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsViewModalOpen(true);
  };

  // Handle individual case export
  const handleExportCase = async (caseItem: any) => {
    if (!caseItem.id) return;

    setIsExporting(caseItem.id);
    try {
      const response = await fetch(`/api/cases/${caseItem.id}/report`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate case report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Case-Report-${caseItem.caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Case report downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting case:', error);
      toast({
        title: 'Error',
        description: 'Failed to export case report',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  // Fetch all cases for admin with pagination
  const {
    data: casesData,
    isLoading: casesLoading
  } = useQuery<{
    cases: any[];
    total: number;
    pages: number;
  }>({
    queryKey: ['/api/admin/cases/paginated', casesPage, casesPerPage],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/cases/paginated?page=${casesPage}&limit=${casesPerPage}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch cases');
      return response.json();
    },
  });

  const cases = casesData?.cases || [];
  const totalCases = casesData?.total || 0;
  const totalCasesPages = casesData?.pages || 1;

  // Fetch system statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery<{
    totalCases?: number;
    pendingCases?: number;
    activeUsers?: number;
    totalUsers?: number;
    avgDiagnosisTime?: number;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  // Fetch all users for admin with pagination
  const {
    data: usersData,
    isLoading: usersLoading
  } = useQuery<{
    users: any[];
    total: number;
    pages: number;
  }>({
    queryKey: ['/api/admin/users/paginated', usersPage, usersPerPage],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/users/paginated?page=${usersPage}&limit=${usersPerPage}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;
  const totalUsersPages = usersData?.pages || 1;

  // System settings
  const { data: systemSettings, refetch: refetchSystemSettings } = useQuery<{
    enableGemini?: boolean;
    enableOpenAI?: boolean;
    openaiModel?: string;
    openaiAllowFallback?: boolean;
  }>({
    queryKey: ['/api/admin/system-settings'],
  });

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      refetchSystemSettings();
      toast({ title: 'Settings updated' });
    },
    onError: (e: any) => {
      toast({
        title: 'Failed to update settings',
        description: e?.message,
        variant: 'destructive',
      });
    },
  });

  // Delete case mutation
  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      return apiRequest('DELETE', `/api/admin/cases/${caseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Case deleted successfully',
        description: 'The case has been permanently deleted.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting case:', error);
      toast({
        title: 'Failed to delete case',
        description: error?.message || 'An error occurred while deleting the case.',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'User deleted successfully',
        description: 'The user and all their data have been permanently deleted.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast({
        title: 'Failed to delete user',
        description: error?.message || 'An error occurred while deleting the user.',
        variant: 'destructive',
      });
    },
  });

  // Handle case deletion
  const handleDeleteCase = async (caseId: string) => {
    deleteCaseMutation.mutate(caseId);
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  // Handle user role changes
  const handlePromoteUser = async (userId: string, userEmail: string) => {
    setIsChangingRole(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to promote user');
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });

      toast({
        title: 'Success',
        description: `${userEmail} has been promoted to admin`,
      });
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to promote user',
        variant: 'destructive',
      });
    } finally {
      setIsChangingRole(null);
    }
  };

  const handleDemoteUser = async (userId: string, userEmail: string) => {
    setIsChangingRole(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/demote`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to demote user');
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });

      toast({
        title: 'Success',
        description: `${userEmail} has been demoted to user`,
      });
    } catch (error) {
      console.error('Error demoting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to demote user',
        variant: 'destructive',
      });
    } finally {
      setIsChangingRole(null);
    }
  };

  // Filter cases based on search and filters
  const filteredCases = cases?.filter((caseItem: any) => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      caseItem.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientId?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all' && caseItem.createdAt) {
      const caseDate = new Date(caseItem.createdAt);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          matchesDate = caseDate.toDateString() === now.toDateString();
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = caseDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = caseDate >= monthAgo;
          break;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter users based on search and role filters
  const filteredUsers = users?.filter((user: any) => {
    // Search filter
    const matchesSearch =
      userSearchTerm === '' ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
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

  // Export cases as CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/admin/export/cases', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export cases');
      }

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

  const getStatusBadge = (status: string) => {
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

  const getUrgencyBadge = (diagnoses: any[]) => {
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

  const getAIAnalysisInfo = (caseItem: any) => {
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
              Gemini
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
              ChatGPT
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-admin-panel">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage all cases and view system statistics</p>
        </div>
        <Button onClick={handleExportCSV} data-testid="button-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Main Content - Tabbed Interface */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cases" data-testid="tab-cases">
            <FileText className="w-4 h-4 mr-2" />
            Case Management
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <UserCog className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Shield className="w-4 h-4 mr-2" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-6">
          {/* Case Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by Case ID, Email, or Patient ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-cases"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-date-filter">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cases Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Cases</CardTitle>
              <CardDescription>{filteredCases?.length || 0} cases found</CardDescription>
            </CardHeader>
            <CardContent>
              {casesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>AI Analysis</TableHead>
                      <TableHead>Top Diagnosis</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCases && filteredCases.length > 0 ? (
                      filteredCases.map((caseItem: any) => {
                        const mergedDiagnoses = getMergedDiagnoses(caseItem);
                        const topDiagnosis = mergedDiagnoses.length > 0 ? mergedDiagnoses[0] : null;
                        return (
                          <TableRow key={caseItem.id} data-testid={`row-case-${caseItem.id}`}>
                            <TableCell className="font-medium">{caseItem.caseId}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{caseItem.user?.email || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{caseItem.patientId || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                            <TableCell>
                              {caseItem.createdAt
                                ? format(new Date(caseItem.createdAt), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{getAIAnalysisInfo(caseItem)}</TableCell>
                            <TableCell>{topDiagnosis?.name || 'N/A'}</TableCell>
                            <TableCell>
                              {topDiagnosis ? (
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'w-full bg-gray-200 rounded-full h-2',
                                      'relative overflow-hidden'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'h-full transition-all',
                                        topDiagnosis.confidence >= 70
                                          ? 'bg-green-500'
                                          : topDiagnosis.confidence >= 40
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                      )}
                                      style={{ width: `${topDiagnosis.confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {topDiagnosis.confidence}%
                                  </span>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                            <TableCell>{getUrgencyBadge(mergedDiagnoses)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewCase(caseItem)}
                                  data-testid={`button-view-case-${caseItem.id}`}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExportCase(caseItem)}
                                  disabled={isExporting === caseItem.id}
                                  data-testid={`button-export-case-${caseItem.id}`}
                                >
                                  <FileDown className="w-4 h-4 mr-1" />
                                  {isExporting === caseItem.id ? 'Exporting...' : 'Export'}
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleteCaseMutation.isPending}
                                      data-testid={`button-delete-case-${caseItem.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Case</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete case {caseItem.caseId}? This
                                        action cannot be undone and will permanently remove all case
                                        data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCase(caseItem.id)}
                                        data-testid={`confirm-delete-case-${caseItem.id}`}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete Case
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No cases found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Pagination Controls */}
              {!casesLoading && filteredCases.length > 0 && totalCasesPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((casesPage - 1) * casesPerPage) + 1} to{' '}
                    {Math.min(casesPage * casesPerPage, totalCases)} of {totalCases} cases
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            if (casesPage > 1) {
                              setCasesPage(casesPage - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={casesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalCasesPages) }, (_, i) => {
                        let pageNum;
                        if (totalCasesPages <= 5) {
                          pageNum = i + 1;
                        } else if (casesPage <= 3) {
                          pageNum = i + 1;
                        } else if (casesPage >= totalCasesPages - 2) {
                          pageNum = totalCasesPages - 4 + i;
                        } else {
                          pageNum = casesPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => {
                                setCasesPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              isActive={casesPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalCasesPages > 5 && casesPage < totalCasesPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            if (casesPage < totalCasesPages) {
                              setCasesPage(casesPage + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={
                            casesPage === totalCasesPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by Email, First Name, or Last Name..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>{filteredUsers?.length || 0} users found</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user: any) => {
                        const fullName =
                          [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
                        return (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{fullName}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>
                              {user.createdAt
                                ? format(new Date(user.createdAt), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {user.role !== 'admin' ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isChangingRole === user.id}
                                        data-testid={`button-promote-user-${user.id}`}
                                      >
                                        <Shield className="w-4 h-4 mr-1" />
                                        Promote
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Promote User to Admin</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to promote {user.email} to admin?
                                          This will give them full administrative privileges.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handlePromoteUser(user.id, user.email)}
                                          data-testid={`confirm-promote-${user.id}`}
                                        >
                                          Promote to Admin
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isChangingRole === user.id}
                                        data-testid={`button-demote-user-${user.id}`}
                                      >
                                        <UserX className="w-4 h-4 mr-1" />
                                        Demote
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Demote Admin to User</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to demote {user.email} from admin?
                                          This will remove their administrative privileges.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDemoteUser(user.id, user.email)}
                                          data-testid={`confirm-demote-${user.id}`}
                                        >
                                          Demote to User
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deleteUserMutation.isPending}
                                      data-testid={`button-delete-user-${user.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.email}? This action
                                        cannot be undone and will permanently remove the user and
                                        all their data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id)}
                                        data-testid={`confirm-delete-user-${user.id}`}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete User
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No users found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
              {!usersLoading && filteredUsers.length > 0 && totalUsersPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((usersPage - 1) * usersPerPage) + 1} to{' '}
                    {Math.min(usersPage * usersPerPage, totalUsers)} of {totalUsers} users
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => {
                            if (usersPage > 1) {
                              setUsersPage(usersPage - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={usersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalUsersPages) }, (_, i) => {
                        let pageNum;
                        if (totalUsersPages <= 5) {
                          pageNum = i + 1;
                        } else if (usersPage <= 3) {
                          pageNum = i + 1;
                        } else if (usersPage >= totalUsersPages - 2) {
                          pageNum = totalUsersPages - 4 + i;
                        } else {
                          pageNum = usersPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => {
                                setUsersPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              isActive={usersPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {totalUsersPages > 5 && usersPage < totalUsersPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => {
                            if (usersPage < totalUsersPages) {
                              setUsersPage(usersPage + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={
                            usersPage === totalUsersPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Controls</CardTitle>
              <CardDescription>Configure which models run for all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Gemini</div>
                  <div className="text-sm text-muted-foreground">Run Google Gemini analysis</div>
                </div>
                <Switch
                  checked={!!systemSettings?.enableGemini}
                  onCheckedChange={(v) => updateSystemSettingsMutation.mutate({ enableGemini: v })}
                  data-testid="switch-enable-gemini"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable OpenAI</div>
                  <div className="text-sm text-muted-foreground">Run OpenAI analysis</div>
                </div>
                <Switch
                  checked={!!systemSettings?.enableOpenAI}
                  onCheckedChange={(v) => updateSystemSettingsMutation.mutate({ enableOpenAI: v })}
                  data-testid="switch-enable-openai"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">OpenAI Model</div>
                  <div className="text-sm text-muted-foreground">
                    Choose which OpenAI model to use
                  </div>
                </div>
                <Select
                  value={systemSettings?.openaiModel || 'gpt-5.1'}
                  onValueChange={(v) => updateSystemSettingsMutation.mutate({ openaiModel: v })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5.1">gpt-5.1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow OpenAI Fallback</div>
                  <div className="text-sm text-muted-foreground">
                    If selected model fails, try gpt-4o-mini automatically
                  </div>
                </div>
                <Switch
                  checked={systemSettings?.openaiAllowFallback !== false}
                  onCheckedChange={(v) =>
                    updateSystemSettingsMutation.mutate({ openaiAllowFallback: v })
                  }
                  data-testid="switch-openai-fallback"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
            <DialogDescription>Comprehensive view of case {selectedCase?.caseId}</DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6" data-testid="case-details-content">
              {/* Case Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Case Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Case ID:</span> {selectedCase.caseId}
                    </p>
                    <p>
                      <span className="font-medium">User:</span>{' '}
                      {selectedCase.user?.email || 'Unknown'}
                    </p>
                    <p>
                      <span className="font-medium">Patient ID:</span>{' '}
                      {selectedCase.patientId || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      {getStatusBadge(selectedCase.status)}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {selectedCase.createdAt
                        ? format(new Date(selectedCase.createdAt), 'PPpp')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Clinical Information</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Lesion Location:</span>{' '}
                      {selectedCase.lesionLocation || 'Not specified'}
                    </p>
                    <p>
                      <span className="font-medium">Symptoms:</span>{' '}
                      {selectedCase.symptoms || 'None reported'}
                    </p>
                    {selectedCase.medicalHistory && selectedCase.medicalHistory.length > 0 && (
                      <p>
                        <span className="font-medium">Medical History:</span>{' '}
                        {selectedCase.medicalHistory.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dermatologist Diagnosis */}
              {selectedCase.dermatologistDiagnosis && (
                <div>
                  <h3 className="font-semibold mb-2 text-green-700">Dermatologist Diagnosis</h3>
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Diagnosis:</span>{' '}
                        {selectedCase.dermatologistDiagnosis}
                      </p>
                      {selectedCase.dermatologistNotes && (
                        <p>
                          <span className="font-medium">Clinical Notes:</span>{' '}
                          {selectedCase.dermatologistNotes}
                        </p>
                      )}
                      {selectedCase.dermatologistDiagnosedAt && (
                        <p className="text-xs text-muted-foreground">
                          Diagnosed on:{' '}
                          {format(new Date(selectedCase.dermatologistDiagnosedAt), 'PPpp')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Case Images */}
              {(selectedCase.imageUrls?.length ?? 0) > 0 || selectedCase.imageUrl ? (
                <div>
                  <h3 className="font-semibold mb-2">
                    Case Image{((selectedCase.imageUrls?.length ?? 0) > 1 ? 's' : '')}
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div
                      className={`grid gap-4 ${(selectedCase.imageUrls?.length ?? 1) === 1
                        ? 'grid-cols-1'
                        : (selectedCase.imageUrls?.length ?? 1) === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-3'
                        }`}
                    >
                      {(selectedCase.imageUrls && selectedCase.imageUrls.length > 0
                        ? selectedCase.imageUrls
                        : [selectedCase.imageUrl]
                      ).map((imageUrl: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={
                              imageUrl.startsWith('https://storage.googleapis.com')
                                ? `/objects/${imageUrl.split('/.private/')[1]}`
                                : imageUrl
                            }
                            alt={`Case image ${index + 1}`}
                            className="w-full h-48 object-contain rounded border border-gray-200"
                            data-testid={`case-image-${index}`}
                            onError={(e) => {
                              console.error('Failed to load image:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {(selectedCase.imageUrls?.length ?? 1) > 1 && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                              Image {index + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* AI Diagnosis Results */}
              {getMergedDiagnoses(selectedCase).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-4">AI Diagnosis Results</h3>

                  {/* Gemini Results */}
                  {selectedCase?.geminiAnalysis?.diagnoses && selectedCase.geminiAnalysis.diagnoses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-300">
                        <div className="w-4 h-4 rounded bg-purple-600"></div>
                        <h4 className="text-base font-bold text-purple-900">Gemini 2.5 Flash Analysis</h4>
                      </div>
                      <div className="space-y-3">
                        {selectedCase.geminiAnalysis.diagnoses.slice(0, 5).map((diagnosis: any, index: number) => (
                          <div
                            key={index}
                            className="border-l-4 border-purple-600 bg-white p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <h5 className="font-bold text-gray-900 text-sm">{diagnosis.name}</h5>
                                </div>
                              </div>
                              <div className="ml-2 text-right">
                                <div className="inline-block px-2 py-1 rounded bg-purple-100 text-purple-900 font-semibold text-xs">
                                  {diagnosis.confidence}%
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-3">{diagnosis.description}</p>

                            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                              <div className="mb-2">
                                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                                  Key Features:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      className="bg-purple-100 text-purple-900 border-purple-300 text-xs"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                              <div>
                                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                                  Recommendations:
                                </span>
                                <ul className="list-disc list-inside text-xs text-gray-700 mt-2 space-y-1">
                                  {diagnosis.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OpenAI Results */}
                  {selectedCase?.openaiAnalysis?.diagnoses && selectedCase.openaiAnalysis.diagnoses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-green-300">
                        <div className="w-4 h-4 rounded bg-green-600"></div>
                        <h4 className="text-base font-bold text-green-900">GPT-5 Mini Analysis</h4>
                      </div>
                      <div className="space-y-3">
                        {selectedCase.openaiAnalysis.diagnoses.slice(0, 5).map((diagnosis: any, index: number) => (
                          <div
                            key={index}
                            className="border-l-4 border-green-600 bg-white p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <h5 className="font-bold text-gray-900 text-sm">{diagnosis.name}</h5>
                                </div>
                              </div>
                              <div className="ml-2 text-right">
                                <div className="inline-block px-2 py-1 rounded bg-green-100 text-green-900 font-semibold text-xs">
                                  {diagnosis.confidence}%
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-700 mb-3">{diagnosis.description}</p>

                            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                              <div className="mb-2">
                                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                                  Key Features:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      className="bg-green-100 text-green-900 border-green-300 text-xs"
                                    >
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                              <div>
                                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                                  Recommendations:
                                </span>
                                <ul className="list-disc list-inside text-xs text-gray-700 mt-2 space-y-1">
                                  {diagnosis.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
