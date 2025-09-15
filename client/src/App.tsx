import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Landing from "@/pages/landing";
import DiagnosisPage from "@/pages/diagnosis";
import CaseHistoryPage from "@/pages/case-history";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Header />
      <Switch>
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
          </>
        )}
        <Route component={NotFound} />
      </Switch>
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
