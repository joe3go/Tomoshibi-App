
import React, { Suspense, memo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageSquare, TrendingUp } from 'lucide-react';

import { AppLayout, AppHeader } from '@/components/organisms/Layout/AppLayout';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePerformance } from '@/hooks/usePerformance';
import { ROUTES } from '@/constants';

// Lazy load heavy components for better performance
const ConversationCard = React.lazy(() => import('@/components/dashboard/ConversationCard'));
const AnalyticsGrid = React.lazy(() => import('@/components/dashboard/AnalyticsGrid'));
const TutorCarousel = React.lazy(() => import('@/components/dashboard/TutorCarousel'));
const QuickActions = React.lazy(() => import('@/components/dashboard/QuickActions'));
const DashboardSkeleton = React.lazy(() => import('@/components/dashboard/DashboardSkeleton'));

// Memoized conversation section for performance
const ConversationSection = memo(({ 
  conversations, 
  personas, 
  scenarios, 
  onConversationClick, 
  onNewConversation 
}: {
  conversations: any[];
  personas: any[];
  scenarios: any[];
  onConversationClick: (id: number) => void;
  onNewConversation: () => void;
}) => {
  if (!conversations || conversations.length === 0) {
    return (
      <Card className="content-card text-center p-8">
        <CardContent>
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Welcome to Tomoshibi! ようこそ！
          </h3>
          <p className="text-muted-foreground mb-6">
            Start your Japanese learning journey by choosing a tutor and beginning your first conversation.
          </p>
          <Button 
            onClick={onNewConversation}
            className="btn-japanese"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start First Conversation
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Your Conversations 会話
        </h2>
        <Button 
          onClick={onNewConversation}
          className="btn-japanese"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.map((conversation) => {
          const persona = personas?.find(p => p.id === conversation.personaId);
          const scenario = scenarios?.find(s => s.id === conversation.scenarioId);

          return (
            <Suspense key={conversation.id} fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
              <ConversationCard
                conversation={conversation}
                persona={persona}
                scenario={scenario}
                onClick={onConversationClick}
              />
            </Suspense>
          );
        })}
      </div>
    </div>
  );
});

ConversationSection.displayName = 'ConversationSection';

// Main Dashboard Component
export default function Dashboard() {
  const [, setLocation] = useLocation();

  // Performance monitoring
  usePerformance({
    trackRender: true,
    onMetric: (metric, value) => {
      console.log(`Dashboard ${metric}:`, value);
    },
  });

  // Consolidated data fetching
  const {
    user,
    conversations,
    personas,
    scenarios,
    progress,
    activeConversations,
    recentConversations,
    progressMetrics,
    japaneseStatus,
    isLoading,
  } = useDashboardData();

  // Event handlers
  const handleConversationClick = (conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  };

  const handleNewConversation = () => {
    setLocation(ROUTES.TUTOR_SELECTION);
  };

  const handleSelectTutor = (personaId: number) => {
    setLocation(`${ROUTES.SCENARIO_SELECTION}?persona=${personaId}`);
  };

  // Header actions
  const headerActions = (
    <div className="flex items-center space-x-3">
      <Badge 
        variant="outline" 
        className="hidden md:flex px-3 py-1 border-primary/30 text-primary bg-primary/10"
      >
        {japaneseStatus || '新人 (Newcomer)'}
      </Badge>
      <Button
        onClick={handleNewConversation}
        className="btn-japanese flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Conversation</span>
      </Button>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <AppLayout
        header={
          <AppHeader
            title="Dashboard"
            subtitle="ダッシュボード"
            actions={<div className="h-10 w-32 bg-muted rounded animate-pulse" />}
          />
        }
        maxWidth="7xl"
        testId="dashboard-page"
      >
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardSkeleton />
        </Suspense>
      </AppLayout>
    );
  }

  const displayName = user?.displayName || 'Student';

  return (
    <AppLayout
      header={
        <AppHeader
          title={`Welcome back, ${displayName}!`}
          subtitle="おかえりなさい！Ready to continue your Japanese journey?"
          actions={headerActions}
        />
      }
      maxWidth="7xl"
      testId="dashboard-page"
    >
      <div className="space-y-8">
        {/* Analytics Section */}
        <Suspense fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
          <AnalyticsGrid
            progress={progress}
            conversations={activeConversations || []}
            isLoading={false}
          />
        </Suspense>

        {/* Recent Activity */}
        {recentConversations && recentConversations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Recent Activity 最近の活動
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentConversations.map((conversation) => {
                const persona = personas?.find(p => p.id === conversation.personaId);
                const scenario = scenarios?.find(s => s.id === conversation.scenarioId);

                return (
                  <Suspense key={conversation.id} fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
                    <ConversationCard
                      conversation={conversation}
                      persona={persona}
                      scenario={scenario}
                      onClick={handleConversationClick}
                    />
                  </Suspense>
                );
              })}
            </div>
          </div>
        )}

        {/* All Conversations */}
        <ConversationSection
          conversations={activeConversations || []}
          personas={personas || []}
          scenarios={scenarios || []}
          onConversationClick={handleConversationClick}
          onNewConversation={handleNewConversation}
        />

        {/* Tutor Selection */}
        <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse" />}>
          <TutorCarousel
            personas={personas || []}
            onSelectTutor={handleSelectTutor}
            isLoading={false}
          />
        </Suspense>

        {/* Quick Actions */}
        <Suspense fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
          <QuickActions />
        </Suspense>
      </div>
    </AppLayout>
  );
}
