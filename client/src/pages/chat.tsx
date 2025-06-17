
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
import EnhancedFuriganaText from "@/components/enhanced-furigana-text";
import EnhancedChatInput from "@/components/enhanced-chat-input";
import SmartMessageDisplay from "@/components/smart-message-display";
import harukiAvatar from "@assets/harukiavatar_1750137453243.png";
import aoiAvatar from "@assets/aoiavatar_1750137453242.png";

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversationId = params?.conversationId
    ? parseInt(params.conversationId)
    : 0;

  const { data: conversationData, isLoading } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
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
      // Immediately add user message to UI
      const userMessage = {
        id: Date.now(), // Temporary ID
        content,
        sender: 'user', // Fixed: changed from 'role' to 'sender' for proper rendering
        createdAt: new Date().toISOString(),
        vocabUsed: [],
        grammarUsed: []
      };

      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
        (oldData: any) => ({
          ...oldData,
          messages: [...(oldData?.messages || []), userMessage],
        }),
      );

      // Send to server
      const response = await apiRequest(
        "POST",
        `/api/conversations/${conversationId}/messages`,
        {
          content,
        },
      );
      return await response.json();
    },
    onSuccess: (messages) => {
      // Replace with actual messages from server
      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
        (oldData: any) => ({
          ...oldData,
          messages,
        }),
      );
      setMessage("");
    },
    onError: (error) => {
      // Remove the optimistic user message on error
      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
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
      const response = await apiRequest(
        "PATCH",
        `/api/conversations/${conversationId}`,
        {
          status: "completed",
          completedAt: new Date().toISOString(),
        },
      );
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate multiple query keys to refresh all conversation lists
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/completed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      
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
      sendMessageMutation.mutate(message.trim());
    }
  };



  const handleFuriganaToggle = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  const getAvatarImage = (persona: any) => {
    if (persona?.type === "teacher") return aoiAvatar; // Aoi is the female teacher
    if (persona?.type === "friend") return harukiAvatar; // Haruki is the male friend
    return aoiAvatar; // Default fallback
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
                className={`message-bubble ${msg.sender === "user" ? "user" : "ai"}`}
              >
                <SmartMessageDisplay
                  content={msg.content}
                  englishTranslation={msg.english}
                  feedback={msg.feedback}
                  suggestions={msg.suggestions || []}
                  sender={msg.sender}
                  showFurigana={showFurigana}
                  isAiResponse={msg.sender === "ai"}
                />
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

      {/* Enhanced Chat Input with Wanakana and Furigana controls */}
      <EnhancedChatInput
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        showFurigana={showFurigana}
        onToggleFurigana={handleFuriganaToggle}
        placeholder="Type your response in Japanese... (English questions are welcome too!)"
      />
    </div>
  );
}
