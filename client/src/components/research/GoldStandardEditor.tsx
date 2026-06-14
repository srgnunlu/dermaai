import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { Case } from '@shared/schema';
import { GOLD_STANDARD_SOURCES } from '@shared/dermatology-diagnoses';
import DiagnosisCombobox from '@/components/DiagnosisCombobox';
import { apiRequest } from '@/lib/queryClient';

type AdminCase = Case & { user?: { email?: string | null } };

// Lets the researcher record the ground-truth (gold standard) diagnosis per case.
export default function GoldStandardEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [icd10, setIcd10] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const { data: cases, isLoading } = useQuery<AdminCase[]>({ queryKey: ['/api/admin/cases'] });

  const selectCase = (c: AdminCase) => {
    setSelectedId(c.id);
    setDiagnosis(c.goldStandardDiagnosis ?? null);
    setIcd10(c.goldStandardIcd10 ?? null);
    setSource(c.goldStandardSource ?? '');
    setDate(c.goldStandardDate ? new Date(c.goldStandardDate).toISOString().slice(0, 10) : '');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/cases/${selectedId}/gold-standard`, {
        goldStandardDiagnosis: diagnosis,
        goldStandardIcd10: icd10,
        goldStandardSource: source || null,
        goldStandardDate: date ? new Date(date).toISOString() : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/research/analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/research/pool-status'] });
      toast({ title: 'Gold standard saved', variant: 'success' });
    },
    onError: () => toast({ title: 'Error', description: 'Could not save gold standard.', variant: 'destructive' }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (cases ?? []).filter(
      (c) =>
        !q ||
        c.caseId?.toLowerCase().includes(q) ||
        c.lesionLocation?.toLowerCase().includes(q) ||
        c.goldStandardDiagnosis?.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const selected = cases?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Case list */}
      <div className="lg:col-span-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="pl-9"
          />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCase(c)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedId === c.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{c.caseId}</span>
                  {c.goldStandardDiagnosis ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">no GS</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.goldStandardDiagnosis || c.lesionLocation || '—'}
                </p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No cases.</p>
            )}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="lg:col-span-3">
        {selected ? (
          <Card className="glass-card-light">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Gold Standard — {selected.caseId}</h3>
              </div>

              <div>
                <Label className="mb-1.5 block">Confirmed Diagnosis (ICD-10)</Label>
                <DiagnosisCombobox
                  value={diagnosis}
                  icd10={icd10}
                  onSelect={(d) => {
                    setDiagnosis(d?.name ?? null);
                    setIcd10(d?.code ?? null);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOLD_STANDARD_SOURCES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gs-date" className="mb-1.5 block">Date</Label>
                  <Input
                    id="gs-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Gold Standard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-12 text-center text-muted-foreground">
              <ShieldCheck className="h-14 w-14 mx-auto text-muted-foreground/40 mb-3" />
              Select a case to record its ground-truth diagnosis.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
