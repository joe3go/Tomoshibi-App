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

  const { data: personas, isLoading: personasLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/progress"],
  });

  const { data: conversations } = useQuery({
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
    removeAuthToken();
    setLocation("/");
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
      <div className="min-h-screen flex items-center justify-center bg-deep-navy">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-lantern-orange border-l-transparent rounded-full animate-spin"></div>
            <span className="text-off-white">Loading...</span>
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-400 flex items-center justify-center">
            <span className="text-gray-900 font-bold">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-100">{user?.displayName || "User"}</h2>
            <p className="text-sm text-gray-400">JLPT N5 Learner</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2 text-gray-300 hover:bg-gray-700">
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {/* Start New Conversation */}
      <div className="mb-8 text-center">
        <Card className="bg-gray-800/80 border border-orange-500/20 shadow-2xl shadow-orange-500/5 max-w-md mx-auto">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">Ready to Practice?</h3>
            <p className="text-gray-300 mb-6">Choose your tutor and start a new conversation to improve your Japanese skills.</p>
            
            <Button 
              onClick={() => setLocation("/tutor-selection")}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-lg py-3 rounded-xl shadow-lg hover:shadow-orange-500/20 hover:scale-105 transition-all duration-300"
            >
              Start New Conversation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Continue Conversations Section */}
      {conversations && conversations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Continue Your Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.slice(0, 6).map((conversation: any) => {
              const persona = personas?.find((p: any) => p.id === conversation.personaId);
              const scenario = scenarios?.find((s: any) => s.id === conversation.scenarioId);
              
              return (
                <Card 
                  key={conversation.id} 
                  className="bg-gray-800 border-gray-700 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-orange-500/10"
                  onClick={() => setLocation(`/chat/${conversation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500/30 shadow-md">
                        <img 
                          src={getAvatarImage(persona)} 
                          alt={persona?.name || "Tutor"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-100 truncate">
                          {persona?.name || "Unknown Tutor"}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {scenario?.title || "Free Chat"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(conversation.updatedAt)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
        <Card className="bg-gray-800/80 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <span className="text-orange-500 text-lg">🗣️</span>
              </div>
              <h3 className="font-semibold text-gray-100">Conversations</h3>
            </div>
            <p className="text-2xl font-bold text-orange-500">
              {conversations?.length || 0}
            </p>
            <p className="text-sm text-gray-400">Total completed</p>
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
                      ? 'bg-lantern-orange/20 text-lantern-orange' 
                      : 'bg-sakura-blue/20 text-sakura-blue'
                  }`}>
                    {persona.type === 'teacher' ? 'Polite Form' : 'Casual Form'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    persona.type === 'teacher' 
                      ? 'bg-lantern-orange/20 text-lantern-orange' 
                      : 'bg-sakura-blue/20 text-sakura-blue'
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
