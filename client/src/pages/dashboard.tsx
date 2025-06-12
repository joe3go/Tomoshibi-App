import React, { useState, useCallback, useMemo } from "react";
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
import type { 
  ChatConversation,
  LearningScenario,
  TeachingPersona,
  UserLearningProgress,
  VocabularyTrackingEntry,
  BaseComponentProps
} from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

interface DashboardProps extends BaseComponentProps {}

const Dashboard: React.FC<DashboardProps> = React.memo(() => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState((user as any)?.displayName || "");
  const [newPassword, setNewPassword] = useState("");
  const [soundNotifications, setSoundNotifications] = useState((user as any)?.soundNotifications ?? true);
  const [desktopNotifications, setDesktopNotifications] = useState((user as any)?.desktopNotifications ?? true);

  // Optimized queries with proper typing and caching
  const { data: userConversations, isLoading: isLoadingConversations } = useQuery<ChatConversation[]>({
    queryKey: [API_ENDPOINTS.CONVERSATIONS],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: learningScenarios, isLoading: isLoadingScenarios } = useQuery<LearningScenario[]>({
    queryKey: [API_ENDPOINTS.SCENARIOS],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: teachingPersonas, isLoading: isLoadingPersonas } = useQuery<TeachingPersona[]>({
    queryKey: [API_ENDPOINTS.PERSONAS],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: learningProgress, isLoading: isLoadingProgress } = useQuery<UserLearningProgress[]>({
    queryKey: [API_ENDPOINTS.PROGRESS],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const { data: vocabularyTrackingData = [] } = useQuery<VocabularyTrackingEntry[]>({
    queryKey: [API_ENDPOINTS.VOCAB_TRACKER],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Memoized calculations for performance
  const dashboardStats = useMemo(() => {
    const totalConversations = userConversations?.length || 0;
    const activeConversations = userConversations?.filter(conv => conv.status === 'active').length || 0;
    const completedConversations = userConversations?.filter(conv => conv.status === 'completed').length || 0;
    const totalVocabWords = vocabularyTrackingData.length;
    const masteredWords = vocabularyTrackingData.filter(entry => entry.memoryStrength >= 80).length;

    return {
      totalConversations,
      activeConversations,
      completedConversations,
      totalVocabWords,
      masteredWords
    };
  }, [userConversations, vocabularyTrackingData]);

  // Optimized mutations
  const createConversationMutation = useMutation({
    mutationFn: async (data: { scenarioId: number; personaId: number }) => {
      return apiRequest('POST', API_ENDPOINTS.CONVERSATIONS, data);
    },
    onSuccess: (newConversation: any) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONVERSATIONS] });
      setLocation(`/chat/${newConversation.id}`);
      toast({
        title: "Conversation started",
        description: "Your new conversation is ready!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start conversation",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateUserSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest('PATCH', '/api/auth/update-settings', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setSettingsOpen(false);
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/login');
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Event handlers with useCallback optimization
  const handleStartConversation = useCallback((scenarioId: number, personaId: number) => {
    if (createConversationMutation.isPending) return;
    createConversationMutation.mutate({ scenarioId, personaId });
  }, [createConversationMutation]);

  const handleContinueConversation = useCallback((conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  }, [setLocation]);

  const handleViewVocabulary = useCallback(() => {
    setLocation('/vocab-tracker');
  }, [setLocation]);

  const handleUpdateSettings = useCallback(() => {
    if (updateUserSettingsMutation.isPending) return;
    
    updateUserSettingsMutation.mutate({
      displayName,
      newPassword: newPassword || undefined,
      soundNotifications,
      desktopNotifications,
    });
  }, [updateUserSettingsMutation, displayName, newPassword, soundNotifications, desktopNotifications]);

  const handleLogout = useCallback(() => {
    if (logoutMutation.isPending) return;
    logoutMutation.mutate();
  }, [logoutMutation]);

  // Memoized persona avatar function
  const getPersonaAvatar = useCallback((personaName: string) => {
    return personaName.toLowerCase() === 'haruki' ? harukiAvatar : aoiAvatar;
  }, []);

  // Loading state
  if (isLoadingConversations || isLoadingScenarios || isLoadingPersonas) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome back, {(user as any)?.displayName || 'Student'}!</h1>
            <p className="text-muted-foreground mt-2">Continue your Japanese learning journey</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Account Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password (optional)</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="soundNotifications"
                      checked={soundNotifications}
                      onChange={(e) => setSoundNotifications(e.target.checked)}
                    />
                    <Label htmlFor="soundNotifications">Sound notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="desktopNotifications"
                      checked={desktopNotifications}
                      onChange={(e) => setDesktopNotifications(e.target.checked)}
                    />
                    <Label htmlFor="desktopNotifications">Desktop notifications</Label>
                  </div>
                  <Button 
                    onClick={handleUpdateSettings} 
                    disabled={updateUserSettingsMutation.isPending}
                    className="w-full"
                  >
                    {updateUserSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MessageCircle className="h-12 w-12 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Conversations</p>
                  <p className="text-3xl font-bold">{dashboardStats.totalConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-12 w-12 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-3xl font-bold">{dashboardStats.activeConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <BookOpen className="h-12 w-12 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Vocabulary Words</p>
                  <p className="text-3xl font-bold">{dashboardStats.totalVocabWords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Award className="h-12 w-12 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Mastered Words</p>
                  <p className="text-3xl font-bold">{dashboardStats.masteredWords}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Conversations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userConversations && userConversations.length > 0 ? (
                <div className="space-y-3">
                  {userConversations.slice(0, 5).map((conversation) => {
                    const persona = teachingPersonas?.find(p => p.id === conversation.personaId);
                    const scenario = learningScenarios?.find(s => s.id === conversation.scenarioId);
                    
                    return (
                      <div key={conversation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img
                              src={getPersonaAvatar(persona?.name || '')}
                              alt={persona?.name || 'AI'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{scenario?.title || 'Conversation'}</p>
                            <p className="text-xs text-muted-foreground">with {persona?.name || 'AI Tutor'}</p>
                            <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {conversation.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContinueConversation(conversation.id)}
                        >
                          {conversation.status === 'active' ? 'Continue' : 'Review'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No conversations yet. Start your first conversation below!</p>
              )}
            </CardContent>
          </Card>

          {/* Learning Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Learning Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningScenarios?.slice(0, 4).map((scenario) => (
                  <div key={scenario.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{scenario.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                        <Badge className="mt-2 text-xs">{scenario.jlptLevel}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {teachingPersonas?.map((persona) => (
                        <Button
                          key={persona.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartConversation(scenario.id, persona.id)}
                          disabled={createConversationMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden">
                            <img
                              src={getPersonaAvatar(persona.name)}
                              alt={persona.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs">{persona.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Vocabulary Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {dashboardStats.masteredWords}/{dashboardStats.totalVocabWords}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${dashboardStats.totalVocabWords > 0 ? (dashboardStats.masteredWords / dashboardStats.totalVocabWords) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Conversation Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {dashboardStats.completedConversations}/{dashboardStats.totalConversations}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${dashboardStats.totalConversations > 0 ? (dashboardStats.completedConversations / dashboardStats.totalConversations) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <Button onClick={handleViewVocabulary} className="w-full mt-4">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Vocabulary Tracker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;