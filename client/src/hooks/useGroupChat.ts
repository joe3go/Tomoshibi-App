
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { logDebug, logError } from "@utils/logger";
import type { Persona } from "@/types/personas";

interface GroupMessage {
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

interface GroupConversation {
  id: string;
  title: string;
  user_id: string;
  status: string;
  mode?: string;
  template_id?: string;
  created_at: string;
}

interface GroupChatState {
  lastSpeaker: string | null;
  consecutiveCount: number;
  lastResponseTime: number;
  cooldownActive: boolean;
}

export function useGroupChat(conversationId: string | null) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<GroupConversation | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [participants, setParticipants] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingPersonas, setTypingPersonas] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [groupState, setGroupState] = useState<GroupChatState>({
    lastSpeaker: null,
    consecutiveCount: 0,
    lastResponseTime: 0,
    cooldownActive: false
  });

  useEffect(() => {
    if (!session || !user || !conversationId) {
      setLoading(false);
      return;
    }

    loadGroupConversationData();
  }, [conversationId, session, user]);

  const loadGroupConversationData = async () => {
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
        throw new Error("Group conversation not found or access denied");
      }

      setConversation(convData);
      logDebug('🔍 Group conversation loaded:', convData);

      // Load messages
      await loadMessages();
      
      // Load participants
      await loadParticipants();
      
      setIsInitialized(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load group conversation";
      setError(errorMessage);
      logError("Error loading group conversation:", error);
      
      toast({
        title: "Error loading group conversation",
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
      logError("Error loading group messages:", msgError);
      return;
    }

    setMessages(msgData || []);
  };

  const loadParticipants = async () => {
    try {
      const { data: participantData, error: participantError } = await supabase
        .from("conversation_participants")
        .select(`
          persona_id,
          personas (
            id, name, type, avatar_url, description
          )
        `)
        .eq("conversation_id", conversationId);

      if (participantError) {
        logError("Error loading participants:", participantError);
        return;
      }

      const personaList = participantData
        ?.map(p => p.personas)
        .filter(Boolean) || [];

      setParticipants(personaList);
      logDebug('🧠 Loaded group participants:', personaList.map(p => p.name));
    } catch (error) {
      logError("Error loading group participants:", error);
    }
  };

  const addMessage = (message: GroupMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const updateGroupState = (updates: Partial<GroupChatState>) => {
    setGroupState(prev => ({ ...prev, ...updates }));
  };

  const getNextAISpeaker = (currentMessages: GroupMessage[]): Persona | null => {
    if (participants.length === 0) return null;

    // Get recent AI messages
    const recentAIMessages = currentMessages
      .filter(m => m.sender_type === 'ai' && m.sender_persona_id)
      .slice(-5); // Look at last 5 AI messages

    // Count recent responses per persona
    const recentCounts = participants.reduce((acc, persona) => {
      acc[persona.id] = recentAIMessages.filter(m => m.sender_persona_id === persona.id).length;
      return acc;
    }, {} as Record<string, number>);

    // Find persona with least recent activity
    let selectedPersona = participants[0];
    let minCount = recentCounts[selectedPersona.id] || 0;

    for (const persona of participants) {
      const count = recentCounts[persona.id] || 0;
      if (count < minCount) {
        minCount = count;
        selectedPersona = persona;
      }
    }

    return selectedPersona;
  };

  const shouldAllowAIResponse = (): boolean => {
    const now = Date.now();
    const timeSinceLastResponse = now - groupState.lastResponseTime;
    const cooldownPeriod = 8000; // 8 seconds

    // Check cooldown
    if (timeSinceLastResponse < cooldownPeriod) {
      return false;
    }

    // Check consecutive responses
    if (groupState.consecutiveCount >= 2) {
      return false;
    }

    return true;
  };

  const completeConversation = async () => {
    try {
      await supabase
        .from("conversations")
        .update({ status: "completed" })
        .eq("id", conversationId);

      toast({
        title: "Group conversation completed",
        description: "This group conversation has been marked as completed.",
      });

    } catch (error) {
      toast({
        title: "Failed to complete conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
          mode: 'group'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      logDebug('✅ Message sent successfully:', result);
      
      // Reload messages to get the latest state
      await loadMessages();
      
    } catch (error) {
      logError('❌ Error sending message:', error);
      throw error;
    }
  };

  const initializeGroupChat = () => {
    if (conversationId && user && session) {
      loadGroupConversationData();
    }
  };

  return {
    conversation,
    messages,
    groupPersonas: participants,
    isLoading: loading,
    error,
    groupState,
    typingPersonas,
    isInitialized,
    addMessage,
    updateGroupState,
    getNextAISpeaker,
    shouldAllowAIResponse,
    completeConversation,
    sendMessage,
    initializeGroupChat,
    refetch: loadGroupConversationData
  };
}
