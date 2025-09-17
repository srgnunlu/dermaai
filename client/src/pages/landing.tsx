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
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.location.href = "/api/auth/google"}
              data-testid="button-google-login"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-8 py-4 text-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-local-login"
              className="px-8 py-4 text-lg"
            >
              Local Login
            </Button>
          </div>
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