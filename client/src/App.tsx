import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DiagnosisPage from "@/pages/diagnosis";
import CaseHistoryPage from "@/pages/case-history";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DiagnosisPage} />
      <Route path="/diagnosis" component={DiagnosisPage} />
      <Route path="/case-history" component={CaseHistoryPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
