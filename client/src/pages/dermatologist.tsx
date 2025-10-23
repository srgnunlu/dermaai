import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, Save, Edit2, CheckCircle, ImageIcon } from 'lucide-react';
import type { Case } from '@shared/schema';
import SiteFooter from '@/components/SiteFooter';

export default function DermatologistPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Fetch all cases for dermatologist review (without AI analysis)
  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ['/api/dermatologist/cases'],
    queryFn: async () => {
      const response = await fetch('/api/dermatologist/cases');
      if (!response.ok) {
        throw new Error('Failed to fetch cases');
      }
      return response.json();
    },
  });

  // Mutation to save dermatologist diagnosis
  const saveDiagnosisMutation = useMutation({
    mutationFn: async (data: { caseId: string; diagnosis: string; notes?: string }) => {
      const response = await fetch(`/api/cases/${data.caseId}/dermatologist-diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dermatologistDiagnosis: data.diagnosis,
          dermatologistNotes: data.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save diagnosis');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dermatologist/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cases'] });
      setSelectedCaseId(null);
      setEditingCaseId(null);
      setDiagnosis('');
      setNotes('');
      toast({
        title: 'Diagnosis Saved',
        description: 'Your diagnosis has been successfully saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save diagnosis. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveDiagnosis = (caseId: string) => {
    if (!diagnosis.trim()) {
      toast({
        title: 'Diagnosis Required',
        description: 'Please enter a diagnosis before saving.',
        variant: 'destructive',
      });
      return;
    }

    saveDiagnosisMutation.mutate({
      caseId,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
    });
  };

  const handleEdit = (caseItem: Case) => {
    setEditingCaseId(caseItem.id);
    setSelectedCaseId(caseItem.id);
    setDiagnosis(caseItem.dermatologistDiagnosis || '');
    setNotes(caseItem.dermatologistNotes || '');
  };

  const handleSelectCase = (caseItem: Case) => {
    if (caseItem.dermatologistDiagnosis) {
      // If already has diagnosis, show it in view mode
      setSelectedCaseId(caseItem.id);
      setDiagnosis(caseItem.dermatologistDiagnosis);
      setNotes(caseItem.dermatologistNotes || '');
      setEditingCaseId(null);
    } else {
      // New diagnosis
      setSelectedCaseId(caseItem.id);
      setDiagnosis('');
      setNotes('');
      setEditingCaseId(caseItem.id);
    }
  };

  const selectedCase = cases?.find((c) => c.id === selectedCaseId);

  // Get image URLs
  const getImageUrls = (caseItem: Case): string[] => {
    const urls = (caseItem as any).imageUrls;
    if (Array.isArray(urls) && urls.length > 0) {
      return urls;
    }
    return caseItem.imageUrl ? [caseItem.imageUrl] : [];
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Dermatologist Review Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Review cases and provide your expert diagnosis (AI analysis hidden for blind review)
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cases List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Cases ({cases?.length || 0})</h2>
              <div className="space-y-3 max-h-[800px] overflow-y-auto">
                {cases?.map((caseItem) => (
                  <Card
                    key={caseItem.id}
                    className={`cursor-pointer transition-all ${
                      selectedCaseId === caseItem.id
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectCase(caseItem)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">Case ID: {caseItem.caseId}</p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.createdAt
                              ? new Date(caseItem.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                        {caseItem.dermatologistDiagnosis ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Diagnosed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>

                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Location:</span>{' '}
                          {caseItem.lesionLocation || 'Not specified'}
                        </p>
                        <p>
                          <span className="font-medium">Symptoms:</span>{' '}
                          {Array.isArray(caseItem.symptoms)
                            ? caseItem.symptoms.join(', ')
                            : caseItem.symptoms || 'None'}
                        </p>
                        {caseItem.dermatologistDiagnosis && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium text-green-700">Your Diagnosis:</p>
                            <p className="text-sm">{caseItem.dermatologistDiagnosis}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {cases?.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No cases available for review</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Case Details & Diagnosis Form */}
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedCase ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Case Details</span>
                      {selectedCase.dermatologistDiagnosis && !editingCaseId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(selectedCase)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Patient Information */}
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">Patient Information</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Patient ID:</span>{' '}
                          {selectedCase.patientId || 'N/A'}
                        </p>
                        <p>
                          <span className="font-medium">Lesion Location:</span>{' '}
                          {selectedCase.lesionLocation || 'Not specified'}
                        </p>
                        <p>
                          <span className="font-medium">Symptoms:</span>{' '}
                          {Array.isArray(selectedCase.symptoms)
                            ? selectedCase.symptoms.join(', ')
                            : selectedCase.symptoms || 'None'}
                        </p>
                        {selectedCase.additionalSymptoms && (
                          <p>
                            <span className="font-medium">Additional Symptoms:</span>{' '}
                            {selectedCase.additionalSymptoms}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Duration:</span>{' '}
                          {selectedCase.symptomDuration || 'Not specified'}
                        </p>
                        {selectedCase.medicalHistory &&
                          Array.isArray(selectedCase.medicalHistory) &&
                          selectedCase.medicalHistory.length > 0 && (
                            <p>
                              <span className="font-medium">Medical History:</span>{' '}
                              {selectedCase.medicalHistory.join(', ')}
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Lesion Images */}
                    <div>
                      <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Lesion Images
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {getImageUrls(selectedCase).map((url, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            <img
                              src={url}
                              alt={`Lesion ${index + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Diagnosis Form */}
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4 text-lg">
                        {editingCaseId ? 'Edit Your Diagnosis' : 'Your Diagnosis'}
                      </h3>

                      {editingCaseId === selectedCase.id ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="diagnosis">Diagnosis *</Label>
                            <Input
                              id="diagnosis"
                              placeholder="Enter your diagnosis..."
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="notes">Clinical Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any additional notes or observations..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="mt-1"
                              rows={4}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveDiagnosis(selectedCase.id)}
                              disabled={saveDiagnosisMutation.isPending}
                              className="flex-1"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {saveDiagnosisMutation.isPending ? 'Saving...' : 'Save Diagnosis'}
                            </Button>
                            {selectedCase.dermatologistDiagnosis && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingCaseId(null);
                                  setDiagnosis(selectedCase.dermatologistDiagnosis || '');
                                  setNotes(selectedCase.dermatologistNotes || '');
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                          <div>
                            <p className="font-medium text-sm text-muted-foreground mb-1">
                              Diagnosis
                            </p>
                            <p className="text-base">{diagnosis || 'Not yet diagnosed'}</p>
                          </div>
                          {notes && (
                            <div>
                              <p className="font-medium text-sm text-muted-foreground mb-1">
                                Clinical Notes
                              </p>
                              <p className="text-sm">{notes}</p>
                            </div>
                          )}
                          {selectedCase.dermatologistDiagnosedAt && (
                            <div>
                              <p className="font-medium text-sm text-muted-foreground mb-1">
                                Diagnosed At
                              </p>
                              <p className="text-sm">
                                {new Date(selectedCase.dermatologistDiagnosedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> AI analysis results are intentionally hidden to ensure
                        an unbiased blind review. Your diagnosis will be compared with AI predictions
                        for research purposes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a case from the list to begin your review
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

