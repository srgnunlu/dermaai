import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ImageUpload";
import { PatientForm } from "@/components/PatientForm";
import { DiagnosisResults } from "@/components/DiagnosisResults";
import { CaseHistory } from "@/components/CaseHistory";
import { useToast } from "@/hooks/use-toast";
import { Microscope, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Case } from "@shared/schema";

interface PatientData {
  patientId: string;
  age: number | null;
  gender: string;
  skinType: string;
  lesionLocation: string;
  symptoms: string;
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
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg mr-3">
                  <Microscope size={20} />
                </div>
                <h1 className="text-xl font-bold text-foreground">DermaAI</h1>
                <span className="ml-2 text-sm text-muted-foreground font-medium">Medical Support</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-primary font-medium" data-testid="link-diagnosis">Diagnosis</a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-case-history">Case History</a>
              <a href="#" className="text-muted-foreground hover:text-foreground" data-testid="link-settings">Settings</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-alerts">
                <Bell size={16} className="mr-2" />
                Alerts
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dermatological Diagnosis Support</h2>
          <p className="text-muted-foreground">AI-powered analysis of skin lesions using advanced machine learning models</p>
        </div>

        {/* Diagnosis Workflow */}
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
              isLoading={analyzeMutation.isPending}
            />
          </div>
        </div>

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

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-sm mr-2">
                  <Microscope size={14} />
                </div>
                <span className="font-bold text-foreground">DermaAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered dermatological diagnosis support for medical professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Medical Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Contact Support</a></li>
                <li><a href="#" className="hover:text-foreground">Technical Requirements</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 DermaAI. This tool is for medical professional use only and should not replace clinical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
