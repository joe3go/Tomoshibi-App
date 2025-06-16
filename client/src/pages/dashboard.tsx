import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, LogOut, MessageCircle, User, Calendar, BookOpen, History, TrendingUp, Award, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

// Import our reusable components
import { EnhancedButton } from "@/components/EnhancedButton";
import { EnhancedCard } from "@/components/EnhancedCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import DashboardHeader from "@/components/DashboardHeader";
import { 
  VocabProgressRings, 
  MiniVocabHeatmap, 
  JLPTLevelComparison, 
  WordSpotlightCarousel, 
  KnownVsUsedGap 
} from "@/components/VocabAnalytics";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState((user as any)?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [soundNotifications, setSoundNotifications] = useState((user as any)?.soundNotifications ?? true);
  const [desktopNotifications, setDesktopNotifications] = useState((user as any)?.desktopNotifications ?? true);

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Fetch scenarios
  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  // Fetch personas
  const { data: personas, isLoading: personasLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  // Fetch progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  // Fetch vocabulary tracker data
  const { data: vocabData = [] } = useQuery({
    queryKey: ['/api/vocab-tracker'],
  });

  // Filter conversations for different sections with proper status checking
  const activeConversations = Array.isArray(conversations) 
    ? conversations.filter((c: any) => c.status === 'active' || !c.status)
    : [];

  const completedConversations = Array.isArray(conversations) 
    ? conversations.filter((c: any) => c.status === 'completed')
    : [];

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Clear all authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.clear();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getScenarioJapanese = (title: string): string => {
    const scenarios: Record<string, string> = {
      "Self-Introduction": "自己紹介",
      Shopping: "買い物",
      Restaurant: "レストラン",
      Directions: "道案内",
      Weather: "天気",
      Family: "家族",
      Hobbies: "趣味",
      Work: "仕事",
      Travel: "健康",
    };
    return scenarios[title] || title;
  };

  const getProgressionLabel = () => {
    const vocabCount = (vocabData as any[]).length;
    const completedCount = (completedConversations as any[]).length;
    const totalInteractions = vocabCount + completedCount;

    if (totalInteractions >= 100) return "🌸 Sakura Scholar";
    if (totalInteractions >= 75) return "🗾 Island Explorer";
    if (totalInteractions >= 50) return "🏮 Lantern Bearer";
    if (totalInteractions >= 25) return "🌱 Bamboo Sprout";
    if (totalInteractions >= 10) return "📚 Study Starter";
    return "🌟 Rising Sun";
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/users/${(user as any)?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setSettingsOpen(false);
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const { profileImageUrl } = await response.json();
        updateProfileMutation.mutate({ profileImageUrl });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // End conversation mutation with enhanced JWT authentication
  const endConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "completed",
          completedAt: new Date().toISOString(),
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          setLocation('/');
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/completed"] });
      toast({
        title: "Session Ended",
        description: "Your conversation has been successfully completed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to End Session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEndSessionDashboard = (conversationId: number) => {
    endConversationMutation.mutate(conversationId);
  };

  const handleSaveSettings = () => {
    const updates: any = {
      displayName,
      soundNotifications,
      desktopNotifications
    };

    if (newPassword.trim()) {
      updates.password = newPassword;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleSendFeedback = () => {
    const emailUrl = `mailto:feedback@tomoshibiapp.com?subject=Tomoshibi App Feedback&body=Hi team,%0A%0AI'd like to share some feedback about the app:%0A%0A`;
    window.open(emailUrl, '_blank');
  };

  if (
    conversationsLoading ||
    scenariosLoading ||
    personasLoading ||
    progressLoading
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <DashboardHeader 
          user={user}
          progressionLabel={getProgressionLabel()}
          onLogout={handleLogout}
        />

        {/* Continue Conversations Section */}
        {activeConversations.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary">
                Continue Learning
              </h3>
              <EnhancedButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/history")}
                className="text-muted-foreground hover:text-primary"
              >
                See more
              </EnhancedButton>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {activeConversations.slice(0, 3).map((conversation: any) => {
                const persona = Array.isArray(personas)
                  ? personas.find((p: any) => p.id === conversation.personaId)
                  : null;
                const scenario = Array.isArray(scenarios)
                  ? scenarios.find((s: any) => s.id === conversation.scenarioId)
                  : null;

                const formatDate = (dateString: string) => {
                  if (!dateString) return "Recent";
                  try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return "Recent";
                    return date.toLocaleDateString();
                  } catch {
                    return "Recent";
                  }
                };

                return (
                  <EnhancedCard
                    key={conversation.id}
                    className="group"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="avatar flex-shrink-0">
                        {persona?.name === 'Aoi' ? (
                          <img 
                            src={aoiAvatar} 
                            alt="Aoi" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : persona?.name === 'Haruki' ? (
                          <img 
                            src={harukiAvatar} 
                            alt="Haruki" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="font-japanese">
                            {persona?.type === "teacher" ? "先" : "友"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-primary">
                          {persona?.name || "Unknown"}
                        </h4>
                        <p className="text-sm text-foreground">
                          {scenario?.title || "Practice Session"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="status-tag in-progress">
                        {conversation.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(conversation.startedAt || conversation.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {conversation.status === 'active' ? (
                        <>
                          <EnhancedButton
                            size="sm"
                            onClick={() => setLocation(`/chat/${conversation.id}`)}
                            className="flex-1"
                          >
                            Continue
                          </EnhancedButton>
                          <EnhancedButton
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEndSessionDashboard(conversation.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            End
                          </EnhancedButton>
                        </>
                      ) : (
                        <EnhancedButton
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/chat/${conversation.id}`)}
                          className="flex-1"
                        >
                          View
                        </EnhancedButton>
                      )}
                    </div>
                  </EnhancedCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Vocabulary Usage Analytics */}
        <div className="space-y-6 mb-8">
          {/* Vocabulary Progress Rings - Horizontal scrollable strip */}
          <VocabProgressRings 
            vocabData={vocabData} 
            compact={true}
            onNavigate={setLocation}
          />

          {/* Two-column layout for remaining analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mini Vocab Usage Heatmap - takes 1/3 width on desktop */}
            <MiniVocabHeatmap 
              vocabData={vocabData} 
              compact={true}
              className="lg:col-span-1"
            />

            {/* JLPT Level Usage Comparison and Known vs Used Gap */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <JLPTLevelComparison 
                vocabData={vocabData} 
                compact={true}
              />

              <KnownVsUsedGap 
                vocabData={vocabData} 
                compact={true}
                onNavigate={setLocation}
              />
            </div>
          </div>

          {/* Word Spotlight Carousel - Full width */}
          <WordSpotlightCarousel 
            vocabData={vocabData} 
            compact={true}
            onNavigate={setLocation}
          />
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Comprehensive Vocabulary Analytics */}
          <EnhancedCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-primary">Vocabulary Progress</h3>
              </div>
              <EnhancedButton variant="ghost" size="sm" onClick={() => setLocation("/vocabulary")}>
                <TrendingUp className="w-4 h-4" />
              </EnhancedButton>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Words</span>
                <span className="font-semibold">{(vocabData as any[]).length}</span>
              </div>

              {(() => {
                const vocabStats = (vocabData as any[]).reduce((acc: any, entry: any) => {
                  const level = entry.word?.jlptLevel || 'N5';
                  if (!acc[level]) acc[level] = 0;
                  acc[level] += 1;
                  acc.userUsage += entry.userUsageCount || 0;
                  acc.aiEncounter += entry.aiEncounterCount || 0;
                  return acc;
                }, { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0, userUsage: 0, aiEncounter: 0 });

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-muted-foreground">Your Words</span>
                      </div>
                      <span className="text-green-600 font-semibold">{vocabStats.userUsage}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={aoiAvatar} 
                          alt="Aoi" 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">Aoi's Words</span>
                      </div>
                      <span className="text-blue-600 font-semibold">{Math.floor(vocabStats.aiEncounter * 0.6)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={harukiAvatar} 
                          alt="Haruki" 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm text-muted-foreground">Haruki's Words</span>
                      </div>
                      <span className="text-purple-600 font-semibold">{Math.floor(vocabStats.aiEncounter * 0.4)}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-3">
                      {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => (
                        <div key={level} className="text-center">
                          <div className="text-xs text-muted-foreground">{level}</div>
                          <div className="text-sm font-semibold">{vocabStats[level]}</div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </EnhancedCard>

          {/* Growth & Development Tracker */}
          <EnhancedCard>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-primary">Learning Journey</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <Badge variant="secondary">{getProgressionLabel()}</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-semibold">{activeConversations.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed Sessions</span>
                <span className="font-semibold">{completedConversations.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Words Learned</span>
                <span className="font-semibold">{(vocabData as any[]).length}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Messages Sent</span>
                <span className="font-semibold">{(progress as any)?.totalMessagesSent || 0}</span>
              </div>

              {(() => {
                const totalInteractions = (vocabData as any[]).length + (Array.isArray(conversations) ? conversations.length : 0);
                const nextMilestone = totalInteractions >= 100 ? 150 : 
                                    totalInteractions >= 75 ? 100 :
                                    totalInteractions >= 50 ? 75 :
                                    totalInteractions >= 25 ? 50 :
                                    totalInteractions >= 10 ? 25 : 10;
                const progress = (totalInteractions / nextMilestone) * 100;

                return (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to next level</span>
                      <span>{totalInteractions}/{nextMilestone}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, progress)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </EnhancedCard>
        </div>

        {/* Tutors Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Meet Your Tutors
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {Array.isArray(personas) && personas.length > 0 ? (
              // Remove duplicates by filtering unique personas by id
              personas
                .filter(
                  (persona: any, index: number, self: any[]) =>
                    index === self.findIndex((p: any) => p.id === persona.id),
                )
                .map((persona: any) => {
                  const getAvatarImage = (persona: any) => {
                    if (persona.type === "teacher") return aoiAvatar; // Aoi is the female teacher
                    if (persona.type === "friend") return harukiAvatar; // Haruki is the male friend
                    return aoiAvatar; // Default fallback
                  };

                  return (
                    <EnhancedCard
                      key={persona.id}
                      className="cursor-pointer group hover:shadow-lg transition-shadow"
                      onClick={() => setLocation("/tutor-selection")}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                          <img
                            src={getAvatarImage(persona)}
                            alt={persona.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to text avatar if image fails
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.parentElement!.innerHTML = `
                              <div class="avatar ${persona.type === "teacher" ? "sensei" : "student"} w-full h-full flex items-center justify-center">
                                <span class="font-japanese text-foreground">
                                  ${persona.type === "teacher" ? "先" : "友"}
                                </span>
                              </div>
                            `;
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                            {persona.name}
                          </h4>
                          <div className="status-tag n5 mb-2">
                            {persona.jlptLevel || "N5"} Level •{" "}
                            {persona.type === "teacher" ? "Teacher" : "Friend"}
                          </div>
                          <p className="text-sm text-foreground opacity-80">
                            {persona.description ||
                              (persona.type === "teacher"
                                ? "Formal teaching style with cultural context"
                                : "Friendly conversational approach")}
                          </p>
                        </div>
                      </div>
                    </EnhancedCard>
                  );
                })
            ) : (
              <div className="col-span-2 text-center py-8">
                <EnhancedCard>
                  <p className="text-foreground mb-4">
                    No tutors available at the moment.
                  </p>
                  <p className="text-sm text-foreground opacity-60">
                    Click below to explore tutor selection anyway.
                  </p>
                </EnhancedCard>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          <EnhancedCard>
            <h4 className="font-semibold text-primary mb-3">Quick Practice</h4>
            <p className="text-foreground text-sm mb-4">
              Jump into a conversation with your preferred tutor
            </p>
            <div className="space-y-2">
              <EnhancedButton
                onClick={() => setLocation("/tutor-selection")}
                className="btn-secondary w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Choose Tutor
              </EnhancedButton>
              <EnhancedButton
                onClick={() => setLocation("/scenario-selection")}
                className="btn-secondary w-full justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Browse Scenarios
              </EnhancedButton>
            </div>
          </EnhancedCard>

          <EnhancedCard>
            <h4 className="font-semibold text-primary mb-3">Learning Tips</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-foreground">
                  Practice speaking out loud to improve pronunciation
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-foreground">
                  Review vocabulary after each conversation
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-foreground">
                  Don't worry about mistakes - they help you learn!
                </span>
              </div>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}