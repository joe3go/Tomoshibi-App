import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Play
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Fetch personas
  const { data: personas = [], isLoading: personasLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  // Mock analytics data (in real app, this would come from API)
  const analytics = {
    streak: 7,
    newWordsThisWeek: 12,
    totalWords: 150,
    activeConversations: conversations?.length || 0,
    practiceTime: 155, // minutes
    upcomingGoal: "Learn 20 JLPT N5 words"
  };

  // Handle tutor selection for new chat
  const handleStartNewChat = async (personaId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          persona_id: personaId,
          scenario_id: null // Free chat mode
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const conversation = await response.json();
      setLocation(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      setLocation('/chat');
    }
  };

  // Handle resume chat
  const handleResumeChat = (conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  };

  if (conversationsLoading || personasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
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
                <p className="stat-value">{analytics.totalWords}</p>
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
            {conversations.length > 0 ? (
              <div className="conversations-list">
                {conversations.slice(0, 3).map((conversation: any) => {
                  const persona = personas.find((p: any) => p.id === conversation.persona_id);
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
              {personas.slice(0, 4).map((persona: any) => (
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
                    onClick={() => handleStartNewChat(persona.id)}
                    className="start-chat-btn"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start Chat
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}