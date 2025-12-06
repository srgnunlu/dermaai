import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, Brain, Users, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SiteFooter from '@/components/SiteFooter';

// Chart color palette
const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

// TypeScript interfaces for API responses
interface DiagnosisDataItem {
  diagnosis: string;
  count: number;
  percentage: number;
}

interface TimeseriesDataItem {
  date: string;
  total: number;
  completed: number;
  pending: number;
}

interface AIPerformanceData {
  gemini: {
    total: number;
    avgConfidence: number;
    avgTime: number;
  };
  openai: {
    total: number;
    avgConfidence: number;
    avgTime: number;
  };
  consensus: number;
}

interface UserActivityItem {
  userId: string;
  email: string;
  casesCount: number;
  lastActive: string | null;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch diagnosis distribution
  const { data: diagnosisData, isLoading: diagnosisLoading } = useQuery<DiagnosisDataItem[]>({
    queryKey: ['/api/admin/analytics/diagnosis-distribution'],
  });

  // Fetch timeseries data
  const { data: timeseriesData, isLoading: timeseriesLoading } = useQuery<TimeseriesDataItem[]>({
    queryKey: ['/api/admin/analytics/timeseries', { days: timeRange }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/timeseries?days=${timeRange}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch timeseries data');
      return res.json();
    },
  });

  // Fetch AI performance
  const { data: aiPerformance, isLoading: aiLoading } = useQuery<AIPerformanceData>({
    queryKey: ['/api/admin/analytics/ai-performance'],
  });

  // Fetch user activity
  const { data: userActivity, isLoading: activityLoading } = useQuery<UserActivityItem[]>({
    queryKey: ['/api/admin/analytics/user-activity'],
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights and performance metrics
              </p>
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
              <TabsTrigger value="ai-models">AI Models</TabsTrigger>
              <TabsTrigger value="users">User Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cases Over Time
                  </CardTitle>
                  <CardDescription>Daily case submissions and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {timeseriesLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeseriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Total Cases"
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Completed"
                        />
                        <Line
                          type="monotone"
                          dataKey="pending"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Pending"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* AI Performance Metrics */}
              {aiLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-500" />
                        Gemini 3
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Analyses:</span>
                        <span className="font-semibold">{aiPerformance?.gemini.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Confidence:</span>
                        <span className="font-semibold">
                          {aiPerformance?.gemini.avgConfidence || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="font-semibold">{aiPerformance?.gemini.avgTime || 0}s</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-green-500" />
                        GPT-5.1
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Analyses:</span>
                        <span className="font-semibold">{aiPerformance?.openai.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Confidence:</span>
                        <span className="font-semibold">
                          {aiPerformance?.openai.avgConfidence || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="font-semibold">{aiPerformance?.openai.avgTime || 0}s</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Consensus Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">
                          {aiPerformance?.consensus || 0}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Cases analyzed by both AI models
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Diagnoses Tab */}
            <TabsContent value="diagnoses" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Diagnoses</CardTitle>
                    <CardDescription>Most frequently detected skin conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diagnosisLoading ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={diagnosisData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="diagnosis" type="category" width={150} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnosis Distribution</CardTitle>
                    <CardDescription>Percentage breakdown by condition</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diagnosisLoading ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={diagnosisData}
                            dataKey="percentage"
                            nameKey="diagnosis"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            label={(entry) => `${entry.diagnosis}: ${entry.percentage}%`}
                          >
                            {diagnosisData?.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Models Tab */}
            <TabsContent value="ai-models" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Model Performance Comparison</CardTitle>
                  <CardDescription>
                    Comparative analysis of Gemini and OpenAI models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            name: 'Total Analyses',
                            Gemini: aiPerformance?.gemini.total || 0,
                            OpenAI: aiPerformance?.openai.total || 0,
                          },
                          {
                            name: 'Avg Confidence',
                            Gemini: aiPerformance?.gemini.avgConfidence || 0,
                            OpenAI: aiPerformance?.openai.avgConfidence || 0,
                          },
                          {
                            name: 'Avg Time (s)',
                            Gemini: aiPerformance?.gemini.avgTime || 0,
                            OpenAI: aiPerformance?.openai.avgTime || 0,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gemini" fill="#8b5cf6" />
                        <Bar dataKey="OpenAI" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Active Users
                  </CardTitle>
                  <CardDescription>Users with most case submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userActivity?.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="email" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="casesCount" fill="#3b82f6" name="Cases" />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3">User</th>
                              <th className="text-right p-3">Cases</th>
                              <th className="text-right p-3">Last Active</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userActivity?.slice(0, 10).map((user: any, index: number) => (
                              <tr key={user.userId} className="border-t">
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      {index + 1}
                                    </div>
                                    <span className="font-medium">{user.email}</span>
                                  </div>
                                </td>
                                <td className="text-right p-3 font-semibold">{user.casesCount}</td>
                                <td className="text-right p-3 text-muted-foreground text-sm">
                                  {user.lastActive
                                    ? new Date(user.lastActive).toLocaleDateString()
                                    : 'Never'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
