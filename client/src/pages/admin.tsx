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
import { Download, Search, Users, FileText, CheckCircle, Clock, AlertCircle, Eye, FileDown, UserCog, Shield, UserX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);
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
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate case report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Case-Report-${caseItem.caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Case report downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting case:", error);
      toast({
        title: "Error", 
        description: "Failed to export case report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  // Fetch all cases for admin
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["/api/admin/cases"],
  });

  // Fetch system statistics
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch all users for admin
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Handle user role changes
  const handlePromoteUser = async (userId: string, userEmail: string) => {
    setIsChangingRole(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to promote user");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "Success",
        description: `${userEmail} has been promoted to admin`,
      });
    } catch (error) {
      console.error("Error promoting user:", error);
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setIsChangingRole(null);
    }
  };

  const handleDemoteUser = async (userId: string, userEmail: string) => {
    setIsChangingRole(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/demote`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to demote user");
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "Success",
        description: `${userEmail} has been demoted to user`,
      });
    } catch (error) {
      console.error("Error demoting user:", error);
      toast({
        title: "Error",
        description: "Failed to demote user",
        variant: "destructive",
      });
    } finally {
      setIsChangingRole(null);
    }
  };

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

  // Filter users based on search and role filters
  const filteredUsers = users?.filter((user: any) => {
    // Search filter
    const matchesSearch = userSearchTerm === "" || 
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-blue-100 text-blue-800" data-testid={`badge-role-${role}`}>
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "user":
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

      {/* Main Content - Tabbed Interface */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cases" data-testid="tab-cases">
            <FileText className="w-4 h-4 mr-2" />
            Case Management
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <UserCog className="w-4 h-4 mr-2" />
            User Management
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
                      <TableHead>Actions</TableHead>
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
                                  {isExporting === caseItem.id ? "Exporting..." : "Export"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
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
              <CardDescription>
                {filteredUsers?.length || 0} users found
              </CardDescription>
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
                        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "N/A";
                        return (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>{fullName}</TableCell>
                            <TableCell>
                              {getRoleBadge(user.role)}
                            </TableCell>
                            <TableCell>
                              {user.createdAt
                                ? format(new Date(user.createdAt), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {user.role !== "admin" ? (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of case {selectedCase?.caseId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6" data-testid="case-details-content">
              {/* Case Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Case Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Case ID:</span> {selectedCase.caseId}</p>
                    <p><span className="font-medium">User:</span> {selectedCase.user?.email || 'Unknown'}</p>
                    <p><span className="font-medium">Patient ID:</span> {selectedCase.patientId || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedCase.status)}</p>
                    <p><span className="font-medium">Date:</span> {selectedCase.createdAt ? format(new Date(selectedCase.createdAt), "PPpp") : 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Clinical Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Lesion Location:</span> {selectedCase.lesionLocation || 'Not specified'}</p>
                    <p><span className="font-medium">Symptoms:</span> {selectedCase.symptoms || 'None reported'}</p>
                    {selectedCase.medicalHistory && selectedCase.medicalHistory.length > 0 && (
                      <p><span className="font-medium">Medical History:</span> {selectedCase.medicalHistory.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Case Image */}
              {selectedCase.imageUrl && (
                <div>
                  <h3 className="font-semibold mb-2">Case Image</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={selectedCase.imageUrl.startsWith('https://storage.googleapis.com') 
                        ? `/objects/${selectedCase.imageUrl.split('/.private/')[1]}`
                        : selectedCase.imageUrl
                      } 
                      alt="Case image" 
                      className="max-w-full h-64 object-contain mx-auto rounded"
                      data-testid="case-image"
                      onError={(e) => {
                        console.error("Failed to load image:", selectedCase.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* AI Diagnosis Results */}
              {selectedCase.finalDiagnoses && selectedCase.finalDiagnoses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">AI Diagnosis Results</h3>
                  <div className="space-y-3">
                    {selectedCase.finalDiagnoses.map((diagnosis: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-lg">{diagnosis.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{diagnosis.confidence}%</div>
                            {diagnosis.isUrgent && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{diagnosis.description}</p>
                        
                        {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                          <div className="mb-2">
                            <span className="font-medium text-sm">Key Features:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                          <div>
                            <span className="font-medium text-sm">Recommendations:</span>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {diagnosis.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}