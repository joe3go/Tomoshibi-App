
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Coffee, ShoppingCart, Users, Briefcase, MapPin, Heart, Camera, Utensils } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import harukiAvatar from "@assets/harukiavatar_1750137453243.png";
import aoiAvatar from "@assets/aoiavatar_1750137453242.png";

export default function ScenarioBrowse() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showTutorSelection, setShowTutorSelection] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

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
      setLoadingConversation(false);
      setLocation(`/chat/${data.id}`);
    },
    onError: (error) => {
      setLoadingConversation(false);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getScenarioIcon = (title: string) => {
    if (title.includes("Introduction")) return Users;
    if (title.includes("Shopping")) return ShoppingCart;
    if (title.includes("Restaurant") || title.includes("Food")) return Utensils;
    if (title.includes("Directions") || title.includes("Travel")) return MapPin;
    if (title.includes("Work") || title.includes("Business")) return Briefcase;
    if (title.includes("Hobbies")) return Heart;
    if (title.includes("Weather")) return Camera;
    return MessageCircle;
  };

  const handleScenarioSelect = (scenario: any) => {
    setSelectedScenario(scenario);
    setShowTutorSelection(true);
  };

  const handleTutorSelect = (personaId: number) => {
    if (selectedScenario) {
      setLoadingConversation(true);
      createConversationMutation.mutate({
        personaId,
        scenarioId: selectedScenario.id,
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'n5':
        return 'scenario-difficulty-n5';
      case 'elementary':
      case 'n4':
        return 'scenario-difficulty-n4';
      case 'intermediate':
      case 'n3':
        return 'scenario-difficulty-n3';
      case 'upper intermediate':
      case 'n2':
        return 'scenario-difficulty-n2';
      case 'advanced':
      case 'n1':
        return 'scenario-difficulty-n1';
      default:
        return 'scenario-difficulty-default';
    }
  };

  if (isLoading) {
    return (
      <div className="scenario-browse-page-container">
        <div className="scenario-browse-content-wrapper">
          <div className="scenario-browse-loading-container">
            <div className="scenario-browse-loading-content">
              <div className="scenario-browse-loading-spinner"></div>
              <p className="scenario-browse-loading-text">Loading scenarios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showTutorSelection) {
    return (
      <div className="scenario-browse-page-container">
        <div className="scenario-browse-content-wrapper">
          <div className="tutor-selection-header">
            <Button
              variant="ghost"
              onClick={() => setShowTutorSelection(false)}
              className="tutor-selection-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scenarios
            </Button>
            <div className="tutor-selection-intro">
              <h1 className="tutor-selection-title">Choose Your Tutor</h1>
              <p className="tutor-selection-description">
                Select a tutor for: <span className="tutor-selection-scenario-name">{selectedScenario?.title}</span>
              </p>
            </div>
          </div>

          <div className="tutor-selection-grid">
            {Array.isArray(personas) && personas.map((persona: any) => {
              const avatar = persona.name === 'Aoi' ? aoiAvatar : harukiAvatar;
              
              return (
                <Card key={persona.id} className="tutor-selection-card">
                  <CardHeader className="tutor-selection-card-header">
                    <div className="tutor-selection-avatar">
                      <img 
                        src={avatar} 
                        alt={persona.name}
                        className="tutor-selection-avatar-image"
                      />
                    </div>
                    <CardTitle className="tutor-selection-card-title">{persona.name}</CardTitle>
                    <Badge variant="secondary" className="tutor-selection-type-badge">
                      {persona.type === 'teacher' ? 'Teacher' : 'Friend'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="tutor-selection-card-content">
                    <p className="tutor-selection-description">
                      {persona.description || `An experienced ${persona.type} specializing in ${persona.jlptLevel} level conversations.`}
                    </p>
                    <Button
                      onClick={() => handleTutorSelect(persona.id)}
                      disabled={loadingConversation}
                      className="tutor-selection-chat-button"
                    >
                      {loadingConversation ? 'Starting Chat...' : `Chat with ${persona.name}`}
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

  return (
    <div className="scenario-browse-page-container">
      <div className="scenario-browse-content-wrapper">
        <div className="scenario-browse-header">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="scenario-browse-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="scenario-browse-intro">
            <h1 className="scenario-browse-title">Browse Scenarios</h1>
            <p className="scenario-browse-description">
              Choose a conversation scenario and then select your preferred tutor
            </p>
          </div>
        </div>

        <div className="scenario-browse-grid">
          {Array.isArray(scenarios) && scenarios.map((scenario: any) => {
            const IconComponent = getScenarioIcon(scenario.title);
            
            return (
              <Card 
                key={scenario.id} 
                className="scenario-card"
                onClick={() => handleScenarioSelect(scenario)}
              >
                <CardHeader className="scenario-card-header">
                  <div className="scenario-card-header-top">
                    <div className="scenario-icon-container">
                      <IconComponent className="scenario-icon" />
                    </div>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty || 'N5'}
                    </Badge>
                  </div>
                  <CardTitle className="scenario-card-title">
                    {scenario.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="scenario-description">
                    {scenario.description}
                  </p>
                  
                  {scenario.learningGoals && (
                    <div className="scenario-learning-goals">
                      <h4 className="scenario-learning-goals-title">Learning Goals:</h4>
                      <div className="scenario-learning-goals-list">
                        {scenario.learningGoals.slice(0, 3).map((goal: string, index: number) => (
                          <Badge key={index} variant="outline" className="scenario-goal-badge">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="scenario-select-button"
                    variant="outline"
                  >
                    Select Scenario
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Array.isArray(scenarios) && scenarios.length === 0 && (
          <div className="scenario-browse-empty-state">
            <MessageCircle className="scenario-browse-empty-icon" />
            <h3 className="scenario-browse-empty-title">No scenarios available</h3>
            <p className="scenario-browse-empty-description">Check back later for new conversation scenarios.</p>
          </div>
        )}
      </div>
    </div>
  );
}
