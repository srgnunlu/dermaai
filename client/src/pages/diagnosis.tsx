import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ImageUpload';
import { PatientForm } from '@/components/PatientForm';
import { DiagnosisResults } from '@/components/DiagnosisResults';
import { CaseHistory } from '@/components/CaseHistory';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { useToast } from '@/hooks/use-toast';
import SiteFooter from '@/components/SiteFooter';
import type { Case } from '@shared/schema';

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
      // First create/get patient
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.patientData),
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

      const analysisResponse = await fetch('/api/cases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze case');
      }

      return analysisResponse.json();
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
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: 'AI models have successfully analyzed the case.',
        });
      }
    },
    onError: (error) => {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Unable to complete the analysis. Please try again.',
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

  const handleSaveCase = () => {
    toast({
      title: 'Case Saved',
      description: 'Case has been saved to the database.',
    });
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
      });

      const response = await fetch(`/api/cases/${analysisResult.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
            Dermatological Diagnosis Support
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

        {/* Diagnosis Workflow */}
        {!analyzeMutation.isPending && !analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image Upload Section */}
            <div className="lg:col-span-1">
              <ImageUpload onImagesUploaded={setUploadedImageUrls} uploadedImages={uploadedImageUrls} />
            </div>

            {/* Patient Information Form */}
            <div className="lg:col-span-2">
              <PatientForm onSubmit={handleFormSubmit} isLoading={false} />
            </div>
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
            />
          </div>
        )}

        {/* Case History */}
        <div className="mt-8">
          <CaseHistory />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
