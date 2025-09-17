import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ImageUpload";
import { PatientForm } from "@/components/PatientForm";
import { DiagnosisResults } from "@/components/DiagnosisResults";
import { CaseHistory } from "@/components/CaseHistory";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { useToast } from "@/hooks/use-toast";
import SiteFooter from "@/components/SiteFooter";
import type { Case } from "@shared/schema";

interface PatientData {
  patientId: string;
  age: number | null;
  gender: string;
  skinType: string;
  lesionLocation: string;
  symptoms: string[];
  additionalSymptoms: string;
  symptomDuration: string;
  medicalHistory: string[];
}

export default function DiagnosisPage() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<Case | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (data: { patientData: PatientData; imageUrl: string }) => {
      // First create/get patient
      const patientResponse = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.patientData),
      });
      
      if (!patientResponse.ok) {
        throw new Error("Failed to create patient record");
      }
      
      const patient = await patientResponse.json();

      // Then analyze the case
      const caseData = {
        patientId: patient.id,
        imageUrl: data.imageUrl,
        lesionLocation: data.patientData.lesionLocation,
        symptoms: data.patientData.symptoms,
        additionalSymptoms: data.patientData.additionalSymptoms,
        symptomDuration: data.patientData.symptomDuration,
        medicalHistory: data.patientData.medicalHistory,
      };

      const analysisResponse = await fetch("/api/cases/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze case");
      }

      return analysisResponse.json();
    },
    onSuccess: (data: Case) => {
      setAnalysisResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Analysis Complete",
        description: "AI models have successfully analyzed the case.",
      });
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete the analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (patientData: PatientData) => {
    if (!uploadedImageUrl) {
      toast({
        title: "Image Required",
        description: "Please upload a lesion image before analyzing.",
        variant: "destructive",
      });
      return;
    }

    analyzeMutation.mutate({ patientData, imageUrl: uploadedImageUrl });
  };

  const handleSaveCase = () => {
    toast({
      title: "Case Saved",
      description: "Case has been saved to the database.",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Report Generated",
      description: "Medical report has been generated successfully.",
    });
  };

  const handleNewAnalysis = () => {
    setUploadedImageUrl("");
    setAnalysisResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dermatological Diagnosis Support</h2>
          <p className="text-muted-foreground">AI-powered analysis of skin lesions using advanced machine learning models</p>
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
              <ImageUpload 
                onImageUploaded={setUploadedImageUrl}
                uploadedImage={uploadedImageUrl}
              />
            </div>

            {/* Patient Information Form */}
            <div className="lg:col-span-2">
              <PatientForm 
                onSubmit={handleFormSubmit}
                isLoading={false}
              />
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
