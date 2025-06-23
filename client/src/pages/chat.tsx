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
  getCurrentUser,
  extractPersonaFromTitle
} from "@/lib/supabase-functions";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
// Avatar images are now served from /avatars/ directory as SVG files

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
  const { toast } = useToast();

  const conversationId = params?.conversationId || null;

  // Redirect to login if not authenticated (only after loading is complete)
  useEffect(() => {
    if (!authLoading && !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the chat",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [authLoading, session, setLocation, toast]);

  // Fetch conversation data using Supabase directly
  const { data: conversationData, isLoading, error } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      console.log('🔍 Fetching conversation data for ID:', conversationId, 'Type:', typeof conversationId);

      if (!session) {
        console.error('❌ No Supabase session found');
        throw new Error('Authentication required');
      }

      // Get conversation directly from Supabase
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conversation) {
        console.error('❌ Conversation not found:', convError);
        throw new Error('Conversation not found or access denied');
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('❌ Error fetching messages:', msgError);
        throw new Error('Failed to fetch messages');
      }

      console.log('✅ Conversation and messages loaded:', {
        conversationId: conversation.id,
        messageCount: messages?.length || 0
      });

      return {
        conversation,
        messages: messages || []
      };
    },
    enabled: !!conversationId && !!session && !!user,
  });

  // Fetch personas directly from Supabase for consistency
  const { data: personas = [] } = useQuery({
    queryKey: ["personas-supabase"],
    queryFn: async () => {
      if (!session) return [];

      const { data, error } = await supabase
        .from('personas')
        .select('*');

      if (error) {
        console.error('Error fetching personas:', error);
        return [];
      }

      console.log('Personas fetched from Supabase:', data);
      return data || [];
    },
    enabled: !!session,
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Check session from auth hook
      if (!session || !user) {
        throw new Error("No active session found. Please log in again.");
      }

      console.log('📤 Sending message to conversation:', conversationId);

      // Add user message using the updated schema
      const { error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'user',
          content: content,
          sender_persona_id: null, // User messages don't have persona
          created_at: new Date().toISOString()
        });

      if (userMsgError) {
        console.error('❌ Failed to add user message:', userMsgError);
        throw new Error('Failed to send message');
      }

      // Get AI response using Supabase session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      const response = await fetch('/api/chat/secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession?.access_token}`
        },
        body: JSON.stringify({
          conversationId,
          message: content,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI response error:', response.status, errorText);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const aiData = await response.json();

      // Add AI message using the updated schema
      const { error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'ai',
          content: aiData.content,
          english_translation: aiData.english,
          tutor_feedback: aiData.feedback,
          suggestions: aiData.suggestions,
          vocab_used: aiData.vocabUsed,
          grammar_used: aiData.grammarUsed,
          sender_persona_id: aiData.tutorId, // AI messages have persona
          created_at: new Date().toISOString()
        });

      if (aiMsgError) {
        console.error('❌ Failed to add AI message:', aiMsgError);
        throw new Error('Failed to save AI response');
      }

      // Return updated messages with persona information
      const { data: updatedMessages, error: fetchError } = await supabase
        .from('messages')
        .select(`
          id,
          sender_type,
          content,
          english_translation,
          tutor_feedback,
          suggestions,
          vocab_used,
          grammar_used,
          sender_persona_id,
          created_at,
          personas(name, bubble_class)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Failed to fetch updated messages:', fetchError);
        throw new Error('Failed to refresh messages');
      }

      return updatedMessages || [];
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

      // Handle auth errors
      if (error.message.includes("session") || error.message.includes("authenticated")) {
        localStorage.removeItem('token');
        setLocation('/login');
        return;
      }

      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeConversationMutation = useMutation({
    mutationFn: async () => {
      // Check session from auth hook
      if (!session || !user) {
        throw new Error("No active session found. Please log in again.");
      }

      console.log('🏁 Completing conversation:', conversationId);

      // Update conversation status directly in Supabase
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to complete conversation:', error);
        throw new Error('Failed to complete conversation');
      }

      return { success: true };
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

  // Show loading while auth is being determined
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

  // Don't render if not authenticated
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

  // Extract persona ID from encoded title since persona_id column doesn't exist yet
  const { personaId } = extractPersonaFromTitle(conversation?.title || "");

  // Import validation function
  const { isValidUUID } = require("../../../shared/validation");

  // Validate extracted persona ID
  const validPersonaId = personaId && isValidUUID(personaId) ? personaId : null;

  console.log('🔍 Chat page - conversation data:', {
    conversationId: conversation?.id,
    extractedPersonaId: personaId,
    validPersonaId,
    title: conversation?.title,
    scenarioId: conversation?.scenario_id,
  });

  const persona = Array.isArray(personas)
    ? personas.find((p: any) => p.id === validPersonaId)
    : null;
  const scenario = Array.isArray(scenarios)
    ? scenarios.find((s: any) => s.id === conversation?.scenario_id)
    : null;

  console.log('🔍 Found persona:', persona?.name, 'Found scenario:', scenario?.title);

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
                msg.role === "user" ? "chat-message-user" : "chat-message-ai"
              }`}
            >
              {msg.role === "ai" && (
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
                  msg.role === "user" 
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

                {msg.role === "ai" && msg.english && (
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

              {msg.role === "user" && (
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