import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Coffee, ShoppingCart, Users, Briefcase, MapPin, Heart, Camera, Utensils } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

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
        return 'bg-green-100 text-green-800';
      case 'elementary':
      case 'n4':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
      case 'n3':
        return 'bg-yellow-100 text-yellow-800';
      case 'upper intermediate':
      case 'n2':
        return 'bg-orange-100 text-orange-800';
      case 'advanced':
      case 'n1':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading scenarios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showTutorSelection) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setShowTutorSelection(false)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scenarios
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Choose Your Tutor</h1>
              <p className="text-muted-foreground mb-4">
                Select a tutor for: <span className="font-semibold text-primary">{selectedScenario?.title}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(personas) && personas.map((persona: any) => {
              const avatar = persona.name === 'Aoi' ? aoiAvatar : harukiAvatar;
              
              return (
                <Card key={persona.id} className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                  <CardHeader className="text-center pb-4">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                      <img 
                        src={avatar} 
                        alt={persona.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="text-xl">{persona.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit mx-auto">
                      {persona.type === 'teacher' ? 'Teacher' : 'Friend'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      {persona.description || `An experienced ${persona.type} specializing in ${persona.jlptLevel} level conversations.`}
                    </p>
                    <Button
                      onClick={() => handleTutorSelect(persona.id)}
                      disabled={loadingConversation}
                      className="w-full"
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Browse Scenarios</h1>
            <p className="text-muted-foreground">
              Choose a conversation scenario and then select your preferred tutor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(scenarios) && scenarios.map((scenario: any) => {
            const IconComponent = getScenarioIcon(scenario.title);
            
            return (
              <Card 
                key={scenario.id} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/20"
                onClick={() => handleScenarioSelect(scenario)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty || 'N5'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {scenario.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {scenario.description}
                  </p>
                  
                  {scenario.learningGoals && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Learning Goals:</h4>
                      <div className="flex flex-wrap gap-1">
                        {scenario.learningGoals.slice(0, 3).map((goal: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
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
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scenarios available</h3>
            <p className="text-muted-foreground">Check back later for new conversation scenarios.</p>
          </div>
        )}
      </div>
    </div>
  );
}