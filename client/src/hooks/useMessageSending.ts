
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { toHiragana } from "wanakana";
import { logError } from "@utils/logger";

interface SendMessageOptions {
  conversationId: string;
  tutorId?: string;
  isGroupConversation?: boolean;
  groupTopic?: string;
  groupContext?: string;
  allParticipants?: { id: string; name: string }[];
}

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

// Vocabulary tracking function
const trackVocabularyUsage = async (
  text: string, 
  source: 'user' | 'ai', 
  session: any, 
  tutorId?: string, 
  conversationId?: string
) => {
  try {
    await fetch('/api/vocab-tracker/increment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ 
        text, 
        source,
        tutorId,
        conversationId,
        messageLength: text.length
      })
    });
  } catch (error) {
    console.log("Vocabulary tracking failed:", error);
  }
};

export function useMessageSending() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const sendMessage = async (
    message: string,
    romajiMode: boolean,
    options: SendMessageOptions,
    onUserMessage?: (message: Message) => void,
    onAiMessage?: (message: Message) => void
  ) => {
    if (!message.trim() || sending || !session || !user) return;

    const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();

    try {
      setSending(true);

      // Create user message
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: options.conversationId,
          sender_type: "user",
          content: finalMessage,
          sender_persona_id: null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        throw new Error("Failed to save user message");
      }

      // Add user message to UI immediately
      onUserMessage?.(userMessage);

      // Track vocabulary usage for user message
      try {
        await trackVocabularyUsage(
          finalMessage, 
          'user', 
          session, 
          options.tutorId, 
          options.conversationId
        );
      } catch (error) {
        console.log("Vocabulary tracking failed:", error);
      }

      // Get AI response
      const response = await fetch("/api/chat/secure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: finalMessage,
          conversationId: options.conversationId,
          tutorId: options.tutorId || "",
          groupTopic: options.groupTopic,
          groupContext: options.groupContext,
          isGroupConversation: options.isGroupConversation,
          allParticipants: options.allParticipants
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiData = await response.json();

      // Create AI message
      const { data: aiMessage, error: aiError } = await supabase
        .from("messages")
        .insert({
          conversation_id: options.conversationId,
          sender_type: "ai",
          content: aiData.content || '',
          english_translation: aiData.english_translation || null,
          tutor_feedback: aiData.feedback || null,
          suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : null,
          vocab_used: Array.isArray(aiData.vocabUsed) ? aiData.vocabUsed : [],
          grammar_used: Array.isArray(aiData.grammarUsed) ? aiData.grammarUsed : [],
          sender_persona_id: options.tutorId || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (aiError) {
        throw new Error("Failed to save AI message");
      }

      // Add AI message to UI
      onAiMessage?.(aiMessage);

      // Track vocabulary usage for AI message
      try {
        await trackVocabularyUsage(
          aiData.content || '', 
          'ai', 
          session, 
          options.tutorId, 
          options.conversationId
        );
      } catch (error) {
        console.log("AI vocabulary tracking failed:", error);
      }

    } catch (error) {
      logError("❌ Message send failed:", error);
      
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sending
  };
}
