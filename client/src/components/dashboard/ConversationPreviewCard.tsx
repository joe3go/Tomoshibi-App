
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, ChevronRight, X } from "lucide-react";
import { getAvatarImage } from "@/lib/analytics";

interface ConversationPreviewCardProps {
  conversations: any[];
  tutorsData: any[];
  onResumeChat: (conversationId: string | number) => void;
  onEndChat: (conversationId: string | number) => void;
  isEndingConversation: boolean;
}

export default function ConversationPreviewCard({ 
  conversations, 
  tutorsData, 
  onResumeChat, 
  onEndChat, 
  isEndingConversation 
}: ConversationPreviewCardProps) {
  const activeConversations = Array.isArray(conversations) ? 
    conversations.filter((conv: any) => conv.status === 'active') : [];

  return (
    <div className="recent-conversations-section">
      <Card className="section-card">
        <CardHeader className="section-header">
          <CardTitle className="section-title">
            <MessageCircle className="w-5 h-5" />
            Recent Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="section-content">
          {activeConversations.length > 0 ? (
            <div className="conversations-list">
              {activeConversations.slice(0, 3).map((conversation: any) => {
                const isGroupConv = conversation.mode === 'group';
                const persona = tutorsData.find((p: any) => p.id === conversation.persona_id);

                return (
                  <div key={conversation.id} className="conversation-card">
                    <div className="conversation-info">
                      <Avatar className="conversation-avatar">
                        <AvatarImage src={getAvatarImage(persona)} alt={persona?.name || (isGroupConv ? 'Group' : 'Tutor')} />
                        <AvatarFallback>{isGroupConv ? 'G' : (persona?.name?.[0] || 'T')}</AvatarFallback>
                      </Avatar>
                      <div className="conversation-details">
                        <p className="conversation-tutor">
                          {isGroupConv ? conversation.title : (persona?.name || 'Unknown Tutor')}
                        </p>
                        <p className="conversation-summary">
                          {isGroupConv ? 'Group conversation' : 'Active conversation'}
                        </p>
                      </div>
                    </div>
                    <div className="conversation-actions">
                      <Button 
                        size="sm" 
                        onClick={() => onResumeChat(conversation.id)}
                        className="resume-btn"
                      >
                        Resume
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onEndChat(conversation.id)}
                        className="end-chat-btn"
                        disabled={isEndingConversation}
                      >
                        <X className="w-4 h-4" />
                        End Chat
                      </Button>
                    </div>
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
  );
}
