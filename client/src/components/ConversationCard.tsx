import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';
import type { ConversationCardProps } from '@/types/dashboard';
import { cn, dashboardUtils } from '@/lib/utils';

/**
 * Reusable conversation card component
 * Maintains exact DOM structure and styling from original dashboard
 */
export const ConversationCard = React.memo<ConversationCardProps>(({
  conversation,
  onEndSession,
  onContinue,
  className
}) => {
  const handleEndSession = () => {
    if (onEndSession) {
      onEndSession(conversation.id as any);
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(conversation.id as any);
    }
  };

  const isActive = conversation.status === 'active' || !conversation.status;
  const isCompleted = conversation.status === 'completed';

  return (
    <Card className={cn("content-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground">
            {conversation.scenario?.title ? 
              dashboardUtils.getScenarioJapanese(conversation.scenario.title) : 
              'Conversation'
            }
          </CardTitle>
          <Badge 
            variant={isCompleted ? "secondary" : "default"}
            className={cn(
              isCompleted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            )}
          >
            {isCompleted ? 'Completed' : 'Active'}
          </Badge>
        </div>
        {conversation.scenario?.description && (
          <p className="text-sm text-muted-foreground">
            {conversation.scenario.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="avatar tutor">
              {conversation.persona?.avatarUrl ? (
                <img 
                  src={conversation.persona.avatarUrl} 
                  alt={conversation.persona.name} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {conversation.persona?.name || 'AI Tutor'}
              </p>
              <p className="text-xs text-muted-foreground">
                {conversation.persona?.type === 'teacher' ? 'Teacher' : 'Friend'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isActive && onContinue && (
              <Button 
                size="sm" 
                onClick={handleContinue}
                className="flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Continue
              </Button>
            )}
            {isActive && onEndSession && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEndSession}
                className="text-foreground hover:text-primary"
              >
                End Session
              </Button>
            )}
            {isCompleted && (
              <Button 
                variant="ghost" 
                size="sm"
                disabled
                className="text-muted-foreground"
              >
                Completed
              </Button>
            )}
          </div>
        </div>
        {conversation.messageCount !== undefined && (
          <div className="mt-3 text-xs text-muted-foreground">
            {conversation.messageCount} messages exchanged
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConversationCard.displayName = 'ConversationCard';