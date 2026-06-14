import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Search, Users, Eye, FileDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest, getCsrfHeaders } from '@/lib/queryClient';
import { EmptyState } from '@/components/EmptyState';
import {
  getMergedDiagnoses,
  getStatusBadge,
  getUrgencyBadge,
  getAIAnalysisInfo,
} from './adminUtils';
import { AdminPagination } from './AdminPagination';
import { CaseDetailModal } from './CaseDetailModal';

const PER_PAGE = 20;

function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full overflow-hidden rounded-full bg-gray-200 h-2">
        <div
          className={cn(
            'h-full transition-all',
            confidence >= 70 ? 'bg-green-500' : confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="text-sm font-medium">{confidence}%</span>
    </div>
  );
}

export function AdminCases() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const { data: casesData, isLoading } = useQuery<{ cases: any[]; total: number; pages: number }>({
    queryKey: ['/api/admin/cases/paginated', page, PER_PAGE],
    queryFn: async () => {
      const response = await fetch(`/api/admin/cases/paginated?page=${page}&limit=${PER_PAGE}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cases');
      return response.json();
    },
  });

  const cases = casesData?.cases || [];
  const total = casesData?.total || 0;
  const totalPages = casesData?.pages || 1;

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => apiRequest('DELETE', `/api/admin/cases/${caseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Case deleted successfully',
        description: 'The case has been permanently deleted.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete case',
        description: error?.message || 'An error occurred while deleting the case.',
        variant: 'destructive',
      });
    },
  });

  const handleViewCase = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsViewModalOpen(true);
  };

  const handleExportCase = async (caseItem: any) => {
    if (!caseItem.id) return;
    setIsExporting(caseItem.id);
    try {
      const response = await fetch(`/api/cases/${caseItem.id}/report`, {
        method: 'POST',
        headers: await getCsrfHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate case report');
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
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export case report',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const filteredCases = cases.filter((caseItem: any) => {
    const matchesSearch =
      searchTerm === '' ||
      caseItem.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;

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

  const DeleteCaseButton = ({ caseItem, full }: { caseItem: any; full?: boolean }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleteCaseMutation.isPending}
          className={full ? 'flex-1' : undefined}
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
            Are you sure you want to delete case {caseItem.caseId}? This action cannot be undone and
            will permanently remove all case data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteCaseMutation.mutate(caseItem.id)}
            data-testid={`confirm-delete-case-${caseItem.id}`}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Case
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-date-filter">
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

      {/* Cases */}
      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>{filteredCases.length} cases found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <EmptyState icon={Search} title="No cases found" description="Try adjusting your search or filters." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
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
                    {filteredCases.map((caseItem: any) => {
                      const merged = getMergedDiagnoses(caseItem);
                      const top = merged.length > 0 ? merged[0] : null;
                      return (
                        <TableRow key={caseItem.id} data-testid={`row-case-${caseItem.id}`}>
                          <TableCell className="font-medium">{caseItem.caseId}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
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
                          <TableCell>{top?.name || 'N/A'}</TableCell>
                          <TableCell>{top ? <ConfidenceBar confidence={top.confidence} /> : 'N/A'}</TableCell>
                          <TableCell>{getUrgencyBadge(merged)}</TableCell>
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
                              <DeleteCaseButton caseItem={caseItem} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredCases.map((caseItem: any) => {
                  const merged = getMergedDiagnoses(caseItem);
                  const top = merged.length > 0 ? merged[0] : null;
                  return (
                    <div
                      key={caseItem.id}
                      className="rounded-xl border border-border p-4"
                      data-testid={`card-case-${caseItem.id}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-medium">{caseItem.caseId}</span>
                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(merged)}
                          {getStatusBadge(caseItem.status)}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {caseItem.user?.email || 'Unknown'}
                        </p>
                        <p className="text-muted-foreground">
                          Patient: {caseItem.patientId || 'N/A'} ·{' '}
                          {caseItem.createdAt
                            ? format(new Date(caseItem.createdAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="my-3">{getAIAnalysisInfo(caseItem)}</div>
                      {top && (
                        <div className="mb-3">
                          <p className="mb-1 text-sm font-medium">{top.name}</p>
                          <ConfidenceBar confidence={top.confidence} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewCase(caseItem)}
                          data-testid={`button-view-case-mobile-${caseItem.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleExportCase(caseItem)}
                          disabled={isExporting === caseItem.id}
                        >
                          <FileDown className="w-4 h-4 mr-1" />
                          {isExporting === caseItem.id ? '...' : 'Export'}
                        </Button>
                        <DeleteCaseButton caseItem={caseItem} full />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && filteredCases.length > 0 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={PER_PAGE}
              label="cases"
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <CaseDetailModal
        caseItem={selectedCase}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
      />
    </div>
  );
}

export default AdminCases;
