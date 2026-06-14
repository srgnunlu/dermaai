import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PatientForm } from '@/components/PatientForm';
import { DiagnosisResults } from '@/components/DiagnosisResults';
import { CaseHistory } from '@/components/CaseHistory';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { useToast } from '@/hooks/use-toast';
import SiteFooter from '@/components/SiteFooter';
import type { Case } from '@shared/schema';
import { getCsrfHeaders } from '@/lib/queryClient';

interface PatientData {
  patientId: string;
  age: number | null;
  gender: string;
  skinType: string;
  lesionLocation: string[];
  symptoms: string[];
  additionalSymptoms: string;
  symptomDuration: string;
  medicalHistory: string[];
}

export default function DiagnosisPage() {
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<Case | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (data: { patientData: PatientData; imageUrls: string[] }) => {
      if (data.imageUrls.length === 0) {
        throw new Error('Please upload at least one lesion image before analyzing.');
      }

      // First create/get patient
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getCsrfHeaders()) },
        body: JSON.stringify(data.patientData),
        credentials: 'include',
      });

      if (!patientResponse.ok) {
        throw new Error('Failed to create patient record');
      }

      const patient = await patientResponse.json();

      // Then analyze the case with multiple images
      const caseData = {
        patientId: patient.id,
        imageUrls: data.imageUrls, // Support for 1-3 images
        lesionLocation: data.patientData.lesionLocation.join(', '), // Convert array to comma-separated string
        symptoms: data.patientData.symptoms,
        additionalSymptoms: data.patientData.additionalSymptoms,
        symptomDuration: data.patientData.symptomDuration,
        medicalHistory: data.patientData.medicalHistory,
      };

      // Retry the analyze call on transient server errors (e.g. DB cold-start / 5xx).
      // The patient record is already created above, so retrying here does not
      // duplicate it — only the idempotent analyze POST is repeated.
      const MAX_ATTEMPTS = 3;
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const analysisResponse = await fetch('/api/cases/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getCsrfHeaders()) },
          body: JSON.stringify(caseData),
          credentials: 'include',
        });

        if (analysisResponse.ok) {
          return analysisResponse.json();
        }

        // Surface the server's message when available (e.g. subscription limit).
        let serverMessage = '';
        try {
          const body = await analysisResponse.json();
          serverMessage = body?.message || body?.error || '';
        } catch {
          // response had no JSON body
        }

        // 4xx are not retryable (bad input, subscription limit) — fail fast.
        if (analysisResponse.status < 500) {
          throw new Error(serverMessage || 'Failed to analyze case');
        }

        lastError = new Error(serverMessage || `Analysis failed (status ${analysisResponse.status})`);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        }
      }

      throw lastError ?? new Error('Failed to analyze case');
    },
    onSuccess: (data: Case) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      const errors = (data as any).analysisErrors as
        | Array<{ provider: string; code?: string; message: string; hint?: string }>
        | undefined;
      if (errors && errors.length > 0) {
        const msgs = errors
          .map(
            (e) =>
              `${e.provider}: ${e.code || 'ERROR'} - ${e.message}${e.hint ? ` (${e.hint})` : ''}`
          )
          .join('; ');
        toast({
          title: 'Partial Analysis',
          description: msgs,
          variant: 'info',
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: 'AI models have successfully analyzed the case.',
          variant: 'success',
        });
      }
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to complete the analysis. Please try again.';
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const handleFormSubmit = (patientData: PatientData) => {
    if (uploadedImageUrls.length === 0) {
      toast({
        title: 'Image Required',
        description: 'Please upload at least one lesion image before analyzing.',
        variant: 'destructive',
      });
      return;
    }

    analyzeMutation.mutate({ patientData, imageUrls: uploadedImageUrls });
  };

  const saveCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await fetch(`/api/mobile/cases/${caseId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getCsrfHeaders()) },
        body: JSON.stringify({ isFavorite: true }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to save case');
      return response.json();
    },
    onSuccess: (updated: Case) => {
      setAnalysisResult((prev) => (prev ? { ...prev, isFavorite: true } : updated));
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
      toast({
        title: 'Case Saved',
        description: 'This case has been bookmarked to your history.',
        variant: 'success',
      });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Unable to save this case. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSaveCase = () => {
    if (!analysisResult?.id) {
      toast({
        title: 'Error',
        description: 'No case data available to save.',
        variant: 'destructive',
      });
      return;
    }
    saveCaseMutation.mutate(analysisResult.id);
  };

  const handleGenerateReport = async () => {
    if (!analysisResult?.id) {
      toast({
        title: 'Error',
        description: 'No case data available to generate report.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Generating Report',
        description: 'Please wait while we generate your PDF report...',
        variant: 'info',
      });

      const response = await fetch(`/api/cases/${analysisResult.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getCsrfHeaders()) },
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Case-Report-${analysisResult.caseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Report Downloaded',
          description: `Medical report for case ${analysisResult.caseId} has been downloaded.`,
          variant: 'success',
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNewAnalysis = () => {
    setUploadedImageUrls([]);
    setAnalysisResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            AI-Assisted Skin Awareness
          </h2>
          <p className="text-muted-foreground">
            AI-powered analysis of skin lesions using advanced machine learning models (supports 1-3 images per case)
          </p>
        </div>

        {/* Analysis Progress */}
        {analyzeMutation.isPending && (
          <div className="mb-8">
            <AnalysisProgress
              isActive={analyzeMutation.isPending}
              onComplete={() => {
                // Progress animation completion will be handled by the mutation
              }}
            />
          </div>
        )}

        {/* Preliminary assessment workflow — multi-step wizard */}
        {!analyzeMutation.isPending && !analysisResult && (
          <div className="mx-auto max-w-3xl">
            <PatientForm
              onSubmit={handleFormSubmit}
              isLoading={analyzeMutation.isPending}
              uploadedImages={uploadedImageUrls}
              onImagesUploaded={setUploadedImageUrls}
            />
          </div>
        )}

        {/* AI Analysis Results */}
        {analysisResult && (
          <div className="mt-8">
            <DiagnosisResults
              caseData={analysisResult}
              onSaveCase={handleSaveCase}
              onGenerateReport={handleGenerateReport}
              onNewAnalysis={handleNewAnalysis}
              isSaving={saveCaseMutation.isPending}
              isSaved={!!analysisResult.isFavorite}
            />
          </div>
        )}

        {/* Case History */}
        <div className="mt-8">
          <CaseHistory compact limit={6} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
