
/**
 * 🧩 Shared core chat functionality
 * ✅ Common message loading, creation, and state management
 * 🔒 Mode-agnostic - works for both solo and group chats
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { logDebug, logError } from "@utils/logger";

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai';
  content: string;
  english_translation?: string;
  tutor_feedback?: string;
  suggestions?: string[];
  vocab_used?: number[];
  grammar_used?: number[];
  sender_persona_id?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  mode?: string;
  user_id: string;
  status: string;
  created_at: string;
}

export function useChatCore() {
  const { session, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    try {
      logDebug("🔍 Loading messages for conversation:", conversationId);

      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (msgError) {
        logError("Error loading messages:", msgError);
        return;
      }

      setMessages(msgData || []);
      logDebug("✅ Loaded messages:", msgData?.length || 0);
    } catch (error) {
      logError("Failed to load messages:", error);
    }
  }, []);

  // Create user message
  const createUserMessage = useCallback(async (conversationId: string, content: string) => {
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
      throw new Error("Failed to save user message");
    }

    return userMessage;
  }, []);

  // Create AI message
  const createAIMessage = useCallback(async (
    conversationId: string,
    content: string,
    englishTranslation?: string,
    senderPersonaId?: string,
    feedback?: string,
    suggestions?: string[],
    vocabUsed?: string[],
    grammarUsed?: string[]
  ) => {
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "ai",
        content: content,
        english_translation: englishTranslation || null,
        tutor_feedback: feedback || null,
        suggestions: suggestions || null,
        vocab_used: vocabUsed || [],
        grammar_used: grammarUsed || [],
        sender_persona_id: senderPersonaId || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (aiMsgError) {
      throw new Error("Failed to save AI message");
    }

    return aiMessage;
  }, []);

  return {
    // State
    loading,
    sending,
    messages,
    conversation,
    session,
    user,

    // Setters
    setLoading,
    setSending,
    setMessages,
    setConversation,

    // Methods
    loadMessages,
    createUserMessage,
    createAIMessage,
  };
}
