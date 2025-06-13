
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, MessageSquare, Target, TrendingUp } from 'lucide-react';
import type { AnalyticsGridProps } from '@/types/dashboard';

const AnalyticsGrid = memo<AnalyticsGridProps>(({ 
  progress, 
  conversations, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="content-card animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Safe property access with fallbacks
  const vocabMastered = Array.isArray(progress?.vocabMastered) ? progress.vocabMastered.length : 0;
  const vocabEncountered = Array.isArray(progress?.vocabEncountered) ? progress.vocabEncountered.length : 0;
  const grammarMastered = Array.isArray(progress?.grammarMastered) ? progress.grammarMastered.length : 0;
  const grammarEncountered = Array.isArray(progress?.grammarEncountered) ? progress.grammarEncountered.length : 0;
  const totalConversations = typeof progress?.totalConversations === 'number' ? progress.totalConversations : 0;
  const totalMessagesSent = typeof progress?.totalMessagesSent === 'number' ? progress.totalMessagesSent : 0;

  const metrics = [
    {
      title: 'Vocabulary Mastered',
      value: vocabMastered,
      total: vocabEncountered,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Conversations',
      value: totalConversations,
      total: null,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Messages Sent',
      value: totalMessagesSent,
      total: null,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Grammar Points',
      value: grammarMastered,
      total: grammarEncountered,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const progressPercentage = metric.total && metric.total > 0
          ? Math.round((metric.value / metric.total) * 100) 
          : null;

        return (
          <Card key={index} className="content-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metric.value}
                {metric.total && metric.total > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {metric.total}
                  </span>
                )}
              </div>
              {progressPercentage !== null && (
                <div className="mt-2">
                  <Progress 
                    value={progressPercentage} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressPercentage}% mastery
                  </p>
                </div>
              )}
              {metric.total === null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Keep practicing! がんばって！
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

AnalyticsGrid.displayName = 'AnalyticsGrid';

export default AnalyticsGrid;
