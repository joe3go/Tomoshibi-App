
import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, User } from 'lucide-react';
import type { ConversationCardProps } from '@/types/dashboard';

const ConversationCard = memo<ConversationCardProps>(({ 
  conversation, 
  persona, 
  scenario, 
  onClick 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPersonaEmoji = (type: string) => {
    return type === 'teacher' ? '👩‍🏫' : '🧑‍🎤';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card 
      className="content-card cursor-pointer hover:shadow-lg transition-all duration-200 tomoshibi-glow"
      onClick={() => onClick(conversation.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getPersonaEmoji(persona?.type || 'teacher')}</span>
            <div>
              <h3 className="font-medium text-foreground">
                {persona?.name || 'AI Tutor'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {scenario?.title || 'Conversation'}
              </p>
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
            {conversation.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            Started {formatDate(conversation.startedAt)}
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3 mr-1" />
            Phase: {conversation.phase}
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            {persona?.jlptLevel || 'N5'} Level
          </div>
        </div>

        {conversation.status === 'active' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Continue Learning</span>
              <span className="text-xs text-primary">→</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConversationCard.displayName = 'ConversationCard';

export default ConversationCard;
