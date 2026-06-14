import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { FlaskConical, Plus, Loader2 } from 'lucide-react';
import type { Study } from '@shared/schema';
import { STUDY_STATUSES, type StudyStatus } from '@shared/dermatology-diagnoses';
import { apiRequest } from '@/lib/queryClient';

interface StudyManagerProps {
  selectedStudyId: string | null;
  onSelectStudy: (id: string | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-sky-100 text-sky-800',
  archived: 'bg-slate-100 text-slate-400',
};

export default function StudyManager({ selectedStudyId, onSelectStudy }: StudyManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState('');

  const { data: studies, isLoading } = useQuery<Study[]>({ queryKey: ['/api/studies'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/studies', {
        name: name.trim(),
        description: description.trim() || null,
        inclusionCriteria: criteria.trim() || null,
        status: 'draft',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/studies'] });
      setName('');
      setDescription('');
      setCriteria('');
      setShowForm(false);
      toast({ title: 'Study created', variant: 'success' });
    },
    onError: () => toast({ title: 'Error', description: 'Could not create study.', variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StudyStatus }) => {
      const res = await apiRequest('PATCH', `/api/studies/${id}`, { status });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/studies'] }),
  });

  return (
    <Card className="glass-card-light">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-5 w-5 text-primary" /> Studies
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-3 rounded-lg border p-3 bg-background/50">
            <div>
              <Label htmlFor="study-name" className="text-xs">Name *</Label>
              <Input id="study-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI vs Dermatologist 2026" />
            </div>
            <div>
              <Label htmlFor="study-desc" className="text-xs">Description</Label>
              <Textarea id="study-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="study-crit" className="text-xs">Inclusion Criteria</Label>
              <Textarea id="study-crit" rows={2} value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="e.g. biopsy-confirmed cases, adults..." />
            </div>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!name.trim() || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Study
            </Button>
          </div>
        )}

        {/* "All cases" pseudo-study */}
        <button
          onClick={() => onSelectStudy(null)}
          className={`w-full text-left rounded-lg border p-3 transition-colors ${
            selectedStudyId === null ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
          }`}
        >
          <p className="font-medium text-sm">All Cases (Pool)</p>
          <p className="text-xs text-muted-foreground">Analyze the entire case pool</p>
        </button>

        {isLoading && <p className="text-xs text-muted-foreground">Loading studies...</p>}

        {studies?.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-3 transition-colors ${
              selectedStudyId === s.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <button onClick={() => onSelectStudy(s.id)} className="w-full text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium text-sm truncate">{s.name}</p>
                <Badge className={STATUS_COLORS[s.status ?? 'draft']}>{s.status}</Badge>
              </div>
              {s.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
              )}
            </button>
            <div className="mt-2">
              <Select
                value={s.status ?? 'draft'}
                onValueChange={(v) => statusMutation.mutate({ id: s.id, status: v as StudyStatus })}
              >
                <SelectTrigger className="h-7 text-xs w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs capitalize">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
