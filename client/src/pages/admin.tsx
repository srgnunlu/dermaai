import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, Users, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch all cases for admin
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/admin/cases"],
  });

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Filter cases based on search and filters
  const filteredCases = cases?.filter((caseItem: any) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      caseItem.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientId?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all" && caseItem.createdAt) {
      const caseDate = new Date(caseItem.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = caseDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = caseDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = caseDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Export cases as CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/admin/export/cases", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export cases");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cases-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting cases:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800" data-testid={`badge-status-${status}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
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
    
    const hasUrgent = diagnoses.some(d => d.isUrgent);
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-admin-panel">Admin Panel</h1>
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

      {/* Filters */}
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
                  data-testid="input-search"
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
          <CardDescription>
            {filteredCases?.length || 0} cases found
          </CardDescription>
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
                  <TableHead>Top Diagnosis</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases && filteredCases.length > 0 ? (
                  filteredCases.map((caseItem: any) => {
                    const topDiagnosis = caseItem.finalDiagnoses?.[0];
                    return (
                      <TableRow key={caseItem.id} data-testid={`row-case-${caseItem.id}`}>
                        <TableCell className="font-medium">
                          {caseItem.caseId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {caseItem.user?.email || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {caseItem.patientId || "N/A"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(caseItem.status)}
                        </TableCell>
                        <TableCell>
                          {caseItem.createdAt
                            ? format(new Date(caseItem.createdAt), "MMM dd, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {topDiagnosis?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {topDiagnosis ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className={cn(
                                  "w-full bg-gray-200 rounded-full h-2",
                                  "relative overflow-hidden"
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    topDiagnosis.confidence >= 70
                                      ? "bg-green-500"
                                      : topDiagnosis.confidence >= 40
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  )}
                                  style={{ width: `${topDiagnosis.confidence}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {topDiagnosis.confidence}%
                              </span>
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(caseItem.finalDiagnoses)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No cases found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}