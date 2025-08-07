import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Incidents from "@/pages/incidents";
import Alerts from "@/pages/alerts";
import Sources from "@/pages/sources";
import Analytics from "@/pages/analytics";
import Feedback from "@/pages/feedback";
import { cn } from "@/lib/utils";

function Router() {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connectionStatus } = useRealtimeUpdates();

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'incidents':
        return <Incidents />;
      case 'alerts':
        return <Alerts />;
      case 'sources':
        return <Sources />;
      case 'analytics':
        return <Analytics />;
      case 'feedback':
        return <Feedback />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64 bg-slate-800 border-r border-slate-700">
        <Sidebar
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
            data-testid="mobile-backdrop"
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-800 shadow-xl">
            <Sidebar
              currentSection={currentSection}
              onSectionChange={handleSectionChange}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          connectionStatus={connectionStatus}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-4 lg:p-8">
          <div className="space-y-6 animate-fade-in">
            {renderCurrentSection()}
          </div>
        </main>
      </div>
    </div>
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
