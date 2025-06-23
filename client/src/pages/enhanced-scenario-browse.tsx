import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ScenarioSelectionView } from "@/components/scenario-learning/ScenarioSelectionView";
import { ScenarioPracticeView } from "@/components/scenario-learning/ScenarioPracticeView";
import { EnhancedCard } from "@/components/EnhancedCard";
import { EnhancedButton } from "@/components/EnhancedButton";
import { ScenarioProgressManager } from "@/lib/scenario-learning/progress-manager";
import { Scenario } from "../../../shared/scenario-types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
// Avatar images are now served from /avatars/ directory as PNG files

type ViewMode = 'selection' | 'tutor-selection' | 'practice' | 'completion';

export default function EnhancedScenarioBrowse() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [practiceSessionId, setPracticeSessionId] = useState<string | null>(null);
  const [progressManager, setProgressManager] = useState<ScenarioProgressManager | null>(null);

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { personaId: number; scenarioId: number }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/chat/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user && (user as any)?.id) {
      setProgressManager(new ScenarioProgressManager((user as any).id.toString()));
    }
  }, [user]);

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setViewMode('tutor-selection');
  };

  const handleTutorSelect = (personaId: number) => {
    setSelectedPersonaId(personaId);
    setViewMode('practice');
  };

  const handlePracticeComplete = (sessionId: string, feedback: any) => {
    toast({
      title: "Great job!",
      description: `You completed ${feedback.completedGoals}/${feedback.totalGoals} goals and earned ${feedback.overallScore} XP!`,
    });

    setViewMode('completion');

    // Navigate back to dashboard after a delay
    setTimeout(() => {
      setLocation('/dashboard');
    }, 3000);
  };

  const handleExitPractice = () => {
    setViewMode('selection');
    setSelectedScenario(null);
    setSelectedPersonaId(null);
    setPracticeSessionId(null);
  };

  const getAvatarImage = (persona: any) => {
    return persona?.avatar_url || '/avatars/aoi.png';
  };

  const startTraditionalConversation = (personaId: number) => {
    if (selectedScenario) {
      createConversationMutation.mutate({
        personaId,
        scenarioId: 1, // Use default scenario ID for traditional mode
      });
    }
  };

  if (!user || !progressManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (viewMode === 'selection') {
                  setLocation('/dashboard');
                } else if (viewMode === 'tutor-selection') {
                  setViewMode('selection');
                  setSelectedScenario(null);
                } else {
                  handleExitPractice();
                }
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {viewMode === 'selection' && 'Scenario-Based Learning'}
                {viewMode === 'tutor-selection' && 'Choose Your Tutor'}
                {viewMode === 'practice' && selectedScenario?.title}
                {viewMode === 'completion' && 'Session Complete!'}
              </h1>
              {selectedScenario && viewMode !== 'selection' && (
                <p className="text-sm text-muted-foreground">
                  {selectedScenario.category} • {selectedScenario.level} • {selectedScenario.estimatedMinutes} min
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {viewMode === 'selection' && (
            <ScenarioSelectionView
              userId={(user as any)?.id?.toString() || ""}
              onScenarioSelect={handleScenarioSelect}
            />
          )}

          {viewMode === 'tutor-selection' && selectedScenario && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Scenario Info */}
              <EnhancedCard className="p-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">{selectedScenario.title}</h2>
                  <p className="text-muted-foreground">{selectedScenario.prompt}</p>
                  <div className="flex items-center justify-center space-x-4 pt-2">
                    <span className="text-sm text-muted-foreground">{selectedScenario.category}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{selectedScenario.level}</span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{selectedScenario.estimatedMinutes} minutes</span>
                  </div>
                </div>
              </EnhancedCard>

              {/* Tutor Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground text-center">Choose Your Learning Style</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {(personas as any[]).map((persona: any) => (
                    <EnhancedCard
                      key={persona.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30"
                      onClick={() => handleTutorSelect(persona.id)}
                    >
                      <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 mx-auto">
                          <img
                            src={getAvatarImage(persona)}
                            alt={persona.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-lg">{persona.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {persona.type === "teacher" ? "Formal Teacher Style" : "Casual Friend Style"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {persona.description ||
                            (persona.type === "teacher"
                              ? "Structured learning with cultural context and formal Japanese"
                              : "Relaxed conversation practice with friendly encouragement")}
                        </p>

                        {/* Personality & Speaking Style */}
                        {persona.personality && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Personality:</span>
                            <span className="text-xs text-gray-700 ml-1">{persona.personality}</span>
                          </div>
                        )}
                        {persona.speaking_style && (
                          <div className="mb-4">
                            <span className="text-xs font-medium text-gray-500">Style:</span>
                            <span className="text-xs text-gray-700 ml-1">{persona.speaking_style}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2">
                          <EnhancedButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTutorSelect(persona.id);
                            }}
                            className="flex-1 mr-2"
                          >
                            Start Scenario
                          </EnhancedButton>
                          <EnhancedButton
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              startTraditionalConversation(persona.id);
                            }}
                            className="flex-1 ml-2"
                          >
                            Free Chat
                          </EnhancedButton>
                        </div>
                      </div>
                    </EnhancedCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'practice' && selectedScenario && selectedPersonaId && (
            <div className="max-w-4xl mx-auto">
              <ScenarioPracticeView
                scenario={selectedScenario}
                personaId={selectedPersonaId}
                personaName={(personas as any[]).find((p: any) => p.id === selectedPersonaId)?.name || "Tutor"}
                userId={(user as any)?.id?.toString() || ""}
                onComplete={handlePracticeComplete}
                onExit={handleExitPractice}
              />
            </div>
          )}

          {viewMode === 'completion' && (
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <EnhancedCard className="p-8">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Excellent Work!</h2>
                  <p className="text-muted-foreground">
                    You've completed your scenario practice session. Your progress has been saved.
                  </p>
                  <div className="flex justify-center space-x-4 pt-4">
                    <EnhancedButton onClick={() => setLocation('/dashboard')}>
                      Return to Dashboard
                    </EnhancedButton>
                    <EnhancedButton 
                      variant="outline" 
                      onClick={() => {
                        setViewMode('selection');
                        setSelectedScenario(null);
                        setSelectedPersonaId(null);
                      }}
                    >
                      Try Another Scenario
                    </EnhancedButton>
                  </div>
                </div>
              </EnhancedCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}