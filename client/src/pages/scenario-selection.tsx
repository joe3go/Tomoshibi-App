import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, MessageCircle, Coffee, ShoppingCart, Users, Briefcase } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import harukiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";
import aoiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";

export default function ScenarioSelection() {
  const [, params] = useRoute("/scenario-selection/:personaId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const personaId = parseInt(params?.personaId || "0");

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (data: { personaId: number; scenarioId?: number }) => {
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

  const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === personaId) : null;

  const getScenarioIcon = (title: string) => {
    if (title.includes("Introduction")) return Users;
    if (title.includes("Restaurant") || title.includes("Food")) return Coffee;
    if (title.includes("Shopping")) return ShoppingCart;
    if (title.includes("Work") || title.includes("Business")) return Briefcase;
    return MessageCircle;
  };

  const handleScenarioSelect = (scenarioId: number) => {
    createConversationMutation.mutate({ personaId, scenarioId });
  };

  const handleFreeChat = () => {
    createConversationMutation.mutate({ personaId });
  };

  const getAvatarImage = (persona: any) => {
    if (persona?.type === 'teacher') return harukiAvatar;
    if (persona?.type === 'friend') return aoiAvatar;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-navy">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-lantern-orange border-l-transparent rounded-full animate-spin"></div>
            <span className="text-off-white">Loading scenarios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-navy p-4">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/tutor-selection")}
            className="p-2 text-off-white hover:bg-kanji-glow"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-off-white">Choose a Scenario</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Selected Tutor Info */}
        {persona && (
          <Card className="glass-card border-glass-border mb-8">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-lantern-orange/30">
                <img 
                  src={getAvatarImage(persona)} 
                  alt={persona.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-off-white">
                  Learning with {persona.name} {persona.type === 'teacher' ? '(陽輝)' : '(葵)'}
                </h3>
                <p className="text-off-white/70 text-sm">
                  {persona.type === 'teacher' ? 'Formal Teacher' : 'Friendly Tutor'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-off-white mb-2">What would you like to practice?</h2>
          <p className="text-off-white/70">Choose a conversation scenario or start with free chat.</p>
        </div>

        {/* Free Chat Option */}
        <Card className="glass-card border-glass-border hover:border-sakura-blue/30 transition-all duration-300 mb-6 cursor-pointer group" onClick={handleFreeChat}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sakura-blue to-lantern-orange rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-8 h-8 text-deep-navy" />
            </div>
            <h3 className="text-xl font-semibold text-off-white mb-2">Free Chat</h3>
            <p className="text-off-white/70 mb-4">
              Open conversation without specific topics. Perfect for exploring your interests.
            </p>
            <Button 
              variant="outline" 
              className="border-sakura-blue/50 text-sakura-blue hover:bg-sakura-blue/10"
              disabled={createConversationMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleFreeChat();
              }}
            >
              {createConversationMutation.isPending ? "Starting..." : "Start Free Chat"}
            </Button>
          </CardContent>
        </Card>

        {/* Scenario Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios?.map((scenario: any) => {
            const IconComponent = getScenarioIcon(scenario.title);
            return (
              <Card 
                key={scenario.id} 
                className="glass-card border-glass-border hover:border-lantern-orange/30 transition-all duration-300 cursor-pointer group"
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-lantern-orange to-sakura-blue rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-deep-navy" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-off-white mb-2">{scenario.title}</h3>
                  <p className="text-off-white/70 text-sm mb-4 leading-relaxed">
                    {scenario.description}
                  </p>
                  
                  <Button 
                    size="sm"
                    className="gradient-button w-full group-hover:scale-105 transition-transform duration-300"
                    disabled={createConversationMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScenarioSelect(scenario.id);
                    }}
                  >
                    {createConversationMutation.isPending ? "Starting..." : "Start Practice"}
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