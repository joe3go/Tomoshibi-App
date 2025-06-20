
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FuriganaText from "@/components/furigana-text";
import { MessageWithVocab } from "@/components/MessageWithVocab";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Languages } from "lucide-react";
import { bind, unbind, toHiragana } from 'wanakana';
import { 
  getConversationMessages, 
  addMessage, 
  completeConversation,
  getCurrentUser 
} from "@/lib/supabase-functions";
// Avatar images are now served from /avatars/ directory as SVG files

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [romajiMode, setRomajiMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const conversationId = params?.conversationId
    ? parseInt(params.conversationId)
    : 0;

  const { data: conversationData, isLoading } = useQuery({
    queryKey: [`conversation-messages`, conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const messages = await getConversationMessages(conversationId);
      // Get conversation details from existing API for metadata
      const conversationResponse = await apiRequest("GET", `/api/conversations/${conversationId}`);
      const conversation = await conversationResponse.json();
      return {
        ...conversation,
        messages: messages || []
      };
    },
    enabled: !!conversationId,
  });

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const user = await getCurrentUser();
      if (!user) throw new Error("User not authenticated");

      // Optimistically add user message to UI
      const optimisticUserMessage = {
        id: Date.now(), // Temporary ID
        content,
        sender: 'user',
        created_at: new Date().toISOString(),
        vocab_used: [],
        grammar_used: [],
        english: null,
        feedback: null,
        suggestions: null
      };

      queryClient.setQueryData(
        [`conversation-messages`, conversationId],
        (oldData: any) => ({
          ...oldData,
          messages: [...(oldData?.messages || []), optimisticUserMessage],
        }),
      );

      // Add user message via Supabase function
      await addMessage(conversationId, 'user', content);

      // Get AI response from existing endpoint
      const aiResponse = await apiRequest(
        "POST",
        `/api/chat/secure`,
        {
          conversationId,
          message: content,
        },
      );
      const aiData = await aiResponse.json();

      // Add AI message via Supabase function
      await addMessage(
        conversationId,
        'ai',
        aiData.content,
        aiData.english,
        aiData.feedback,
        aiData.suggestions,
        aiData.vocabUsed,
        aiData.grammarUsed
      );

      // Refresh messages from Supabase
      return await getConversationMessages(conversationId);
    },
    onSuccess: (messages) => {
      // Update with fresh messages from Supabase
      queryClient.setQueryData(
        [`conversation-messages`, conversationId],
        (oldData: any) => ({
          ...oldData,
          messages: messages || [],
        }),
      );
      setMessage("");
    },
    onError: (error) => {
      // Remove the optimistic user message on error
      queryClient.setQueryData(
        [`conversation-messages`, conversationId],
        (oldData: any) => ({
          ...oldData,
          messages: oldData?.messages?.slice(0, -1) || [],
        }),
      );
      
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeConversationMutation = useMutation({
    mutationFn: async () => {
      return await completeConversation(conversationId);
    },
    onSuccess: () => {
      // Invalidate multiple query keys to refresh all conversation lists
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/completed"] });
      queryClient.invalidateQueries({ queryKey: [`conversation-messages`, conversationId] });
      
      toast({
        title: "Conversation completed!",
        description:
          "Great job! This conversation has been moved to your transcripts.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Failed to complete conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [(conversationData as any)?.messages]);

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();
      sendMessageMutation.mutate(finalMessage);
      setMessage("");
    }
  };

  // Effect to handle Wanakana binding
  useEffect(() => {
    const element = textareaRef.current;
    if (romajiMode && element) {
      bind(element, { IMEMode: 'toHiragana' });
      console.log('Wanakana bound to textarea');
    }
    
    return () => {
      if (element) {
        try {
          unbind(element);
        } catch (e) {
          console.log('Unbind cleanup completed');
        }
      }
    };
  }, [romajiMode]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
  };



  const handleFuriganaToggle = () => {
    const newState = !showFurigana;
    console.log('Furigana toggle:', showFurigana, '->', newState);
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  const getAvatarImage = (persona: any) => {
    return persona?.avatar_url || '/avatars/aoi.png'; // Use database avatar URL or fallback
  };

  if (isLoading) {
    return (
      <div className="chat-loading-container">
        <div className="chat-loading-card">
          <div className="chat-loading-content">
            <div className="chat-loading-spinner"></div>
            <span className="chat-loading-text">Loading conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="chat-error-container">
        <Card className="chat-error-card">
          <CardContent className="chat-error-content">
            <h2 className="chat-error-title">
              Conversation Not Found
            </h2>
            <p className="chat-error-description">
              This conversation doesn't exist or you don't have access to it.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="chat-error-button"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversation = (conversationData as any)?.conversation;
  const messages = (conversationData as any)?.messages || [];

  // Handle case where conversation doesn't exist
  if (!conversation) {
    return (
      <div className="chat-error-container">
        <Card className="chat-error-card">
          <h2 className="chat-error-title">
            Conversation Not Found
          </h2>
          <p className="chat-error-description">
            This conversation doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="chat-error-button"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const persona = Array.isArray(personas)
    ? personas.find((p: any) => p.id === conversation?.personaId)
    : null;
  const scenario = Array.isArray(scenarios)
    ? scenarios.find((s: any) => s.id === conversation?.scenarioId)
    : null;

  return (
    <div className="chat-page-container">
      {/* Chat Header */}
      <header className="chat-header">
        <div className="chat-header-navigation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="chat-back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="chat-header-info">
            <div className="chat-persona-avatar">
              <img
                src={getAvatarImage(persona)}
                alt={persona?.name || "Persona"}
                className="chat-persona-image w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to text avatar if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `
                    <div class="chat-persona-fallback ${
                      persona?.type === "teacher"
                        ? "chat-persona-teacher"
                        : "chat-persona-friend"
                    }">
                      <span class="chat-persona-emoji">
                        ${persona?.type === "teacher" ? "👩‍🏫" : "🧑‍🎤"}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
            <div>
              <h3 className="chat-persona-name">
                {persona?.name || "AI"}
              </h3>
              <p className="chat-scenario-title">
                {scenario?.title || "Conversation"}
              </p>
            </div>
          </div>
        </div>

        <div className="chat-header-controls">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => completeConversationMutation.mutate()}
            disabled={completeConversationMutation.isPending}
            className="chat-complete-button"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete</span>
          </Button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chat-messages-container">
        <div className="chat-messages-list">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`chat-message-wrapper ${
                msg.sender === "user" ? "chat-message-user" : "chat-message-ai"
              }`}
            >
              {msg.sender === "ai" && (
                <div className="chat-avatar chat-avatar-ai">
                  <img
                    src={getAvatarImage(persona)}
                    alt={persona?.name || "AI"}
                    className="chat-avatar-image w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to text avatar if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `
                        <div class="chat-avatar-fallback ${
                          persona?.type === "teacher"
                            ? "chat-avatar-teacher"
                            : "chat-avatar-friend"
                        }">
                          <span class="chat-avatar-text">
                            ${persona?.type === "teacher" ? "先" : "友"}
                          </span>
                        </div>
                      `;
                    }}
                  />
                </div>
              )}

              <div
                className={`message-bubble ${
                  msg.sender === "user" 
                    ? "user" 
                    : persona?.bubble_class || "ai"
                }`}
              >
                {msg.feedback && (
                  <div className="chat-message-feedback">
                    <p className="chat-feedback-text">✨ {msg.feedback}</p>
                  </div>
                )}

                <div className="chat-message-content">
                  <MessageWithVocab
                    content={msg.content}
                    className="vocab-enabled-message"
                  >
                    <FuriganaText
                      text={msg.content}
                      showFurigana={showFurigana}
                      showToggleButton={false}
                    />
                  </MessageWithVocab>
                </div>

                {msg.sender === "ai" && msg.english && (
                  <div className="mt-2">
                    <details className="text-sm text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Show English translation
                      </summary>
                      <div className="mt-1 p-2 bg-muted/50 rounded-md">
                        {msg.english}
                      </div>
                    </details>
                  </div>
                )}

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        💡 Learning suggestions ({msg.suggestions.length})
                      </summary>
                      <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                        {msg.suggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                            <span>•</span>
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="chat-avatar chat-avatar-user">
                  <span className="chat-avatar-user-text">
                    You
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Enhanced Typing Indicator */}
          {sendMessageMutation.isPending && (
            <div className="chat-message-wrapper chat-message-ai">
              <div className="chat-avatar chat-avatar-ai">
                <img
                  src={getAvatarImage(persona)}
                  alt={persona?.name || "AI"}
                  className="chat-avatar-image w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.innerHTML = `
                      <div class="chat-avatar-fallback ${
                        persona?.type === "teacher"
                          ? "chat-avatar-teacher"
                          : "chat-avatar-friend"
                      }">
                        <span class="chat-avatar-text">
                          ${persona?.type === "teacher" ? "👩‍🏫" : "🧑‍🎤"}
                        </span>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="message-bubble ai">
                <div className="chat-typing-indicator">
                  <div className="chat-typing-dots">
                    <div className="chat-typing-dot"></div>
                    <div
                      className="chat-typing-dot"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="chat-typing-dot"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="chat-typing-text">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <div className="chat-input-field-container">
            <div className="chat-input-field">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleMessageChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your response in Japanese... (English questions are welcome too!)"
                className="chat-textarea w-full p-3 border border-border rounded-md resize-none"
                rows={1}
                style={{ maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="chat-send-button ml-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {/* Input Controls */}
          <div className="mt-2 flex items-center gap-4">
            <Toggle
              pressed={romajiMode}
              onPressedChange={setRomajiMode}
              size="sm"
              className="text-xs"
            >
              <Languages className="w-3 h-3 mr-1" />
              Hiragana
            </Toggle>
            <button
              onClick={handleFuriganaToggle}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showFurigana ? "Hide Furigana" : "Show Furigana"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
