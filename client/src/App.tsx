import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Chat from "@/pages/chat";
import GroupChat from "@/pages/group-chat";
import TutorSelection from "@/pages/tutor-selection";
import ScenarioSelection from "@/pages/scenario-selection";
import Vocabulary from "@/pages/vocabulary";
import VocabularyComprehensive from "@/pages/vocabulary-comprehensive";
import MyVocabulary from "@/pages/my-vocabulary";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import PracticeGroups from "@/pages/practice-groups";
import NotFound from "@/pages/not-found";
import TestFuriganaPage from "@/pages/test-furigana-page";
import TestFurigana from "@/pages/test-furigana";

// Create a single QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <Router>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/login" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/chat/:conversationId" component={Chat} />
            <Route path="/group-chat/:conversationId" component={GroupChat} />
            <Route path="/tutors" component={TutorSelection} />
            <Route path="/tutor-selection" component={TutorSelection} />
            <Route path="/scenarios" component={ScenarioSelection} />
            <Route path="/scenario-selection" component={ScenarioSelection} />
            <Route path="/vocabulary" component={Vocabulary} />
            <Route path="/vocabulary-comprehensive" component={VocabularyComprehensive} />
            <Route path="/my-vocabulary" component={MyVocabulary} />
            <Route path="/history" component={History} />
            <Route path="/settings" component={Settings} />
            <Route path="/practice-groups" component={PracticeGroups} />
            <Route component={NotFound} />
          </Switch>
        </Router>
        <Toaster />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}