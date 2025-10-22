import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { History, Eye, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Case } from '@shared/schema';

export function CaseHistory() {
  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });
  const { toast } = useToast();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-foreground';
    return 'text-destructive';
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
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
    <>
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Case ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Top Diagnosis
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Confidence
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Actions
                    </th>
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
                        <td
                          className="py-3 px-4 text-sm text-foreground font-mono"
                          data-testid={`text-case-id-${caseRecord.caseId}`}
                        >
                          {caseRecord.caseId}
                        </td>
                        <td
                          className="py-3 px-4 text-sm text-muted-foreground"
                          data-testid={`text-date-${caseRecord.caseId}`}
                        >
                          {formatDate(caseRecord.createdAt)}
                        </td>
                        <td
                          className="py-3 px-4 text-sm text-foreground"
                          data-testid={`text-patient-id-${caseRecord.caseId}`}
                        >
                          {caseRecord.patientId || 'N/A'}
                        </td>
                        <td
                          className="py-3 px-4 text-sm text-foreground"
                          data-testid={`text-top-diagnosis-${caseRecord.caseId}`}
                        >
                          {topDiagnosis?.name || 'N/A'}
                        </td>
                        <td
                          className="py-3 px-4 text-sm font-medium"
                          data-testid={`text-confidence-${caseRecord.caseId}`}
                        >
                          {topDiagnosis ? (
                            <span className={getConfidenceColor(topDiagnosis.confidence)}>
                              {topDiagnosis.confidence}%
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:underline"
                              onClick={() => {
                                setSelectedCase(caseRecord);
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
                              onClick={async () => {
                                setIsGeneratingReport(true);
                                try {
                                  const response = await fetch(
                                    `/api/cases/${caseRecord.id}/report`,
                                    {
                                      method: 'POST',
                                    }
                                  );

                                  if (response.ok) {
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
                                    });
                                  } else {
                                    throw new Error('Failed to generate report');
                                  }
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to generate report. Please try again.',
                                    variant: 'destructive',
                                  });
                                } finally {
                                  setIsGeneratingReport(false);
                                }
                              }}
                              data-testid={`button-report-${caseRecord.caseId}`}
                            >
                              {isGeneratingReport ? (
                                <Download size={14} className="mr-1 animate-spin" />
                              ) : (
                                <FileText size={14} className="mr-1" />
                              )}
                              {isGeneratingReport ? 'Generating...' : 'Report'}
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

      {/* Case Detail Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Details - {selectedCase?.caseId}</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-6">
              {/* Case Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Case ID</h4>
                  <p className="font-mono">{selectedCase.caseId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Date</h4>
                  <p>{formatDate(selectedCase.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Patient ID</h4>
                  <p>{selectedCase.patientId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                  <Badge variant={selectedCase.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedCase.status}
                  </Badge>
                </div>
              </div>

              {/* Diagnoses */}
              {selectedCase.finalDiagnoses && selectedCase.finalDiagnoses.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">AI Diagnosis Results</h4>
                  <div className="space-y-3">
                    {selectedCase.finalDiagnoses.slice(0, 3).map((diagnosis, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{diagnosis.name}</h5>
                          <Badge variant={diagnosis.confidence >= 80 ? 'default' : 'secondary'}>
                            {diagnosis.confidence}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {diagnosis.description}
                        </p>
                        {diagnosis.keyFeatures.length > 0 && (
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
