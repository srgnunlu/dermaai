import { Switch, Route } from 'wouter';
import { lazy, Suspense } from 'react';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

// Lazy load pages for code splitting and better performance
const Landing = lazy(() => import('@/pages/landing'));
const DiagnosisPage = lazy(() => import('@/pages/diagnosis'));
const CaseHistoryPage = lazy(() => import('@/pages/case-history'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const AdminPage = lazy(() => import('@/pages/admin'));
const AnalyticsPage = lazy(() => import('@/pages/analytics'));
const DermatologistPage = lazy(() => import('@/pages/dermatologist'));
const PrivacyPolicyPage = lazy(() => import('@/pages/privacy-policy'));
const TermsOfServicePage = lazy(() => import('@/pages/terms-of-service'));
const MedicalDisclaimerPage = lazy(() => import('@/pages/medical-disclaimer'));
const DocumentationPage = lazy(() => import('@/pages/documentation'));
const ContactSupportPage = lazy(() => import('@/pages/contact-support'));
const TechnicalRequirementsPage = lazy(() => import('@/pages/technical-requirements'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />
          <Route path="/terms-of-service" component={TermsOfServicePage} />
          <Route path="/medical-disclaimer" component={MedicalDisclaimerPage} />
          <Route path="/documentation" component={DocumentationPage} />
          <Route path="/contact-support" component={ContactSupportPage} />
          <Route path="/technical-requirements" component={TechnicalRequirementsPage} />
          {isLoading || !isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <>
              <Route path="/" component={DiagnosisPage} />
              <Route path="/diagnosis" component={DiagnosisPage} />
              <Route path="/case-history" component={CaseHistoryPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/dermatologist" component={DermatologistPage} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
