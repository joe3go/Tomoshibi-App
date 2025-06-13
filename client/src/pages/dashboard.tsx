import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, LogOut, MessageCircle, User, Calendar, BookOpen, History, TrendingUp, Award, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";
import { ConversationCard } from "@/components/ConversationCard";
import { CardSectionHeader } from "@/components/CardSectionHeader";
import { dashboardUtils } from "@/lib/utils";
import type { DashboardUser, DashboardConversation } from "@/types/dashboard";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

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

  const progressionLabel = dashboardUtils.getProgressionLabel(
    Array.isArray(vocabData) ? vocabData.length : 0,
    Array.isArray(completedConversations) ? completedConversations.length : 0
  );

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <DashboardHeader
          user={user as DashboardUser}
          progressionLabel={progressionLabel}
          onNavigate={setLocation}
          onLogout={handleLogout}
        />



        {/* Continue Conversations Section */}
        {activeConversations.length > 0 && (
          <div className="mb-6">
            <CardSectionHeader
              title="Continue Learning"
              action={{
                label: "See more",
                onClick: () => setLocation("/history")
              }}
            />
            <div className="grid gap-3 md:grid-cols-3">
              {activeConversations.slice(0, 3).map((conversation: any) => {
                const persona = Array.isArray(personas)
                  ? personas.find((p: any) => p.id === conversation.personaId)
                  : null;
                const scenario = Array.isArray(scenarios)
                  ? scenarios.find((s: any) => s.id === conversation.scenarioId)
                  : null;

                // Enhance conversation with persona and scenario data
                const enhancedConversation: DashboardConversation = {
                  ...conversation,
                  persona: persona ? {
                    ...persona,
                    avatarUrl: persona.name === 'Aoi' ? aoiAvatar : 
                               persona.name === 'Haruki' ? harukiAvatar : 
                               persona.avatarUrl || ''
                  } : undefined,
                  scenario: scenario || undefined
                };

                return (
                  <ConversationCard
                    key={conversation.id}
                    conversation={enhancedConversation}
                    onContinue={(id) => setLocation(`/chat/${id}`)}
                    onEndSession={handleEndSessionDashboard}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Comprehensive Vocabulary Analytics */}
          <div className="content-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-primary">Vocabulary Progress</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/vocabulary")}>
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Words</span>
                <span className="font-semibold">{(vocabData as any[]).length}</span>
              </div>
              
              {(() => {
                const vocabStats = (vocabData as any[]).reduce((acc: any, entry: any) => {
                  const level = entry.word?.jlptLevel || 'N5';
                  acc[level] = (acc[level] || 0) + 1;
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
          </div>

          {/* Growth & Development Tracker */}
          <div className="content-card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-primary">Learning Journey</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <Badge variant="secondary">{progressionLabel}</Badge>
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
          </div>
        </div>

        {/* Tutors Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Meet Your Tutors
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
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
                    <div
                      key={persona.id}
                      className="content-card cursor-pointer group hover:shadow-lg transition-shadow"
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
                    </div>
                  );
                })
            ) : (
              <div className="col-span-2 content-card text-center py-8">
                <p className="text-foreground mb-4">
                  No tutors available at the moment.
                </p>
                <p className="text-sm text-foreground opacity-60">
                  Click below to explore tutor selection anyway.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="content-card">
            <h4 className="font-semibold text-primary mb-3">Quick Practice</h4>
            <p className="text-foreground text-sm mb-4">
              Jump into a conversation with your preferred tutor
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setLocation("/tutor-selection")}
                className="btn-secondary w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Choose Tutor
              </Button>
              <Button
                onClick={() => setLocation("/scenario-selection")}
                className="btn-secondary w-full justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Browse Scenarios
              </Button>
            </div>
          </div>

          <div className="content-card">
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
          </div>
        </div>
      </div>
    </div>
  );
}
