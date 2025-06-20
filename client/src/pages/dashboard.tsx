import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  MessageCircle, 
  TrendingUp, 
  Award, 
  Target, 
  Clock, 
  Flame,
  BookOpen,
  Users,
  ChevronRight,
  Play,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAuthHeaders } from "@/lib/auth";
import { 
  getVocabStats,
  createConversation,
  getCurrentUser 
} from "@/lib/supabase-functions";
import { useToast } from "@/hooks/use-toast";

// Helper function to get avatar image
const getAvatarImage = (persona: any) => {
  if (persona?.avatar_url && persona.avatar_url.startsWith('/avatars/')) {
    return persona.avatar_url;
  }
  return `/avatars/${persona?.name?.toLowerCase() || 'default'}.png`;
};

// Helper function to format time duration
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [tutorsData, setTutorsData] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Direct fetch for tutors to ensure they display
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const authHeaders = getAuthHeaders();
        const response = await fetch('/api/personas', {
          headers: authHeaders,
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Tutors fetched successfully:', data);
          setTutorsData(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch tutors:', response.status);
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
      } finally {
        setTutorsLoading(false);
      }
    };

    fetchTutors();
  }, []);

  // Fetch vocabulary stats from Supabase
  const { data: vocabStats } = useQuery({
    queryKey: ["vocab-stats", (user as any)?.id],
    queryFn: async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) return null;
        return await getVocabStats(currentUser.id);
      } catch (error) {
        console.error('Error fetching vocab stats:', error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ personaId, title }: { personaId: number; title: string }) => {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");
      
      return await createConversation(currentUser.id, personaId, null, title);
    },
    onSuccess: (conversationId) => {
      setLocation(`/chat/${conversationId}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock analytics data (in real app, this would come from API)
  const analytics = {
    streak: 7,
    newWordsThisWeek: 12,
    totalWords: 150,
    activeConversations: Array.isArray(conversations) ? conversations.length : 0,
    practiceTime: 155, // minutes
    upcomingGoal: "Learn 20 JLPT N5 words"
  };

  // Handle tutor selection for new chat using Supabase function
  const handleStartNewChat = (personaId: number, tutorName: string) => {
    const title = `Chat with ${tutorName}`;
    createConversationMutation.mutate({ personaId, title });
  };

  // Handle resume chat
  const handleResumeChat = (conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setLocation('/login');
  };

  if (conversationsLoading || tutorsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
              onClick={() => setLocation('/tutor-selection')}
              className="header-nav-btn"
            >
              <Users className="w-4 h-4 mr-2" />
              Tutors
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/scenarios')}
              className="header-nav-btn"
            >
              <Target className="w-4 h-4 mr-2" />
              Scenarios
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/vocabulary')}
              className="header-nav-btn"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Vocabulary
            </Button>
            <Button
              variant="ghost"
              size="sm"
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
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, {(user as any)?.displayName || 'Student'}!
            </h1>
            <p className="welcome-subtitle">Keep your momentum going!</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          <div className="analytics-grid">
            <Card className="stat-card streak-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">{analytics.streak}-day</p>
                  <p className="stat-label">Streak</p>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">{analytics.newWordsThisWeek}</p>
                  <p className="stat-label">New Words This Week</p>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">
                    {vocabStats ? 
                      Object.values(vocabStats).reduce((sum: number, count: any) => sum + (count || 0), 0) : 
                      analytics.totalWords
                    }
                  </p>
                  <p className="stat-label">Total Words Used</p>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <MessageCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">{analytics.activeConversations}</p>
                  <p className="stat-label">Active Conversations</p>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <Clock className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">{formatDuration(analytics.practiceTime)}</p>
                  <p className="stat-label">Practice Time</p>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="stat-content">
                <div className="stat-icon">
                  <Target className="w-6 h-6 text-red-500" />
                </div>
                <div className="stat-details">
                  <p className="stat-value">Goal</p>
                  <p className="stat-label">{analytics.upcomingGoal}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* JLPT Vocabulary Stats */}
          {vocabStats && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  JLPT Vocabulary Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => (
                    <div key={level} className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {vocabStats[level] || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {level} Words
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* JLPT Vocabulary Usage Card */}
        <div className="vocab-analytics-section">
          <Card className="section-card">
            <CardHeader className="section-header">
              <CardTitle className="section-title">
                <BookOpen className="w-5 h-5" />
                JLPT Vocabulary Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="section-content">
              <div className="vocab-levels-grid">
                {[
                  { level: 'N5', count: 550, color: 'bg-green-500' },
                  { level: 'N4', count: 450, color: 'bg-blue-500' },
                  { level: 'N3', count: 350, color: 'bg-yellow-500' },
                  { level: 'N2', count: 250, color: 'bg-orange-500' },
                  { level: 'N1', count: 150, color: 'bg-red-500' }
                ].map((levelData) => (
                  <div key={levelData.level} className="vocab-level-card">
                    <div className="vocab-level-header">
                      <span className={`vocab-level-badge ${levelData.color}`}>
                        {levelData.level}
                      </span>
                      <span className="vocab-level-count">{levelData.count}</span>
                    </div>
                    <div className="vocab-level-bar-container">
                      <div 
                        className={`vocab-level-bar ${levelData.color}`}
                        style={{ width: `${(levelData.count / 550) * 100}%` }}
                      ></div>
                    </div>
                    <p className="vocab-level-label">words available</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations Section */}
        <div className="recent-conversations-section">
          <Card className="section-card">
            <CardHeader className="section-header">
              <CardTitle className="section-title">
                <MessageCircle className="w-5 h-5" />
                Recent Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="section-content">
              {Array.isArray(conversations) && conversations.length > 0 ? (
                <div className="conversations-list">
                  {conversations.slice(0, 3).map((conversation: any) => {
                    const persona = tutorsData.find((p: any) => p.id === conversation.persona_id);
                    return (
                      <div key={conversation.id} className="conversation-card">
                        <div className="conversation-info">
                          <Avatar className="conversation-avatar">
                            <AvatarImage src={getAvatarImage(persona)} alt={persona?.name} />
                            <AvatarFallback>{persona?.name?.[0] || 'T'}</AvatarFallback>
                          </Avatar>
                          <div className="conversation-details">
                            <p className="conversation-tutor">{persona?.name || 'Unknown Tutor'}</p>
                            <p className="conversation-summary">
                              {conversation.status === 'active' ? 'Active conversation' : 'Completed'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleResumeChat(conversation.id)}
                          className="resume-btn"
                        >
                          Resume
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="empty-title">No conversations yet</p>
                  <p className="empty-description">Start your first chat with a tutor below!</p>
                </div>
              )}
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
                            {persona.type === 'teacher' ? 'Teacher' : 'Friend'}
                          </Badge>
                          <p className="tutor-preview-description">
                            {persona.description || 'Available for conversation practice'}
                          </p>
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