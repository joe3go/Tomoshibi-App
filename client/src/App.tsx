import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// Import pages directly for now to avoid routing conflicts
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import TutorSelection from "@/pages/tutor-selection";
import ScenarioSelection from "@/pages/scenario-selection";
import FuriganaDemo from "@/pages/furigana-demo";
import Transcripts from "@/pages/transcripts";
import Vocabulary from "@/pages/vocabulary";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import ScenarioBrowse from "@/pages/scenario-browse";

const Router: React.FC = React.memo(() => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Initializing application..." />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/tutor-selection" component={TutorSelection} />
          <Route path="/scenario-selection/:personaId" component={ScenarioSelection} />
          <Route path="/chat/:conversationId" component={Chat} />
          <Route path="/furigana-demo" component={FuriganaDemo} />
          <Route path="/transcripts" component={Transcripts} />
          <Route path="/history" component={History} />
          <Route path="/vocabulary" component={Vocabulary} />
          <Route path="/settings" component={Settings} />
          <Route path="/scenarios" component={ScenarioBrowse} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
});

Router.displayName = 'Router';

const App: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="dark min-h-screen bg-background">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
