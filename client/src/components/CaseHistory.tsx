import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { History, Eye, FileText, Download, Search, ImageIcon, ChevronRight, Plus } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';
import type { Case } from '@shared/schema';
import { getCsrfHeaders } from '@/lib/queryClient';

interface CaseHistoryProps {
  /** Teaser mode: show only the first `limit` cases with a "View all" link, no filters. */
  compact?: boolean;
  limit?: number;
}

type Diagnosis = { name: string; confidence: number; description?: string; keyFeatures?: string[] };

// Merge + dedupe diagnoses from either finalDiagnoses or separate AI results.
const mergeDiagnoses = (caseRecord: Case): Diagnosis[] => {
  if (caseRecord.finalDiagnoses && caseRecord.finalDiagnoses.length > 0) {
    return caseRecord.finalDiagnoses;
  }
  const all: Diagnosis[] = [];
  if (Array.isArray(caseRecord.geminiAnalysis?.diagnoses)) {
    all.push(...caseRecord.geminiAnalysis.diagnoses);
  }
  if (Array.isArray(caseRecord.openaiAnalysis?.diagnoses)) {
    all.push(...caseRecord.openaiAnalysis.diagnoses);
  }
  if (all.length === 0) return [];
  all.sort((a, b) => b.confidence - a.confidence);
  const seen = new Set<string>();
  return all.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getTopDiagnosis = (caseRecord: Case): Diagnosis | undefined => mergeDiagnoses(caseRecord)[0];

const PAGE_SIZE = 6;

export function CaseHistory({ compact = false, limit = 6 }: CaseHistoryProps) {
  const { data: cases = [], isLoading } = useQuery<Case[]>({ queryKey: ['/api/cases'] });
  const { toast } = useToast();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'favorites'>('all');
  const [page, setPage] = useState(1);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getConfidenceTone = (confidence: number) => {
    if (confidence >= 80) return 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400';
    if (confidence >= 60) return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    return 'border-orange-400/30 bg-orange-400/10 text-orange-700 dark:text-orange-400';
  };

  // Apply search + filter (full mode only).
  const filteredCases = useMemo(() => {
    let result = cases;
    if (!compact) {
      const q = search.trim().toLowerCase();
      if (q) {
        result = result.filter((c) => {
          const top = getTopDiagnosis(c);
          return (
            c.caseId?.toLowerCase().includes(q) ||
            (c.patientId ?? '').toLowerCase().includes(q) ||
            (top?.name ?? '').toLowerCase().includes(q)
          );
        });
      }
      if (filter === 'high') {
        result = result.filter((c) => (getTopDiagnosis(c)?.confidence ?? 0) >= 80);
      } else if (filter === 'favorites') {
        result = result.filter((c) => !!c.isFavorite);
      }
    }
    return result;
  }, [cases, search, filter, compact]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleCases = compact
    ? filteredCases.slice(0, limit)
    : filteredCases.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleGenerateReport = async (caseRecord: Case) => {
    setReportingId(caseRecord.id);
    try {
      const response = await fetch(`/api/cases/${caseRecord.id}/report`, {
        method: 'POST',
        headers: await getCsrfHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Case-Report-${caseRecord.caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Report Generated',
        description: `Medical report for case ${caseRecord.caseId} has been downloaded.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReportingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 rounded-xl border border-border p-4">
                <div className="h-32 rounded-lg bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center text-lg font-semibold text-foreground">
            <History className="mr-2 text-primary" size={20} />
            {compact ? 'Recent Cases' : 'Case History'}
          </h3>

          {!compact && cases.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search cases..."
                  className="w-full pl-9 sm:w-56"
                  data-testid="input-search-cases"
                />
              </div>
              <Select
                value={filter}
                onValueChange={(v) => {
                  setFilter(v as typeof filter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44" data-testid="select-case-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cases</SelectItem>
                  <SelectItem value="high">High confidence (≥80%)</SelectItem>
                  <SelectItem value="favorites">Saved / favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {visibleCases.length === 0 ? (
            cases.length === 0 ? (
              <EmptyState
                icon={History}
                title="No cases yet"
                description="Once you analyze a skin image, your cases will appear here for review and reporting."
                action={{ label: 'Start a diagnosis', href: '/diagnosis', icon: Plus }}
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No matching cases"
                description="No cases match your current search or filter. Try a different term or clear the filter."
              />
            )
          ) : (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="cases-grid"
            >
              {visibleCases.map((caseRecord) => {
                const top = getTopDiagnosis(caseRecord);
                const thumb = caseRecord.imageUrls?.[0] || caseRecord.imageUrl || null;
                return (
                  <div
                    key={caseRecord.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                    data-testid={`card-case-${caseRecord.caseId}`}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-36 w-full overflow-hidden bg-muted">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`Case ${caseRecord.caseId}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {top && (
                        <Badge
                          className={`absolute right-2 top-2 border ${getConfidenceTone(top.confidence)}`}
                          variant="outline"
                          data-testid={`text-confidence-${caseRecord.caseId}`}
                        >
                          {top.confidence}%
                        </Badge>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-mono text-xs text-muted-foreground">
                          {caseRecord.caseId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(caseRecord.createdAt)}
                        </span>
                      </div>
                      <p
                        className="mb-3 line-clamp-2 font-semibold text-foreground"
                        data-testid={`text-top-diagnosis-${caseRecord.caseId}`}
                      >
                        {top?.name || 'No findings'}
                      </p>

                      <div className="mt-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => setSelectedCase(caseRecord)}
                          data-testid={`button-view-${caseRecord.caseId}`}
                        >
                          <Eye size={14} />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1 text-primary"
                          onClick={() => handleGenerateReport(caseRecord)}
                          disabled={reportingId === caseRecord.id}
                          data-testid={`button-report-${caseRecord.caseId}`}
                        >
                          {reportingId === caseRecord.id ? (
                            <Download size={14} className="animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                          Report
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination (full mode) */}
          {!compact && totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={safePage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                      data-testid={`pagination-page-${i + 1}`}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {/* View all (compact mode) */}
          {compact && filteredCases.length > limit && (
            <div className="mt-6 text-center">
              <Link href="/case-history">
                <Button
                  variant="ghost"
                  className="gap-1 text-primary"
                  data-testid="button-view-all-cases"
                >
                  View all {filteredCases.length} cases
                  <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Detail Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details — {selectedCase?.caseId}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              {/* Images */}
              {(selectedCase.imageUrls?.length || selectedCase.imageUrl) && (
                <div className="flex flex-wrap gap-3">
                  {(selectedCase.imageUrls ?? [selectedCase.imageUrl!]).filter(Boolean).map((url, i) => (
                    <img
                      key={i}
                      src={url as string}
                      alt={`Case image ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-28 w-28 rounded-lg border border-border object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Case ID</h4>
                  <p className="font-mono">{selectedCase.caseId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Date</h4>
                  <p>{formatDate(selectedCase.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Patient ID</h4>
                  <p>{selectedCase.patientId || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Status</h4>
                  <Badge variant={selectedCase.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedCase.status}
                  </Badge>
                </div>
              </div>

              {mergeDiagnoses(selectedCase).length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">AI-Assisted Possible Findings</h4>
                  <div className="space-y-3">
                    {mergeDiagnoses(selectedCase).map((diagnosis, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h5 className="font-medium">{diagnosis.name}</h5>
                          <Badge variant={diagnosis.confidence >= 80 ? 'default' : 'secondary'}>
                            {diagnosis.confidence}%
                          </Badge>
                        </div>
                        {diagnosis.description && (
                          <p className="mb-2 text-sm text-muted-foreground">
                            {diagnosis.description}
                          </p>
                        )}
                        {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Key Features:</span>{' '}
                            {diagnosis.keyFeatures.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
