import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getGroupConversation, addMessageToGroupConversation } from "@/lib/group-conversation-mock";
import { GroupConversation, GroupMessage } from "@/../../shared/group-conversation-types";

export default function GroupChat() {
  const { conversationId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingPersonas, setTypingPersonas] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Load group conversation
  useEffect(() => {
    async function loadConversation() {
      if (!conversationId) return;
      
      try {
        const data = await getGroupConversation(conversationId);
        if (data) {
          setConversation(data);
          setMessages(data.messages);
        } else {
          setLocation('/dashboard');
        }
      } catch (error) {
        console.error('Failed to load group conversation:', error);
        setLocation('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    loadConversation();
  }, [conversationId, setLocation]);

  const handleSendMessage = async (content: string) => {
    if (!conversation || !user) return;

    setIsSending(true);
    
    try {
      // Add user message
      const userMessage: GroupMessage = {
        id: `msg-${Date.now()}`,
        content,
        sender_type: 'user',
        sender_name: user.user_metadata?.display_name || 'User',
        created_at: new Date().toISOString(),
        persona_id: null
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Simulate AI responses with typing indicators
      const activePersonas = conversation.participants.filter(p => p.is_active || p.role === 'member');
      
      // Show typing indicators for random personas
      const respondingPersonas = activePersonas
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 1);

      const personaNames = respondingPersonas
        .map(p => p.persona_name)
        .filter((name): name is string => name !== undefined);
      
      setTypingPersonas(personaNames);

      // Simulate AI responses after delays
      for (let i = 0; i < respondingPersonas.length; i++) {
        const persona = respondingPersonas[i];
        
        setTimeout(async () => {
          // Remove this persona from typing
          setTypingPersonas(prev => prev.filter(name => name !== persona.persona_name));
          
          // Add AI response
          const aiMessage: GroupMessage = {
            id: `msg-${Date.now()}-${i}`,
            content: `${persona.persona_name || 'AI'}の返事: こんにちは！${content}について話しましょう。`,
            sender_type: 'ai',
            sender_name: persona.persona_name || 'AI',
            persona_id: persona.persona_id,
            created_at: new Date().toISOString()
          };

          setMessages(prev => [...prev, aiMessage]);
          
          // Update localStorage
          await addMessageToGroupConversation(conversationId!, aiMessage);
        }, (i + 1) * 2000);
      }

      // Update localStorage with user message
      await addMessageToGroupConversation(conversationId!, userMessage);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isSending) {
      handleSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Group conversation not found</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/dashboard")}
                className="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h3 className="font-medium">{conversation.template_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {conversation.participants.filter(p => p.is_active).length} participants
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="complete-button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Participants:</span>
            {conversation.participants.filter(p => p.is_active || p.role === 'member').map(participant => (
              <div key={participant.persona_id} className="flex items-center gap-1">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={`/avatars/${participant.persona_name?.toLowerCase()}.png`} />
                  <AvatarFallback>{participant.persona_name?.[0] || 'AI'}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{participant.persona_name || 'AI'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${message.sender_type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.sender_type === 'ai' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={`/avatars/${message.sender_name?.toLowerCase()}.png`} />
                      <AvatarFallback>{message.sender_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{message.sender_name}</span>
                  </div>
                )}
                <div className={`p-3 rounded-lg ${
                  message.sender_type === 'user' 
                    ? 'bg-primary text-primary-foreground ml-auto' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicators */}
          {typingPersonas.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
              <div className="flex -space-x-2">
                {typingPersonas.map(persona => (
                  <Avatar key={persona} className="w-6 h-6 border-2 border-background">
                    <AvatarImage src={`/avatars/${persona.toLowerCase()}.png`} />
                    <AvatarFallback className="text-xs">{persona[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {typingPersonas.length === 1 ? `${typingPersonas[0]} is` : `${typingPersonas.length} people are`} typing
                </span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-card border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message to the group..."
              disabled={isSending}
              className="flex-1 min-h-[40px] max-h-[120px]"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit" 
              disabled={!inputMessage.trim() || isSending}
              size="sm"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}