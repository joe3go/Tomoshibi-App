import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FuriganaText from "@/components/furigana-text";
import { MessageWithVocab } from "@/components/MessageWithVocab";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Languages } from "lucide-react";
import { bind, unbind, toHiragana } from "wanakana";
import {
  getConversationMessages,
  addMessage,
  completeConversation,
  getCurrentUser,
  extractPersonaFromTitle,
} from "@/lib/supabase-functions";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
import { isValidUUID } from "../../../shared/validation";

// Message Item Component for better rendering control
function MessageItem({ message, showFurigana, persona }: { 
  message: any, 
  showFurigana: boolean,
  persona: any
}) {
  const isUser = message.sender_type === "user";
  const isAI = message.sender_type === "ai";

  const getAvatarImage = (persona: any) => {
    return persona?.avatar_url || "/avatars/aoi.png";
  };

  return (
    <div
      className={`chat-message-wrapper ${
        isUser ? "chat-message-user" : "chat-message-ai"
      }`}
    >
      {isAI && (
        <div className="chat-avatar chat-avatar-ai">
          <img
            src={getAvatarImage(persona)}
            alt={persona?.name || "AI"}
            className="chat-avatar-image w-8 h-8 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.innerHTML = `
                <div class="chat-avatar-fallback">
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
          isUser ? "user" : persona?.bubble_class || "ai"
        }`}
      >
        {(message.tutor_feedback || message.feedback) && (
          <div className="chat-message-feedback">
            <p className="chat-feedback-text">
              ✨ {message.tutor_feedback || message.feedback}
            </p>
          </div>
        )}

        <div className="chat-message-content">
          <MessageWithVocab
            content={message.content}
            className="vocab-enabled-message"
          >
            <FuriganaText
              text={message.content}
              showFurigana={showFurigana}
              showToggleButton={false}
            />
          </MessageWithVocab>
        </div>

        {isAI && (message.english_translation || message.english) && (
          <div className="mt-2">
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Show English translation
              </summary>
              <div className="mt-1 p-2 bg-muted/50 rounded-md">
                {message.english_translation || message.english}
              </div>
            </details>
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                💡 Learning suggestions ({message.suggestions.length})
              </summary>
              <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                {message.suggestions.map(
                  (suggestion: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-blue-800 dark:text-blue-200"
                    >
                      <span>•</span>
                      <span>{suggestion}</span>
                    </div>
                  ),
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {isUser && (
        <div className="chat-avatar chat-avatar-user">
          <span className="chat-avatar-user-text">You</span>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, session } = useAuth();
  const isAuthenticated = !!session;
  const [message, setMessage] = useState("");
  const [romajiMode, setRomajiMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tempIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  const conversationId = params?.conversationId || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the chat",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [authLoading, session, setLocation, toast]);

  // Simplified conversation data query with combined fetch
  const {
    data: conversationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!session || !user || !conversationId) return null;

      console.log("🔍 Fetching conversation data for ID:", conversationId);

      // Fetch conversation and messages in a single query
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (convError || !conversation) {
        console.error("❌ Conversation not found:", convError);
        throw new Error("Conversation not found or access denied");
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("❌ Error fetching messages:", msgError);
        throw new Error("Failed to fetch messages");
      }

      console.log("✅ Conversation and messages loaded:", {
        conversationId: conversation.id,
        messageCount: messages?.length || 0,
      });

      return {
        conversation,
        messages: messages || [],
      };
    },
    enabled: !!conversationId && !!session && !!user,
    gcTime: 0, // Reduce cache issues
    refetchOnWindowFocus: false,
  });

  // Fetch personas directly from Supabase
  const { data: personas = [] } = useQuery({
    queryKey: ["personas-supabase"],
    queryFn: async () => {
      if (!session) return [];

      const { data, error } = await supabase.from("personas").select("*");

      if (error) {
        console.error("Error fetching personas:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!session,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  // Simplified message mutation with proper optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!session || !user) {
        throw new Error("No active session found. Please log in again.");
      }

      console.log("📤 Sending message to conversation:", conversationId);

      // Add user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "user",
          content: content,
          sender_persona_id: null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userMsgError) {
        console.error("❌ Failed to add user message:", userMsgError);
        throw new Error("Failed to send message");
      }

      // Get AI response
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/chat/secure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession?.access_token}`,
        },
        body: JSON.stringify({
          conversationId,
          message: content,
          tutorId: validPersonaId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ AI response error:", response.status, errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const aiData = await response.json();

      if (!aiData || !aiData.content) {
        console.error("❌ Invalid AI response structure:", aiData);
        throw new Error("AI response is missing required content");
      }

      // Add AI message
      const aiMessageData = {
        conversation_id: conversationId,
        sender_type: 'ai',
        content: aiData.content || '',
        english_translation: aiData.english_translation || null,
        tutor_feedback: aiData.feedback || null,
        suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : 
                    aiData.suggestions ? [aiData.suggestions] : null,
        vocab_used: Array.isArray(aiData.vocabUsed) ? aiData.vocabUsed : [],
        grammar_used: Array.isArray(aiData.grammarUsed) ? aiData.grammarUsed : [],
        sender_persona_id: validPersonaId,
        created_at: new Date().toISOString(),
      };

      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('messages')
        .insert(aiMessageData)
        .select()
        .single();

      if (aiMsgError) {
        console.error("❌ Failed to add AI message:", aiMsgError);
        throw new Error("Failed to save AI response");
      }

      console.log("✅ Messages added successfully");

      return {
        userMessage,
        aiMessage
      };
    },
    onMutate: async (content: string) => {
      // Store temporary ID
      tempIdRef.current = `temp_${Date.now()}`;
      const tempId = tempIdRef.current;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["conversation", conversationId],
      });

      // Get previous data
      const previousData = queryClient.getQueryData([
        "conversation",
        conversationId,
      ]);

      // Optimistic update - only add temporary user message
      queryClient.setQueryData(["conversation", conversationId], (old: any) => {
        if (!old) return old;

        const optimisticUserMessage = {
          id: tempId,
          sender_type: "user",
          content: content,
          sender_persona_id: null,
          english_translation: null,
          tutor_feedback: null,
          suggestions: null,
          vocab_used: null,
          grammar_used: null,
          created_at: new Date().toISOString(),
        };

        return {
          ...old,
          messages: [...(old.messages || []), optimisticUserMessage],
        };
      });

      return { previousData, tempId };
    },
    onSuccess: async (data) => {
      setMessage("");

      // Immediately update cache with real messages from server response
      queryClient.setQueryData(["conversation", conversationId], (old: any) => {
        if (!old) return old;

        // Remove temporary message and add real messages
        const messagesWithoutTemp = (old.messages || []).filter(
          (msg: any) => !msg.id.toString().startsWith('temp_')
        );

        return {
          ...old,
          messages: [
            ...messagesWithoutTemp,
            data.userMessage,
            data.aiMessage
          ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        };
      });

      // Scroll to bottom after immediate update
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (error, content, context) => {
      console.error("❌ Message send failed:", error.message);

      const tempId = context?.tempId || tempIdRef.current;

      // Remove optimistic message on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ["conversation", conversationId],
          context.previousData,
        );
      }

      // Handle specific error types
      if (error.message.includes("session") || error.message.includes("authenticated")) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        setLocation("/login");
        return;
      }

      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const completeConversationMutation = useMutation({
    mutationFn: async () => {
      if (!session || !user) {
        throw new Error("No active session found. Please log in again.");
      }

      const { error } = await supabase
        .from("conversations")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error("Failed to complete conversation");
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation completed!",
        description: "Great job! This conversation has been moved to your transcripts.",
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

  // Simple polling fallback for Supabase free tier (no Realtime)
  useEffect(() => {
    if (!conversationId || sendMessageMutation.isPending) return;

    const interval = setInterval(() => {
      // Only poll if user is not actively sending messages
      if (!sendMessageMutation.isPending) {
        queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [conversationId, sendMessageMutation.isPending, queryClient]);

  // Auto-scroll effect
  useEffect(() => {
    if (conversationData?.messages) {
      console.log('📜 Messages updated, scrolling to bottom. Count:', conversationData.messages.length);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationData?.messages]);

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      const finalMessage = romajiMode
        ? toHiragana(message.trim())
        : message.trim();
      sendMessageMutation.mutate(finalMessage);
    }
  };

  // Wanakana binding effect
  useEffect(() => {
    const element = textareaRef.current;
    if (romajiMode && element) {
      bind(element, { IMEMode: "toHiragana" });
    }

    return () => {
      if (element) {
        try {
          unbind(element);
        } catch (e) {
          console.log("Unbind cleanup completed");
        }
      }
    };
  }, [romajiMode]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFuriganaToggle = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  const getAvatarImage = (persona: any) => {
    return persona?.avatar_url || "/avatars/aoi.png";
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="chat-loading-container">
        <div className="chat-loading-card">
          <div className="chat-loading-content">
            <div className="chat-loading-spinner"></div>
            <span className="chat-loading-text">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
            <h2 className="chat-error-title">Conversation Not Found</h2>
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

  const conversation = conversationData?.conversation;
  const messages = conversationData?.messages || [];

  if (!conversation) {
    return (
      <div className="chat-error-container">
        <Card className="chat-error-card">
          <h2 className="chat-error-title">Conversation Not Found</h2>
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

  // Extract persona ID
  const { personaId } = extractPersonaFromTitle(conversation?.title || "");
  const validPersonaId = personaId && isValidUUID(personaId) ? personaId : null;

  const persona = Array.isArray(personas)
    ? personas.find((p: any) => p.id === validPersonaId)
    : null;
  const scenario = Array.isArray(scenarios)
    ? scenarios.find((s: any) => s.id === conversation?.scenario_id)
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
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `
                    <div class="chat-persona-fallback">
                      <span class="chat-persona-emoji">
                        ${persona?.type === "teacher" ? "👩‍🏫" : "🧑‍🎤"}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
            <div>
              <h3 className="chat-persona-name">{persona?.name || "AI"}</h3>
              <p className="chat-scenario-title">
                {scenario?.title ||
                  conversation?.title.split("|")[0] ||
                  "Conversation"}
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
            <MessageItem 
              key={msg.id} 
              message={msg} 
              showFurigana={showFurigana}
              persona={persona}
            />
          ))}

          {/* Enhanced Typing Indicator */}
          {sendMessageMutation.isPending && (
            <div className="chat-message-wrapper chat-message-ai">
              <div className="chat-avatar chat-avatar-ai">
                <img
                  src={getAvatarImage(persona)}
                  alt={persona?.name || "AI"}
                  className="chat-avatar-image w-8 h-8 rounded-full object-cover"
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
                  <span className="chat-typing-text">Thinking...</span>
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
                placeholder={romajiMode 
                  ? "Type in romaji (converts to hiragana)..." 
                  : "Type your response in Japanese... (English questions are welcome too!)"}
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