import { Switch, Route, useLocation } from 'wouter';
import { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageTransition from '@/components/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load pages for code splitting and better performance
const Landing = lazy(() => import('@/pages/landing'));
const DiagnosisPage = lazy(() => import('@/pages/diagnosis'));
const CaseHistoryPage = lazy(() => import('@/pages/case-history'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const AdminPage = lazy(() => import('@/pages/admin'));
const AnalyticsPage = lazy(() => import('@/pages/analytics'));
const DermatologistPage = lazy(() => import('@/pages/dermatologist'));
const ResearchAnalyticsPage = lazy(() => import('@/pages/research-analytics'));
const PrivacyPolicyPage = lazy(() => import('@/pages/privacy-policy'));
const TermsOfServicePage = lazy(() => import('@/pages/terms-of-service'));
const MedicalDisclaimerPage = lazy(() => import('@/pages/medical-disclaimer'));
const DocumentationPage = lazy(() => import('@/pages/documentation'));
const ContactSupportPage = lazy(() => import('@/pages/contact-support'));
const TechnicalRequirementsPage = lazy(() => import('@/pages/technical-requirements'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Skeleton fallback shown while a lazy page chunk loads — consistent with the
// in-page skeletons used across the app (no bare spinners).
function PageLoader() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  return (
    <>
      <Header />
      {/* Bottom padding leaves room for the fixed mobile tab bar; cleared on desktop */}
      <main className="pb-20 md:pb-0">
        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location}>
              <Suspense fallback={<PageLoader />}>
                <Switch location={location}>
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
                      <Route path="/research-analytics" component={ResearchAnalyticsPage} />
                    </>
                  )}
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      <BottomNav />
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
