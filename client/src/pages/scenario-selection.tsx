
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Coffee, ShoppingCart, Users, Briefcase } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Avatar images are now served from /avatars/ directory as PNG files

export default function ScenarioSelection() {
  const [, params] = useRoute("/scenario-selection/:personaId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const personaId = params?.personaId || "";
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { personaId: string; scenarioId?: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLoadingScenario(null);
      setLocation(`/chat/${data.id}`);
    },
    onError: (error) => {
      setLoadingScenario(null);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === personaId) : null;

  const getScenarioIcon = (title: string) => {
    if (title.includes("Introduction")) return Users;
    if (title.includes("Restaurant") || title.includes("Food")) return Coffee;
    if (title.includes("Shopping")) return ShoppingCart;
    if (title.includes("Work") || title.includes("Business")) return Briefcase;
    return MessageCircle;
  };

  const handleScenarioSelect = (scenarioId: string) => {
    console.log('🎯 Scenario selection - persona ID:', personaId, 'scenario ID:', scenarioId);
    console.log('🎯 ID types - persona:', typeof personaId, 'scenario:', typeof scenarioId);
    
    // Validate UUID format for persona
    if (!personaId || typeof personaId !== 'string' || personaId.length < 32) {
      console.error('❌ Invalid persona ID in scenario selection:', personaId);
      return;
    }
    
    setLoadingScenario(scenarioId);
    createConversationMutation.mutate({ personaId, scenarioId });
  };

  const handleFreeChat = () => {
    console.log('🎯 Free chat - persona ID:', personaId, 'Type:', typeof personaId);
    
    // Validate UUID format for persona
    if (!personaId || typeof personaId !== 'string' || personaId.length < 32) {
      console.error('❌ Invalid persona ID in free chat:', personaId);
      return;
    }
    
    setLoadingScenario("free-chat");
    createConversationMutation.mutate({ personaId });
  };

  const getAvatarImage = (persona: any) => {
    return persona?.avatar_url || '/avatars/aoi.png';
  };

  if (isLoading) {
    return (
      <div className="scenario-selection-loading-container">
        <div className="scenario-selection-loading-card">
          <div className="scenario-selection-loading-content">
            <div className="scenario-selection-loading-spinner"></div>
            <span className="scenario-selection-loading-text">Loading scenarios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scenario-selection-page-container">
      {/* Header */}
      <header className="scenario-selection-header">
        <div className="scenario-selection-navigation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/tutor-selection")}
            className="scenario-selection-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="scenario-selection-page-title">Choose a Scenario</h1>
        </div>
      </header>

      <div className="scenario-selection-content-container">
        {/* Selected Tutor Info */}
        {persona && (
          <Card className="scenario-selection-tutor-info">
            <CardContent className="scenario-selection-tutor-content">
              <div className="scenario-selection-tutor-avatar">
                <img 
                  src={getAvatarImage(persona)} 
                  alt={persona.name}
                  className="scenario-selection-tutor-image w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="scenario-selection-tutor-name">
                  Learning with {persona.name} {persona.type === 'teacher' ? '(陽輝)' : '(葵)'}
                </h3>
                <p className="scenario-selection-tutor-type">
                  {persona.type === 'teacher' ? 'Formal Teacher' : 'Friendly Tutor'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="scenario-selection-intro">
          <h2 className="scenario-selection-main-title">What would you like to practice?</h2>
          <p className="scenario-selection-main-description">Choose a conversation scenario or start with free chat.</p>
        </div>

        {/* Free Chat Option */}
        <Card className="scenario-selection-free-chat-card" onClick={handleFreeChat}>
          <CardContent className="scenario-selection-free-chat-content">
            <div className="scenario-selection-free-chat-icon">
              <MessageCircle className="w-8 h-8 text-deep-navy" />
            </div>
            <h3 className="scenario-selection-free-chat-title">Free Chat</h3>
            <p className="scenario-selection-free-chat-description">
              Open conversation without specific topics. Perfect for exploring your interests.
            </p>
            <Button 
              variant="outline" 
              className="scenario-selection-free-chat-button"
              disabled={loadingScenario === "free-chat"}
              onClick={(e) => {
                e.stopPropagation();
                handleFreeChat();
              }}
            >
              {loadingScenario === "free-chat" ? "Starting..." : "Start Free Chat"}
            </Button>
          </CardContent>
        </Card>

        {/* Scenario Grid */}
        <div className="scenario-selection-scenarios-grid">
          {Array.isArray(scenarios) && scenarios.map((scenario: any) => {
            const IconComponent = getScenarioIcon(scenario.title);
            return (
              <Card 
                key={scenario.id} 
                className="scenario-selection-scenario-card"
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                <CardContent className="scenario-selection-scenario-content">
                  <div className="scenario-selection-scenario-icon">
                    <IconComponent className="w-6 h-6 text-deep-navy" />
                  </div>
                  
                  <h3 className="scenario-selection-scenario-title">{scenario.title}</h3>
                  <p className="scenario-selection-scenario-description">
                    {scenario.description}
                  </p>
                  
                  <Button 
                    size="sm"
                    className="scenario-selection-scenario-button"
                    disabled={loadingScenario === scenario.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScenarioSelect(scenario.id);
                    }}
                  >
                    {loadingScenario === scenario.id ? "Starting..." : "Start Practice"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
