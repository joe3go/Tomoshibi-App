
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, MessageCircle, User, Clock, BookOpen, TrendingUp, BarChart3, Play, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import FuriganaText from '@/components/furigana-text';

interface ConversationWithDetails {
  id: number;
  userId: number;
  personaId: number;
  scenarioId: number;
  phase: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  completedAt?: string;
  messages: Array<{
    id: number;
    sender: 'user' | 'ai';
    content: string;
    vocabUsed: number[];
    grammarUsed: number[];
    timestamp: string;
  }>;
  persona: {
    id: number;
    name: string;
    type: string;
    jlptLevel: string;
  };
  scenario: {
    id: number;
    title: string;
    description: string;
    jlptLevel: string;
  };
}

export default function History() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('all');
  const queryClient = useQueryClient();

  const endSessionMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to end session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/completed'] });
    }
  });

  const handleEndSession = (conversationId: number) => {
    endSessionMutation.mutate(conversationId);
  };

  // Fetch all conversations (both active and completed)
  const { data: activeConversations = [], isLoading: loadingActive } = useQuery({
    queryKey: ['/api/conversations'],
  });

  const { data: completedConversations = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['/api/conversations/completed'],
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['/api/personas'],
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ['/api/scenarios'],
  });

  const { data: vocabTracker = [] } = useQuery({
    queryKey: ['/api/vocab-tracker'],
  });

  const allConversations = [...(activeConversations as any[]), ...(completedConversations as any[])];

  // Calculate analytics
  const analytics = {
    totalConversations: allConversations.length,
    completedConversations: (completedConversations as any[]).length,
    activeConversations: (activeConversations as any[]).length,
    totalMessages: allConversations.reduce((sum: number, conv: any) => {
      return sum + (conv.messages?.length || 0);
    }, 0),
    uniqueVocabWords: new Set(
      allConversations.flatMap((conv: any) => 
        conv.messages?.flatMap((msg: any) => msg.vocabUsed || []) || []
      )
    ).size,
    averageMessagesPerConversation: allConversations.length > 0 
      ? Math.round(allConversations.reduce((sum: number, conv: any) => {
          return sum + (conv.messages?.length || 0);
        }, 0) / allConversations.length)
      : 0,
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConversationDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const filteredConversations = allConversations.filter((conv: any) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return conv.status === 'completed';
    if (selectedTab === 'active') return conv.status === 'active';
    return true;
  });

  if (loadingActive || loadingCompleted) {
    return (
      <div className="history-page-container">
        <div className="history-content-wrapper">
          <div className="history-loading-container">
            <div className="history-loading-content">
              <div className="history-loading-spinner"></div>
              <p className="history-loading-text">Loading conversation history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page-container">
      <div className="history-content-wrapper">
        {/* Header */}
        <div className="history-header">
          <div>
            <h1 className="history-page-title">Conversation History</h1>
            <p className="history-page-subtitle">Your Japanese learning journey and progress</p>
          </div>
          <Button onClick={() => setLocation('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="history-analytics-grid">
          <Card>
            <CardHeader className="history-analytics-card-header">
              <CardTitle className="history-analytics-card-title">
                <BarChart3 className="w-4 h-4" />
                Total Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="history-analytics-value">{analytics.totalConversations}</div>
              <p className="history-analytics-description">
                {analytics.completedConversations} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="history-analytics-card-header">
              <CardTitle className="history-analytics-card-title">
                <MessageCircle className="w-4 h-4" />
                Messages Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="history-analytics-value">{analytics.totalMessages}</div>
              <p className="history-analytics-description">
                ~{analytics.averageMessagesPerConversation} per conversation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="history-analytics-card-header">
              <CardTitle className="history-analytics-card-title">
                <BookOpen className="w-4 h-4" />
                Vocabulary Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="history-analytics-value">{analytics.uniqueVocabWords}</div>
              <p className="history-analytics-description">unique words encountered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="history-analytics-card-header">
              <CardTitle className="history-analytics-card-title">
                <TrendingUp className="w-4 h-4" />
                Progress Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="history-analytics-value">
                {analytics.totalConversations > 0 
                  ? Math.round((analytics.completedConversations / analytics.totalConversations) * 100)
                  : 0}%
              </div>
              <p className="history-analytics-description">completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversation List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Browse your conversation history and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="history-tabs-list">
                <TabsTrigger value="all">All ({allConversations.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({(activeConversations as any[]).length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({(completedConversations as any[]).length})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab} className="history-tab-content">
                {filteredConversations.length === 0 ? (
                  <div className="history-empty-state">
                    <MessageCircle className="history-empty-icon" />
                    <p className="history-empty-text">
                      {selectedTab === 'completed' 
                        ? "No completed conversations yet" 
                        : selectedTab === 'active'
                        ? "No active conversations"
                        : "No conversations found"}
                    </p>
                  </div>
                ) : (
                  <div className="history-conversations-list">
                    {filteredConversations.map((conversation: any) => {
                      const persona = (personas as any[]).find((p: any) => p.id === conversation.personaId);
                      const scenario = (scenarios as any[]).find((s: any) => s.id === conversation.scenarioId);
                      const messageCount = conversation.messages?.length || 0;
                      const vocabWordsUsed = new Set(
                        conversation.messages?.flatMap((msg: any) => msg.vocabUsed || []) || []
                      ).size;

                      return (
                        <Card key={conversation.id} className="history-conversation-card">
                          <CardContent className="history-conversation-content">
                            <div className="history-conversation-layout">
                              <div className="history-conversation-info">
                                <div className="history-conversation-header">
                                  <h3 className="history-conversation-title">
                                    {scenario?.title || 'Unknown Scenario'}
                                  </h3>
                                  <Badge variant={getStatusBadgeVariant(conversation.status)}>
                                    {conversation.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                                    {conversation.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {conversation.status}
                                  </Badge>
                                  <Badge variant="outline">{scenario?.jlptLevel || 'N5'}</Badge>
                                </div>

                                <p className="history-conversation-persona">
                                  with {persona?.name || 'Unknown'} • {persona?.type || 'tutor'}
                                </p>

                                <div className="history-conversation-stats">
                                  <div className="history-stat-item">
                                    <Calendar className="history-stat-icon" />
                                    <span>{formatDate(conversation.startedAt)}</span>
                                  </div>
                                  <div className="history-stat-item">
                                    <Clock className="history-stat-icon" />
                                    <span>{getConversationDuration(conversation.startedAt, conversation.completedAt)}</span>
                                  </div>
                                  <div className="history-stat-item">
                                    <MessageCircle className="history-stat-icon" />
                                    <span>{messageCount} messages</span>
                                  </div>
                                  <div className="history-stat-item">
                                    <BookOpen className="history-stat-icon" />
                                    <span>{vocabWordsUsed} vocab words</span>
                                  </div>
                                </div>

                                {/* Last message preview */}
                                {conversation.messages && conversation.messages.length > 0 && (
                                  <div className="history-message-preview">
                                    <p className="history-message-preview-label">Last message:</p>
                                    <div className="history-message-preview-content">
                                      <FuriganaText
                                        text={conversation.messages[conversation.messages.length - 1].content}
                                        showToggleButton={false}
                                        enableWordLookup={false}
                                        className="line-clamp-2"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="history-conversation-actions">
                                {conversation.status === 'active' && (
                                  <>
                                    <Button
                                      onClick={() => setLocation(`/chat/${conversation.id}`)}
                                      size="sm"
                                    >
                                      Continue
                                    </Button>
                                    <Button
                                      onClick={() => handleEndSession(conversation.id)}
                                      variant="outline"
                                      size="sm"
                                      className="history-end-session-button"
                                    >
                                      End Session
                                    </Button>
                                  </>
                                )}
                                {conversation.status === 'completed' && (
                                  <Button
                                    onClick={() => setLocation(`/chat/${conversation.id}`)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    View
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
