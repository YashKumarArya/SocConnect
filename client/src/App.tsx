import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Investigation from "@/pages/investigation";
import AIAssistant from "@/pages/ai-assistant";
import AdminPanel from "@/pages/admin-panel";
import AlertManagement from "@/pages/alert-management";
import ThreatIntelligence from "@/pages/threat-intel";
import AnalyticsReports from "@/pages/analytics-reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/investigation" component={Investigation} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/alerts" component={AlertManagement} />
      <Route path="/threat-intel" component={ThreatIntelligence} />
      <Route path="/analytics" component={AnalyticsReports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;