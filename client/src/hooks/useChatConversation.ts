
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { logDebug, logError } from "@utils/logger";
import type { Persona } from "@/types/personas";

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
  user_id: string;
  status: string;
  mode?: string;
  persona_id?: string;
  template_id?: string;
  created_at: string;
}

export function useChatConversation(conversationId: string | null) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !user || !conversationId) {
      setLoading(false);
      return;
    }

    loadConversationData();
  }, [conversationId, session, user]);

  const loadConversationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user?.id)
        .single();

      if (convError || !convData) {
        throw new Error("Conversation not found or access denied");
      }

      setConversation(convData);
      logDebug('🔍 Conversation loaded:', convData);

      // Load messages
      await loadMessages();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load conversation";
      setError(errorMessage);
      logError("Error loading conversation:", error);
      
      toast({
        title: "Error loading conversation",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
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
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  };

  const completeConversation = async () => {
    try {
      await supabase
        .from("conversations")
        .update({ status: "completed" })
        .eq("id", conversationId);

      toast({
        title: "Conversation completed",
        description: "This conversation has been marked as completed.",
      });

    } catch (error) {
      toast({
        title: "Failed to complete conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    conversation,
    messages,
    loading,
    error,
    addMessage,
    updateMessage,
    completeConversation,
    refetch: loadConversationData
  };
}
