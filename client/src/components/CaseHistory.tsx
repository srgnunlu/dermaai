import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Case } from "@shared/schema";

export function CaseHistory() {
  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });
  const { toast } = useToast();

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-success";
    if (confidence >= 60) return "text-foreground";
    return "text-destructive";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <History className="text-primary mr-2" size={20} />
          Recent Cases
        </h3>
      </div>
      <CardContent className="p-6">
        {cases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No cases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Case ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Top Diagnosis</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Confidence</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseRecord) => {
                  const topDiagnosis = caseRecord.finalDiagnoses?.[0];
                  return (
                    <tr 
                      key={caseRecord.id} 
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                      data-testid={`row-case-${caseRecord.caseId}`}
                    >
                      <td className="py-3 px-4 text-sm text-foreground font-mono" data-testid={`text-case-id-${caseRecord.caseId}`}>
                        {caseRecord.caseId}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground" data-testid={`text-date-${caseRecord.caseId}`}>
                        {formatDate(caseRecord.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground" data-testid={`text-patient-id-${caseRecord.caseId}`}>
                        {caseRecord.patientId || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground" data-testid={`text-top-diagnosis-${caseRecord.caseId}`}>
                        {topDiagnosis?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium" data-testid={`text-confidence-${caseRecord.caseId}`}>
                        {topDiagnosis ? (
                          <span className={getConfidenceColor(topDiagnosis.confidence)}>
                            {topDiagnosis.confidence}%
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:underline"
                            onClick={() => {
                              toast({
                                title: "Case Details",
                                description: `Opening detailed view for case ${caseRecord.caseId}`,
                              });
                              // TODO: Navigate to case detail view  
                              console.log('Viewing case:', caseRecord);
                            }}
                            data-testid={`button-view-${caseRecord.caseId}`}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-secondary hover:underline"
                            onClick={() => {
                              toast({
                                title: "Report Generation",
                                description: `Generating medical report for case ${caseRecord.caseId}`,
                              });
                              // TODO: Generate and download PDF report
                              console.log('Generating report for case:', caseRecord);
                            }}
                            data-testid={`button-report-${caseRecord.caseId}`}
                          >
                            <FileText size={14} className="mr-1" />
                            Report
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {cases.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-primary hover:underline text-sm font-medium"
              data-testid="button-view-all-cases"
            >
              View all cases →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
