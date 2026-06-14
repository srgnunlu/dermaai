import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Stethoscope,
  Save,
  CheckCircle2,
  ImageIcon,
  SkipForward,
  Clock,
  Loader2,
  EyeOff,
  Search,
} from 'lucide-react';
import type { Case, DermatologistReview } from '@shared/schema';
import type { ReviewStatus } from '@shared/dermatology-diagnoses';
import SiteFooter from '@/components/SiteFooter';
import DiagnosisCombobox from '@/components/DiagnosisCombobox';
import { apiRequest } from '@/lib/queryClient';

type ReviewCase = Case & { myReview: DermatologistReview | null };

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Very Uncertain',
  2: 'Uncertain',
  3: 'Moderate',
  4: 'Confident',
  5: 'Very Confident',
};

const STATUS_META: Record<ReviewStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-slate-200 text-slate-700 hover:bg-slate-200' },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  skipped: { label: 'Skipped', className: 'bg-slate-100 text-slate-500 hover:bg-slate-100' },
};

function statusOf(c: ReviewCase): ReviewStatus {
  return (c.myReview?.status as ReviewStatus) || 'pending';
}

export default function DermatologistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [diagnosisName, setDiagnosisName] = useState<string | null>(null);
  const [icd10, setIcd10] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all');

  const { data: cases, isLoading } = useQuery<ReviewCase[]>({
    queryKey: ['/api/dermatologist/review-cases'],
  });

  const selectedCase = useMemo(
    () => cases?.find((c) => c.id === selectedCaseId) ?? null,
    [cases, selectedCaseId]
  );

  // Load the reviewer's existing review into the form when a case is selected.
  useEffect(() => {
    if (!selectedCase) return;
    const r = selectedCase.myReview;
    setDiagnosisName(r?.structuredDiagnosis ?? null);
    setIcd10(r?.icd10Code ?? null);
    setFreeText(r?.freeTextDiagnosis ?? '');
    setConfidence(r?.confidenceScore ?? 3);
    setNotes(r?.notes ?? '');
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitMutation = useMutation({
    mutationFn: async (status: ReviewStatus) => {
      const res = await apiRequest('POST', '/api/dermatologist/reviews', {
        caseId: selectedCase!.id,
        studyId: selectedCase!.studyId ?? null,
        structuredDiagnosis: diagnosisName,
        icd10Code: icd10,
        freeTextDiagnosis: freeText.trim() || null,
        confidenceScore: confidence,
        notes: notes.trim() || null,
        status,
      });
      return res.json();
    },
    onSuccess: (_data, status) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dermatologist/review-cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/research/pool-status'] });
      toast({
        title: status === 'completed' ? 'Review Completed' : status === 'skipped' ? 'Case Skipped' : 'Progress Saved',
        description:
          status === 'completed'
            ? 'Your structured review has been recorded.'
            : 'Your changes were saved.',
      });
      if (status === 'completed' || status === 'skipped') {
        setSelectedCaseId(null);
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not save the review. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleComplete = () => {
    if (!diagnosisName && !freeText.trim()) {
      toast({
        title: 'Diagnosis Required',
        description: 'Select a structured diagnosis (or enter free text) before completing.',
        variant: 'destructive',
      });
      return;
    }
    submitMutation.mutate('completed');
  };

  const getImageUrls = (caseItem: Case): string[] => {
    const urls = caseItem.imageUrls;
    if (Array.isArray(urls) && urls.length > 0) return urls;
    return caseItem.imageUrl ? [caseItem.imageUrl] : [];
  };

  const filtered = cases?.filter((c) => filter === 'all' || statusOf(c) === filter) ?? [];

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: cases?.length ?? 0, pending: 0, in_progress: 0, completed: 0, skipped: 0 };
    cases?.forEach((c) => {
      acc[statusOf(c)] = (acc[statusOf(c)] ?? 0) + 1;
    });
    return acc;
  }, [cases]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="feature-icon h-11 w-11 rounded-xl flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Dermatologist Review Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Blind, structured review — your independent diagnosis for research comparison
              </p>
            </div>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'in_progress', 'completed', 'skipped'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
              data-testid={`filter-${key}`}
            >
              {key === 'all' ? 'All' : STATUS_META[key].label} ({counts[key] ?? 0})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading cases...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cases List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="space-y-3 lg:max-h-[78vh] overflow-y-auto pr-1">
                {filtered.map((caseItem) => {
                  const st = statusOf(caseItem);
                  return (
                    <Card
                      key={caseItem.id}
                      className={`premium-card cursor-pointer ${
                        selectedCaseId === caseItem.id ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                      onClick={() => setSelectedCaseId(caseItem.id)}
                      data-testid={`case-card-${caseItem.caseId}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{caseItem.caseId}</p>
                            <p className="text-xs text-muted-foreground">
                              {caseItem.createdAt
                                ? new Date(caseItem.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                          <Badge className={STATUS_META[st].className}>{STATUS_META[st].label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          <span className="font-medium text-foreground">Location:</span>{' '}
                          {caseItem.lesionLocation || 'Not specified'}
                        </p>
                        {caseItem.myReview?.structuredDiagnosis && (
                          <p className="text-xs mt-1 text-emerald-700 line-clamp-1">
                            {caseItem.myReview.structuredDiagnosis}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {filtered.length === 0 && (
                  <Card className="glass-card">
                    <CardContent className="p-8 text-center text-muted-foreground text-sm">
                      No cases in this view.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Detail + review form */}
            <div className="lg:col-span-3">
              {selectedCase ? (
                <Card className="glass-card-light lg:sticky lg:top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                      <span className="text-lg">Case {selectedCase.caseId}</span>
                      <Badge className={STATUS_META[statusOf(selectedCase)].className}>
                        {STATUS_META[statusOf(selectedCase)].label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Blind review notice */}
                    <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs text-primary">
                      <EyeOff className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        AI results are hidden until you complete your independent review — this
                        protects the blind-comparison design of the study.
                      </span>
                    </div>

                    {/* Patient Information */}
                    <div>
                      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                        Clinical Information
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <p><span className="text-muted-foreground">Location:</span> {selectedCase.lesionLocation || '—'}</p>
                        <p><span className="text-muted-foreground">Duration:</span> {selectedCase.symptomDuration || '—'}</p>
                        <p className="col-span-2">
                          <span className="text-muted-foreground">Symptoms:</span>{' '}
                          {Array.isArray(selectedCase.symptoms) && selectedCase.symptoms.length
                            ? selectedCase.symptoms.join(', ')
                            : '—'}
                        </p>
                        {selectedCase.additionalSymptoms && (
                          <p className="col-span-2">
                            <span className="text-muted-foreground">Additional:</span>{' '}
                            {selectedCase.additionalSymptoms}
                          </p>
                        )}
                        {Array.isArray(selectedCase.medicalHistory) &&
                          selectedCase.medicalHistory.length > 0 && (
                            <p className="col-span-2">
                              <span className="text-muted-foreground">History:</span>{' '}
                              {selectedCase.medicalHistory.join(', ')}
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <h3 className="font-semibold mb-2 text-sm flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                        <ImageIcon className="h-4 w-4" /> Lesion Images
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {getImageUrls(selectedCase).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="border rounded-lg overflow-hidden block aspect-square"
                          >
                            <img
                              src={url}
                              alt={`Lesion ${i + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </a>
                        ))}
                        {getImageUrls(selectedCase).length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-full">No images.</p>
                        )}
                      </div>
                    </div>

                    {/* Structured review form */}
                    <div className="border-t pt-5 space-y-5">
                      <div>
                        <Label className="mb-1.5 block">Structured Diagnosis (ICD-10) *</Label>
                        <DiagnosisCombobox
                          value={diagnosisName}
                          icd10={icd10}
                          onSelect={(d) => {
                            setDiagnosisName(d?.name ?? null);
                            setIcd10(d?.code ?? null);
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="freeText" className="mb-1.5 block text-sm">
                          Free-text Diagnosis (optional, if not in list)
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="freeText"
                            value={freeText}
                            onChange={(e) => setFreeText(e.target.value)}
                            placeholder="e.g. atypical presentation..."
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {/* Confidence slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Confidence</Label>
                          <span className="text-sm font-semibold text-primary">
                            {confidence} — {CONFIDENCE_LABELS[confidence]}
                          </span>
                        </div>
                        <Slider
                          value={[confidence]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(v) => setConfidence(v[0])}
                          data-testid="confidence-slider"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="mb-1.5 block">Clinical Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          placeholder="Observations, differential considerations..."
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleComplete}
                          disabled={submitMutation.isPending}
                          className="flex-1 min-w-[140px]"
                          data-testid="complete-review"
                        >
                          {submitMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Complete Review
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => submitMutation.mutate('in_progress')}
                          disabled={submitMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => submitMutation.mutate('skipped')}
                          disabled={submitMutation.isPending}
                          className="text-muted-foreground"
                        >
                          <SkipForward className="h-4 w-4 mr-2" /> Skip
                        </Button>
                      </div>

                      {selectedCase.myReview?.completedAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Last completed{' '}
                          {new Date(selectedCase.myReview.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-12 text-center">
                    <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground">
                      Select a case to begin your structured review
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
