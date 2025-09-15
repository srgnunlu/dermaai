import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Shield, Brain, Clock, FileText, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Stethoscope className="h-16 w-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Medical Diagnosis
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Advanced dermatological analysis using state-of-the-art AI models to assist healthcare professionals in diagnosis
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Sign In with Replit
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card data-testid="card-feature-ai">
            <CardHeader>
              <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
              <CardTitle>Dual AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Leverages both Google Gemini and OpenAI models for comprehensive and accurate diagnosis with confidence scores
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-security">
            <CardHeader>
              <Shield className="h-10 w-10 text-green-600 dark:text-green-400 mb-2" />
              <CardTitle>Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                HIPAA-compliant data handling with encrypted storage and user authentication to protect patient information
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-reports">
            <CardHeader>
              <FileText className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-2" />
              <CardTitle>Detailed Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate comprehensive PDF reports with diagnosis results, recommendations, and urgency indicators
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-history">
            <CardHeader>
              <Clock className="h-10 w-10 text-orange-600 dark:text-orange-400 mb-2" />
              <CardTitle>Case History</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track and review all previous cases with complete analysis history and patient information
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-patient">
            <CardHeader>
              <Users className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-2" />
              <CardTitle>Patient Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Efficiently manage patient records with detailed medical history and demographic information
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="card-feature-urgent">
            <CardHeader>
              <Shield className="h-10 w-10 text-red-600 dark:text-red-400 mb-2" />
              <CardTitle>Urgency Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically identifies conditions requiring immediate medical attention with clear visual indicators
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-blue-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Sign in with your Replit account to access the full diagnostic platform
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-get-started"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}