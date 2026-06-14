import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FlaskConical,
  Download,
  Shuffle,
  Layers,
  Target,
  Microscope,
  Loader2,
  Database,
  CheckCircle2,
  Clock,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SiteFooter from '@/components/SiteFooter';
import StudyManager from '@/components/research/StudyManager';
import GoldStandardEditor from '@/components/research/GoldStandardEditor';
import { apiRequest } from '@/lib/queryClient';

// ---- types mirroring server/researchStats.ts ----
interface AccuracyResult {
  n: number;
  top1: number; top1CiLower: number; top1CiUpper: number;
  top3: number; top3CiLower: number; top3CiUpper: number;
}
interface DiagnosticPerformance {
  n: number; tp: number; fp: number; tn: number; fn: number;
  sensitivity: number; specificity: number; ppv: number; npv: number; accuracy: number;
}
interface ModelSummary {
  model: string; label: string; casesWithPrediction: number;
  accuracy: AccuracyResult; diagnostic: DiagnosticPerformance; avgConfidence: number;
}
interface KappaResult {
  label: string; kappa: number; se: number; ciLower: number; ciUpper: number;
  n: number; observedAgreement: number; interpretation: string;
}
interface ConfusionMatrix {
  labels: string[]; matrix: number[][]; rowTotals: number[]; colTotals: number[];
}
interface SubgroupAccuracy { group: string; label: string; n: number; top1: number; }
interface ResearchAnalytics {
  generatedAt: string;
  totalCases: number;
  casesWithGoldStandard: number;
  models: ModelSummary[];
  kappas: KappaResult[];
  confusionMatrix: ConfusionMatrix;
  fitzpatrickSubgroups: SubgroupAccuracy[];
}
interface PoolStatus {
  totalCases: number; withGoldStandard: number;
  reviewsTotal: number; reviewsCompleted: number; reviewsPending: number;
  reviewsInProgress: number; reviewsSkipped: number; reviewerCount: number;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const ci = (lo: number, hi: number) => `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`;

const MODEL_COLORS: Record<string, string> = {
  gemini: '#8b5cf6',
  openai: '#10b981',
  final: '#0891b2',
  dermatologist: '#f59e0b',
};

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <Card className="premium-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="feature-icon h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResearchAnalyticsPage() {
  const { toast } = useToast();
  const [studyId, setStudyId] = useState<string | null>(null);
  const studyParam = studyId ? `?studyId=${studyId}` : '';

  const { data: pool } = useQuery<PoolStatus>({
    queryKey: ['/api/research/pool-status', studyId],
    queryFn: async () => (await apiRequest('GET', `/api/research/pool-status${studyParam}`)).json(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<ResearchAnalytics>({
    queryKey: ['/api/research/analytics', studyId],
    queryFn: async () => (await apiRequest('GET', `/api/research/analytics${studyParam}`)).json(),
  });

  const handleExport = async () => {
    try {
      const res = await apiRequest('GET', `/api/research/export${studyParam}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  const handleRandomize = async () => {
    try {
      const res = await apiRequest('POST', '/api/research/randomize', { studyId });
      const { randomized } = await res.json();
      toast({ title: 'Randomized', description: `${randomized} cases assigned a review order.`, variant: 'info' });
    } catch {
      toast({ title: 'Randomization failed', variant: 'destructive' });
    }
  };

  // Chart data
  const accuracyChart = analytics?.models
    .filter((m) => m.accuracy.n > 0)
    .map((m) => ({
      name: m.label,
      'Top-1': +(m.accuracy.top1 * 100).toFixed(1),
      'Top-3': +(m.accuracy.top3 * 100).toFixed(1),
    }));

  const sensSpecChart = analytics?.models
    .filter((m) => m.diagnostic.n > 0)
    .map((m) => ({
      name: m.label,
      Sensitivity: +(m.diagnostic.sensitivity * 100).toFixed(1),
      Specificity: +(m.diagnostic.specificity * 100).toFixed(1),
    }));

  const subgroupChart = analytics?.fitzpatrickSubgroups
    .filter((s) => s.n > 0)
    .map((s) => ({ name: s.label, Accuracy: +(s.top1 * 100).toFixed(1), n: s.n }));

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="feature-icon h-11 w-11 rounded-xl flex items-center justify-center">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Research Analytics</h1>
              <p className="text-sm text-muted-foreground">
                AI vs. expert agreement, diagnostic performance & study management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRandomize} data-testid="randomize-btn">
              <Shuffle className="h-4 w-4 mr-2" /> Randomize
            </Button>
            <Button onClick={handleExport} data-testid="export-btn">
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: studies */}
          <div className="lg:col-span-1">
            <StudyManager selectedStudyId={studyId} onSelectStudy={setStudyId} />
          </div>

          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pool status */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Database} label="Total Cases" value={pool?.totalCases ?? 0} />
              <StatCard
                icon={CheckCircle2}
                label="Gold Standard"
                value={pool?.withGoldStandard ?? 0}
                sub={pool ? `${pool.totalCases - pool.withGoldStandard} missing` : undefined}
              />
              <StatCard
                icon={Clock}
                label="Reviews Done"
                value={pool?.reviewsCompleted ?? 0}
                sub={pool ? `${pool.reviewsInProgress} in progress` : undefined}
              />
              <StatCard icon={Users} label="Reviewers" value={pool?.reviewerCount ?? 0} />
            </div>

            <Tabs defaultValue="performance">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="performance">
                  <Target className="h-4 w-4 mr-1.5" /> Performance
                </TabsTrigger>
                <TabsTrigger value="agreement">
                  <Layers className="h-4 w-4 mr-1.5" /> Agreement
                </TabsTrigger>
                <TabsTrigger value="confusion">
                  <Microscope className="h-4 w-4 mr-1.5" /> Confusion
                </TabsTrigger>
                <TabsTrigger value="gold">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Gold Std
                </TabsTrigger>
              </TabsList>

              {analyticsLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Computing statistics...
                </div>
              ) : (
                <>
                  {/* PERFORMANCE */}
                  <TabsContent value="performance" className="space-y-6 mt-4">
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="text-base">Model Performance vs. Gold Standard</CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Model</TableHead>
                              <TableHead className="text-right">n</TableHead>
                              <TableHead className="text-right">Top-1 (95% CI)</TableHead>
                              <TableHead className="text-right">Top-3</TableHead>
                              <TableHead className="text-right">Sens.</TableHead>
                              <TableHead className="text-right">Spec.</TableHead>
                              <TableHead className="text-right">PPV</TableHead>
                              <TableHead className="text-right">NPV</TableHead>
                              <TableHead className="text-right">Conf.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics?.models.map((m) => (
                              <TableRow key={m.model}>
                                <TableCell className="font-medium">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: MODEL_COLORS[m.model] }} />
                                    {m.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">{m.accuracy.n}</TableCell>
                                <TableCell className="text-right">
                                  {m.accuracy.n ? (
                                    <span>
                                      {pct(m.accuracy.top1)}
                                      <span className="block text-[10px] text-muted-foreground">
                                        {ci(m.accuracy.top1CiLower, m.accuracy.top1CiUpper)}
                                      </span>
                                    </span>
                                  ) : '—'}
                                </TableCell>
                                <TableCell className="text-right">{m.accuracy.n ? pct(m.accuracy.top3) : '—'}</TableCell>
                                <TableCell className="text-right">{m.diagnostic.n ? pct(m.diagnostic.sensitivity) : '—'}</TableCell>
                                <TableCell className="text-right">{m.diagnostic.n ? pct(m.diagnostic.specificity) : '—'}</TableCell>
                                <TableCell className="text-right">{m.diagnostic.n ? pct(m.diagnostic.ppv) : '—'}</TableCell>
                                <TableCell className="text-right">{m.diagnostic.n ? pct(m.diagnostic.npv) : '—'}</TableCell>
                                <TableCell className="text-right">{m.avgConfidence ? `${m.avgConfidence.toFixed(0)}%` : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <p className="text-[11px] text-muted-foreground mt-3">
                          Sensitivity/Specificity/PPV/NPV measure <strong>malignancy detection</strong>{' '}
                          (predicting any malignant lesion) against the gold standard.
                        </p>
                      </CardContent>
                    </Card>

                    {accuracyChart && accuracyChart.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-card-light">
                          <CardHeader><CardTitle className="text-base">Top-1 / Top-3 Accuracy</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart data={accuracyChart}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="name" fontSize={11} />
                                <YAxis domain={[0, 100]} unit="%" fontSize={11} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Top-1" fill="#0891b2" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Top-3" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                        <Card className="glass-card-light">
                          <CardHeader><CardTitle className="text-base">Malignancy Detection</CardTitle></CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart data={sensSpecChart}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="name" fontSize={11} />
                                <YAxis domain={[0, 100]} unit="%" fontSize={11} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Sensitivity" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Specificity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Fitzpatrick subgroup */}
                    {subgroupChart && subgroupChart.length > 0 && (
                      <Card className="glass-card-light">
                        <CardHeader>
                          <CardTitle className="text-base">Subgroup Accuracy by Fitzpatrick Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={subgroupChart}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" fontSize={11} />
                              <YAxis domain={[0, 100]} unit="%" fontSize={11} />
                              <Tooltip formatter={(v: any, _n, p: any) => [`${v}% (n=${p.payload.n})`, 'Accuracy']} />
                              <Bar dataKey="Accuracy" fill="#0891b2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* AGREEMENT (kappa) */}
                  <TabsContent value="agreement" className="space-y-6 mt-4">
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="text-base">Cohen's Kappa — Inter-rater Agreement</CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Comparison</TableHead>
                              <TableHead className="text-right">n</TableHead>
                              <TableHead className="text-right">κ</TableHead>
                              <TableHead className="text-right">95% CI</TableHead>
                              <TableHead className="text-right">Observed</TableHead>
                              <TableHead>Strength</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analytics?.kappas.map((k) => (
                              <TableRow key={k.label}>
                                <TableCell className="font-medium">{k.label}</TableCell>
                                <TableCell className="text-right">{k.n}</TableCell>
                                <TableCell className="text-right font-semibold">{k.n ? k.kappa.toFixed(3) : '—'}</TableCell>
                                <TableCell className="text-right text-xs">
                                  {k.n ? `${k.ciLower.toFixed(2)}–${k.ciUpper.toFixed(2)}` : '—'}
                                </TableCell>
                                <TableCell className="text-right">{k.n ? pct(k.observedAgreement) : '—'}</TableCell>
                                <TableCell>
                                  {k.n ? (
                                    <Badge variant="secondary" className="text-xs">{k.interpretation}</Badge>
                                  ) : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <p className="text-[11px] text-muted-foreground mt-3">
                          Agreement is computed at the diagnostic-category level (Landis & Koch interpretation).
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* CONFUSION MATRIX */}
                  <TabsContent value="confusion" className="mt-4">
                    <Card className="glass-card-light">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Confusion Matrix — Gold Standard (rows) vs. AI Consensus (cols)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        {analytics && analytics.confusionMatrix.labels.length > 0 ? (
                          <ConfusionMatrixView cm={analytics.confusionMatrix} />
                        ) : (
                          <p className="text-sm text-muted-foreground py-6 text-center">
                            Not enough gold-standard + AI data yet to build a confusion matrix.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* GOLD STANDARD EDITOR */}
                  <TabsContent value="gold" className="mt-4">
                    <GoldStandardEditor />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ConfusionMatrixView({ cm }: { cm: ConfusionMatrix }) {
  const max = Math.max(1, ...cm.matrix.flat());
  return (
    <table className="border-collapse text-sm">
      <thead>
        <tr>
          <th className="p-2 text-xs text-muted-foreground sticky left-0 bg-card">Gold ↓ / AI →</th>
          {cm.labels.map((l) => (
            <th key={l} className="p-2 text-[11px] font-medium whitespace-nowrap rotate-0 text-muted-foreground">
              {l}
            </th>
          ))}
          <th className="p-2 text-[11px] text-muted-foreground">Σ</th>
        </tr>
      </thead>
      <tbody>
        {cm.matrix.map((row, i) => (
          <tr key={i}>
            <td className="p-2 text-[11px] font-medium whitespace-nowrap sticky left-0 bg-card text-muted-foreground">
              {cm.labels[i]}
            </td>
            {row.map((v, j) => {
              const intensity = v / max;
              const isDiag = i === j;
              return (
                <td
                  key={j}
                  className="p-2 text-center tabular-nums border border-border/40"
                  style={{
                    background: v
                      ? `color-mix(in srgb, ${isDiag ? '#10b981' : '#0891b2'} ${Math.round(
                          intensity * 70 + 8
                        )}%, transparent)`
                      : 'transparent',
                    fontWeight: isDiag && v ? 600 : 400,
                  }}
                >
                  {v || ''}
                </td>
              );
            })}
            <td className="p-2 text-center text-muted-foreground tabular-nums">{cm.rowTotals[i]}</td>
          </tr>
        ))}
        <tr>
          <td className="p-2 text-[11px] text-muted-foreground sticky left-0 bg-card">Σ</td>
          {cm.colTotals.map((t, j) => (
            <td key={j} className="p-2 text-center text-muted-foreground tabular-nums">{t}</td>
          ))}
          <td />
        </tr>
      </tbody>
    </table>
  );
}
