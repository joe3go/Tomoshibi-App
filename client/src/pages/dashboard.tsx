import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { removeAuthToken } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, LogOut, MessageCircle, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import harukiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";
import aoiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";


export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: personas = [], isLoading: personasLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const { data: progress = {} } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ personaId, scenarioId }: { personaId: number; scenarioId: number }) => {
      const response = await apiRequest("POST", "/api/conversations", {
        personaId,
        scenarioId,
      });
      return await response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setLocation(`/chat/${conversation.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    // Clear session data
    removeAuthToken();
    // Clear React Query cache
    queryClient.clear();
    // Clear any localStorage items
    localStorage.clear();
    // Route to landing page
    window.location.href = "/";
  };

  const getAvatarImage = (persona: any) => {
    if (persona?.type === 'teacher') return harukiAvatar;
    if (persona?.type === 'friend') return aoiAvatar;
    return null;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const startScenario = (scenarioId: number, personaId: number = 1) => {
    createConversationMutation.mutate({ personaId, scenarioId });
  };

  if (personasLoading || scenariosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary border-l-transparent rounded-full animate-spin"></div>
            <span className="text-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-background font-bold">
              {(user as any)?.displayName?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{(user as any)?.displayName || "User"}</h2>
            <p className="text-sm text-muted-foreground">JLPT N5 Learner</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:bg-muted">
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {/* Start New Conversation */}
      <div className="mb-8 text-center">
        <Card className="bg-card/80 border border-primary/20 shadow-2xl shadow-primary/5 max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-background" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Practice?</h3>
            <p className="text-muted-foreground mb-6">Choose your tutor and start a new conversation to improve your Japanese skills.</p>
            
            <Button 
              onClick={() => setLocation("/tutor-selection")}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold text-lg py-3 rounded-xl shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300"
            >
              Start New Conversation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Continue Conversations Section */}
      {Array.isArray(conversations) && conversations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            Continue Your Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.slice(0, 6).map((conversation: any) => {
              const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === conversation.personaId) : null;
              const scenario = Array.isArray(scenarios) ? scenarios.find((s: any) => s.id === conversation.scenarioId) : null;
              
              return (
                <Card 
                  key={conversation.id} 
                  className="bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-primary/10"
                  onClick={() => setLocation(`/chat/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                        <img 
                          src={getAvatarImage(persona) || ""} 
                          alt={persona?.name || "Tutor"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {persona?.name || "Unknown Tutor"}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {scenario?.title || "Free Chat"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(conversation.updatedAt)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card/80 border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-lg">🗣️</span>
              </div>
              <h3 className="font-semibold text-foreground">Conversations</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {Array.isArray(conversations) ? conversations.length : 0}
            </p>
            <p className="text-sm text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/80 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-500 text-lg font-japanese">漢</span>
              </div>
              <h3 className="font-semibold text-gray-100">Vocabulary</h3>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {progress?.vocabEncountered?.length || 0}
            </p>
            <p className="text-sm text-gray-400">Words learned</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/80 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-500 text-lg">🏮</span>
              </div>
              <h3 className="font-semibold text-gray-100">Journey</h3>
            </div>
            <p className="text-2xl font-bold text-amber-500">
              {scenarios?.length || 0}/10
            </p>
            <p className="text-sm text-gray-400">Scenarios unlocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Persona Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-100">
          <span className="mr-2">👥</span>
          Choose Your Conversation Partner
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas?.map((persona: any) => (
            <Card key={persona.id} className="bg-gray-800/80 border-gray-700 hover:border-orange-500/30 cursor-pointer group transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    persona.type === 'teacher' 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    <span className="text-2xl">
                      {persona.type === 'teacher' ? '👩‍🏫' : '🧑‍🎤'}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${
                      persona.type === 'teacher' ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {persona.name}
                    </h4>
                    <p className="text-sm text-gray-300">
                      {persona.type === 'teacher' ? 'Formal Teacher' : 'Casual Friend'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">{persona.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    persona.type === 'teacher' 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {persona.type === 'teacher' ? 'Polite Form' : 'Casual Form'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    persona.type === 'teacher' 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {persona.type === 'teacher' ? 'Detailed' : 'Natural'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}

function getScenarioJapanese(title: string): string {
  const translations: Record<string, string> = {
    "Self-Introduction": "自己紹介",
    "Ordering Food": "レストランで注文",
    "Shopping": "服を買う",
    "Asking for Directions": "道を聞く",
    "Family Talk": "家族について",
    "Daily Schedule": "一日のスケジュール",
    "Weather Conversation": "天気の話",
    "Hobbies Discussion": "趣味について",
    "School/Work Talk": "学校・仕事の話",
    "Making Weekend Plans": "週末の予定",
  };
  return translations[title] || title;
}
