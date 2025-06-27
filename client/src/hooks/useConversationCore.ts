/**
 * 🧩 Shared between solo and group chat
 * 🔒 Must remain mode-agnostic
 * ✅ All behavior controlled via props or context
 * ❌ No assumptions, no fallbacks — only schema-driven logic
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError, logInfo } from "@utils/logger";

export interface UseConversationCoreResult {
  loading: boolean;
  sending: boolean;
  messages: any[];
  conversation: any;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setConversation: React.Dispatch<React.SetStateAction<any>>;
  setSending: React.Dispatch<React.SetStateAction<boolean>>;
  loadMessages: (conversationId: string) => Promise<void>;
  createUserMessage: (conversationId: string, content: string) => Promise<any>;
  createAIMessage: (conversationId: string, content: string, englishTranslation?: string, personaId?: string) => Promise<any>;
}

export function useConversationCore(): UseConversationCoreResult {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const { session, user } = useAuth();
  const { toast } = useToast();

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId || !session) {
      logDebug("Skipping message load: missing conversationId or session");
      return;
    }

    try {
      logDebug("📥 Loading messages for conversation:", conversationId);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        logError("Messages fetch error:", messagesError);
        throw new Error(`Failed to load messages: ${messagesError.message}`);
      }

      setMessages(messagesData || []);
      logDebug(`✅ Loaded ${messagesData?.length || 0} messages for conversation ${conversationId}`);
    } catch (error) {
      logError("❌ Error loading messages:", error);
      toast({
        title: "Error loading messages",
        description: error?.message || "Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [session, toast]);

  const createUserMessage = useCallback(async (conversationId: string, content: string) => {
    if (!session || !user) throw new Error("Not authenticated");

    const { data: userMessage, error: userError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "user",
        content: content,
        sender_persona_id: null,
      })
      .select()
      .single();

    if (userError) {
      logError("User message error:", userError);
      throw new Error(`Failed to save user message: ${userError.message}`);
    }

    return userMessage;
  }, [session, user]);

  const createAIMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    englishTranslation?: string, 
    personaId?: string
  ) => {
    const { data: aiMessage, error: aiError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "ai",
        content: content,
        english_translation: englishTranslation || null,
        sender_persona_id: personaId || null,
      })
      .select()
      .single();

    if (aiError) {
      logError("AI message error:", aiError);
      throw new Error(`Failed to save AI message: ${aiError.message}`);
    }

    return aiMessage;
  }, []);

  return {
    loading,
    setLoading,
    sending,
    setSending,
    messages,
    setMessages,
    conversation,
    setConversation,
    loadMessages,
    createUserMessage,
    createAIMessage
  };
}