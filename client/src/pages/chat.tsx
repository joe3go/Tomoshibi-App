import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Settings,
  MoreHorizontal,
  Send,
  CheckCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import EnhancedFuriganaText from "@/components/enhanced-furigana-text";
import type { 
  ChatConversation, 
  ChatMessage, 
  TeachingPersona, 
  LearningScenario,
  BaseComponentProps 
} from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/utils/constants';
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";
import * as wanakana from 'wanakana';

interface ChatPageProps extends BaseComponentProps {}

const Chat: React.FC<ChatPageProps> = React.memo(() => {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [isFuriganaVisible, setIsFuriganaVisible] = useLocalStorage(STORAGE_KEYS.FURIGANA_VISIBLE, true);

  const conversationMessagesEndReference = useRef<HTMLDivElement>(null);
  const messageInputTextareaReference = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Memoized conversation ID parsing
  const activeConversationId = useMemo(() => {
    return params?.conversationId ? parseInt(params.conversationId, 10) : 0;
  }, [params?.conversationId]);

  // Optimized queries with proper typing and caching
  const { data: conversationDetails, isLoading: isLoadingConversation } = useQuery<ChatConversation>({
    queryKey: [`${API_ENDPOINTS.CONVERSATIONS}/${activeConversationId}`],
    enabled: !!activeConversationId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: availableTeachingPersonas = [] } = useQuery<TeachingPersona[]>({
    queryKey: [API_ENDPOINTS.PERSONAS],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: availableLearningScenarios = [] } = useQuery<LearningScenario[]>({
    queryKey: [API_ENDPOINTS.SCENARIOS],
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Memoized persona and scenario lookups
  const currentPersona = useMemo(() => {
    return availableTeachingPersonas.find(p => p.id === conversationDetails?.personaId);
  }, [availableTeachingPersonas, conversationDetails?.personaId]);

  const currentScenario = useMemo(() => {
    return availableLearningScenarios.find(s => s.id === conversationDetails?.scenarioId);
  }, [availableLearningScenarios, conversationDetails?.scenarioId]);

  // Optimized mutations with proper error handling
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; conversationId: number }) => {
      return apiRequest(
        'POST',
        `${API_ENDPOINTS.CONVERSATIONS}/${messageData.conversationId}/messages`,
        { content: messageData.content }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`${API_ENDPOINTS.CONVERSATIONS}/${activeConversationId}`] 
      });
      setCurrentUserMessage("");
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const endConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest('POST', `${API_ENDPOINTS.CONVERSATIONS}/${conversationId}/end`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONVERSATIONS] });
      setLocation("/dashboard");
      toast({
        title: "Conversation ended",
        description: "Great job! Your progress has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to end conversation",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  // Optimized event handlers with useCallback
  const handleSendMessage = useCallback(async () => {
    if (!currentUserMessage.trim() || !activeConversationId || sendMessageMutation.isPending) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        content: currentUserMessage.trim(),
        conversationId: activeConversationId,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, [currentUserMessage, activeConversationId, sendMessageMutation]);

  const handleEndConversation = useCallback(async () => {
    if (!activeConversationId || endConversationMutation.isPending) {
      return;
    }

    try {
      await endConversationMutation.mutateAsync(activeConversationId);
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  }, [activeConversationId, endConversationMutation]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleBackToDashboard = useCallback(() => {
    setLocation("/dashboard");
  }, [setLocation]);

  const toggleFurigana = useCallback(() => {
    setIsFuriganaVisible(prev => !prev);
  }, [setIsFuriganaVisible]);

  const scrollToBottom = useCallback(() => {
    conversationMessagesEndReference.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end"
    });
  }, []);

  // Auto-scroll effect with proper cleanup
  useEffect(() => {
    if (conversationDetails?.messages) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversationDetails?.messages, scrollToBottom]);

  // Auto-focus message input
  useEffect(() => {
    messageInputTextareaReference.current?.focus();
  }, []);

  // Memoized avatar selection
  const getPersonaAvatar = useCallback((personaName?: string) => {
    if (!personaName) return aoiAvatar;
    return personaName.toLowerCase() === 'haruki' ? harukiAvatar : aoiAvatar;
  }, []);

  // Loading state
  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state - conversation not found
  if (!conversationDetails && !isLoadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Conversation not found</h2>
          <p className="text-muted-foreground">The conversation you're looking for doesn't exist.</p>
          <Button onClick={handleBackToDashboard}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToDashboard}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
              <img
                src={getPersonaAvatar(currentPersona?.name)}
                alt={currentPersona?.name || "AI Tutor"}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-semibold text-lg">
                {currentPersona?.name || "AI Tutor"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentScenario?.title || "Conversation"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFurigana}
            className="hidden sm:flex"
          >
            Furigana {isFuriganaVisible ? "ON" : "OFF"}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted"
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationDetails?.messages?.map((message: ChatMessage) => (
          <div
            key={message.id}
            className={`flex gap-4 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.sender === "ai" && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={getPersonaAvatar(currentPersona?.name)}
                  alt={currentPersona?.name || "AI"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <Card className={`max-w-[80%] ${
              message.sender === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-card border"
            }`}>
              <CardContent className="p-4">
                {message.sender === "ai" && message.content.includes("japanese:") ? (
                  <EnhancedFuriganaText
                    text={message.content}
                    showFurigana={isFuriganaVisible}
                    className="text-sm leading-relaxed"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  
                  {message.sender === "user" && (
                    <CheckCircle className="w-4 h-4 opacity-70" />
                  )}
                </div>
              </CardContent>
            </Card>

            {message.sender === "user" && (
              <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  You
                </span>
              </div>
            )}
          </div>
        ))}
        
        <div ref={conversationMessagesEndReference} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              ref={messageInputTextareaReference}
              value={currentUserMessage}
              onChange={(e) => setCurrentUserMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message in Japanese or English..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={!currentUserMessage.trim() || sendMessageMutation.isPending}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleEndConversation}
              disabled={endConversationMutation.isPending}
              variant="outline"
              size="sm"
              className="text-xs whitespace-nowrap"
            >
              End Chat
            </Button>
          </div>
        </div>

        {sendMessageMutation.isPending && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span>Sending message...</span>
          </div>
        )}
      </div>
    </div>
  );
});

Chat.displayName = 'Chat';

export default Chat;