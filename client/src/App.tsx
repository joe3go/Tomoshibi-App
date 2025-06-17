import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
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
import MyVocabulary from "@/pages/my-vocabulary";
import VocabularyAnalytics from "@/pages/VocabularyAnalytics";
import ConjugationDemo from "@/pages/ConjugationDemo";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import ScenarioBrowse from "@/pages/scenario-browse";
import EnhancedScenarioBrowse from "@/pages/enhanced-scenario-browse";
import VocabTest from "@/pages/vocab-test";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="md" />;
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
          <Route path="/my-vocabulary" component={MyVocabulary} />
          <Route path="/vocabulary-analytics" component={VocabularyAnalytics} />
          <Route path="/conjugation-demo" component={ConjugationDemo} />
          <Route path="/vocab-test" component={VocabTest} />
          <Route path="/settings" component={Settings} />
          <Route path="/scenarios" component={ScenarioBrowse} />
          <Route path="/scenario-learning" component={EnhancedScenarioBrowse} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen bg-background">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
