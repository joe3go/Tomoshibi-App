import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  TrendingUp, 
  Award, 
  Target, 
  Clock, 
  Flame,
  BookOpen,
  Users,
  Play,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import VocabularyStatsCard from "@/components/VocabularyStatsCard";
import { formatDuration, calculateTotalWords, getAvatarImage } from "@/lib/analytics";

// Custom hooks
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTutors } from "@/hooks/useTutors";
import { useConversations } from "@/hooks/useConversations";
import { useVocabularyStats } from "@/hooks/useVocabularyStats";

// Dashboard components
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import StatCard from "@/components/dashboard/StatCard";
import JLPTProgressGrid from "@/components/dashboard/JLPTProgressGrid";
import ConversationPreviewCard from "@/components/dashboard/ConversationPreviewCard";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, session } = useAuth();
  const isAuthenticated = !!session;

  // Custom hooks
  const { userProfile, addUserXP } = useUserProfile();
  const { tutorsData, tutorsLoading } = useTutors();
  const { conversations, createConversationMutation, endConversationMutation } = useConversations();
  const { vocabStats } = useVocabularyStats();

  // Analytics data
  const analytics = {
    streak: userProfile?.streak_days || 0,
    newWordsThisWeek: 12,
    totalWords: calculateTotalWords(vocabStats),
    activeConversations: Array.isArray(conversations) ? conversations.filter((conv: any) => conv.status === 'active').length : 0,
    practiceTime: 155,
    upcomingGoal: userProfile?.learning_goals || `Learn ${userProfile?.jlpt_goal_level || 'N5'} vocabulary`,
    xp: userProfile?.xp || 0,
    jlptGoal: userProfile?.jlpt_goal_level || 'N5'
  };

  // Handle tutor selection for new chat
  const handleStartNewChat = async (personaId: string, tutorName: string) => {
    try {
      console.log('🎯 Starting new chat with persona ID:', personaId, 'Type:', typeof personaId);

      const { isValidUUID } = await import("../../../shared/validation");

      if (!personaId || !isValidUUID(personaId)) {
        console.error('❌ Invalid persona ID:', personaId);
        throw new Error('Invalid tutor ID format');
      }

      const title = `Chat with ${tutorName}`;
      createConversationMutation.mutate({ personaId, title });
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  // Handle resume chat
  const handleResumeChat = (conversationId: string | number) => {
    console.log('🔄 Resuming chat with conversation ID:', conversationId, 'Type:', typeof conversationId);
    setLocation(`/chat/${conversationId}`);
  };

  // Handle end chat
  const handleEndChat = async (conversationId: string | number) => {
    endConversationMutation.mutate(conversationId);
    // Add XP reward for completing conversation
    if (user?.id) {
      await addUserXP(50);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLocation('/login');
    }
  };

  // Navigation handlers
  const navigateTo = (path: string) => setLocation(path);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Loading states
  if (authLoading) return <DashboardLoading />;
  if (!isAuthenticated) return null;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">🌸 Tomoshibi</h1>
            <p className="header-subtitle">Japanese Learning Platform</p>
          </div>
          <div className="header-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('/tutor-selection')}
              className="header-nav-btn"
            >
              <Users className="w-4 h-4 mr-2" />
              Tutors
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('/scenarios')}
              className="header-nav-btn"
            >
              <Target className="w-4 h-4 mr-2" />
              Scenarios
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('/vocabulary')}
              className="header-nav-btn"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Vocabulary
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo('/settings')}
              className="header-nav-btn"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="header-nav-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <ProfileHeader 
          userProfile={userProfile}
          userEmail={user?.email}
          displayName={user?.user_metadata?.display_name}
        />

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-grid">
            <StatCard
              icon={Flame}
              value={`${analytics.streak}-day`}
              label="Streak"
              iconColor="text-orange-500"
              className="streak-card"
            />
            <StatCard
              icon={TrendingUp}
              value={analytics.newWordsThisWeek}
              label="New Words This Week"
              iconColor="text-green-500"
            />
            <StatCard
              icon={BookOpen}
              value={analytics.totalWords}
              label="Total Words Used"
              iconColor="text-blue-500"
            />
            <StatCard
              icon={Users}
              value={analytics.activeConversations}
              label="Active Conversations"
              iconColor="text-purple-500"
            />
            <StatCard
              icon={Clock}
              value={formatDuration(analytics.practiceTime)}
              label="Practice Time"
              iconColor="text-indigo-500"
            />
            <StatCard
              icon={Award}
              value={analytics.xp}
              label="XP Earned"
              iconColor="text-yellow-500"
            />
            <StatCard
              icon={Target}
              value={analytics.jlptGoal}
              label="JLPT Goal"
              iconColor="text-red-500"
            />
          </div>

          {/* JLPT Vocabulary Stats */}
          <JLPTProgressGrid vocabStats={vocabStats} />
        </div>

        {/* JLPT Vocabulary Usage Card */}
        <VocabularyStatsCard />

        {/* Recent Conversations Section */}
        <ConversationPreviewCard
          conversations={conversations}
          tutorsData={tutorsData}
          onResumeChat={handleResumeChat}
          onEndChat={handleEndChat}
          isEndingConversation={endConversationMutation.isPending}
        />

        {/* Practice Groups Section */}
        <div className="practice-groups-section">
          <Card className="section-card">
            <CardHeader className="section-header">
              <CardTitle className="section-title">
                <Users className="w-5 h-5" />
                Practice Groups
              </CardTitle>
              <CardDescription>
                Join AI-powered group conversations with multiple tutors
              </CardDescription>
            </CardHeader>
            <CardContent className="section-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
                  <div className="text-sm text-muted-foreground">Available Groups</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">Multiple</div>
                  <div className="text-sm text-muted-foreground">AI Participants</div>
                </div>
                <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">Real-time</div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
              </div>
              <div className="text-center">
                <Button 
                  onClick={() => navigateTo('/practice-groups')}
                  className="bg-gradient-to-r from-blue-600 to-rose-600 hover:from-blue-700 hover:to-rose-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Explore Practice Groups
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meet Your Tutors Section */}
        <div className="tutors-section">
          <Card className="section-card">
            <CardHeader className="section-header">
              <CardTitle className="section-title">
                <Users className="w-5 h-5" />
                Meet Your Tutors
              </CardTitle>
              <CardDescription>
                Start one-on-one conversations with AI tutors
              </CardDescription>
            </CardHeader>
            <CardContent className="section-content">
              <div className="tutors-grid">
                {tutorsLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading tutors...</p>
                  </div>
                ) : tutorsData.length > 0 ? (
                  tutorsData.slice(0, 4).map((persona: any) => (
                    <div key={persona.id} className="tutor-preview-card">
                      <div className="tutor-preview-content">
                        <Avatar className="tutor-preview-avatar">
                          <AvatarImage src={getAvatarImage(persona)} alt={persona.name} />
                          <AvatarFallback>{persona.name?.[0] || 'T'}</AvatarFallback>
                        </Avatar>
                        <div className="tutor-preview-info">
                          <h4 className="tutor-preview-name">{persona.name}</h4>
                          <Badge variant="secondary" className="tutor-preview-type">
                            {persona.type === 'tutor' ? 'Tutor' : 'Study Buddy'}
                          </Badge>
                          <p className="tutor-preview-description">
                            {persona.description || 'Available for conversation practice'}
                          </p>

                          {persona.personality && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-teal-600">Personality:</span>
                              <span className="text-xs text-gray-700 ml-1">{persona.personality}</span>
                            </div>
                          )}
                          {persona.speaking_style && (
                            <div className="mb-4">
                              <span className="text-xs font-medium text-teal-600">Speaking Style:</span>
                              <span className="text-xs text-gray-700 ml-1">{persona.speaking_style}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleStartNewChat(persona.id, persona.name)}
                        className="start-chat-btn"
                        size="sm"
                        disabled={createConversationMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Chat
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No tutors available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}