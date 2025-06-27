
/**
 * 🧩 Group chat specific logic
 * ✅ Handles multiple personas and context-based response selection
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useConversationCore } from "./useConversationCore";
import { logDebug, logError, logInfo } from "@utils/logger";
import type { GroupPersona, GroupChatState } from "@/types/chat";
import { toHiragana } from "wanakana";

export function useGroupChat(conversationId: string) {
  const core = useConversationCore();
  const { session, user } = useAuth();
  const { toast } = useToast();
  
  const [groupPersonas, setGroupPersonas] = useState<GroupPersona[]>([]);
  const [typingPersonas, setTypingPersonas] = useState<Set<string>>(new Set());
  
  const groupChatStates = useRef<Map<string, GroupChatState>>(new Map());
  const responseCooldown = 8000;

  // Load group conversation and personas
  const loadGroupConversation = useCallback(async () => {
    try {
      core.setLoading?.(true);

      // Load conversation details
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          title,
          mode,
          template_id,
          conversation_templates:template_id (
            title,
            default_personas,
            group_prompt_suffix
          )
        `)
        .eq("id", conversationId)
        .eq("mode", "group")
        .single();

      if (convError || !convData) {
        throw new Error("Group conversation not found");
      }

      core.setConversation(convData);

      // Load group personas from template
      const personaIds = convData.conversation_templates?.default_personas || [
        "8b0f056c-41fb-4c47-baac-6029c64e026a", // Keiko
        "9612651e-d1df-428f-865c-2a1c005952ef", // Aoi
        "e73a0afc-3ee9-4886-b39a-c6f516ad7db7"  // Haruki
      ];

      const { data: personasData, error: personasError } = await supabase
        .from("personas")
        .select("id, name, avatar_url, personality, speaking_style")
        .in("id", personaIds);

      if (!personasError && personasData) {
        setGroupPersonas(personasData);
      }

      // Load messages
      await core.loadMessages(conversationId);

    } catch (error) {
      logError("Error loading group conversation:", error);
      toast({
        title: "Error loading conversation",
        description: "Please try again or return to dashboard.",
        variant: "destructive",
      });
    } finally {
      core.setLoading?.(false);
    }
  }, [conversationId, core, toast]);

  // Smart persona selection based on context
  const getNextAISpeaker = useCallback((): string => {
    if (groupPersonas.length === 0) return "";

    // Check if user mentioned a specific persona
    const userMessages = core.messages.filter(m => m.sender_type === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage) {
      const userMessage = lastUserMessage.content.toLowerCase();
      for (const persona of groupPersonas) {
        const name = persona.name.toLowerCase();
        if (userMessage.includes(name) || 
            userMessage.includes(`${name}さん`) || 
            userMessage.includes(`${name}は`) ||
            userMessage.includes(`${name}が`)) {
          logDebug(`User mentioned ${persona.name}, they will respond next`);
          return persona.id;
        }
      }
    }

    // Use round-robin with some randomness
    const lastAIMessage = core.messages
      .filter(msg => msg.sender_type === 'ai' && msg.sender_persona_id)
      .pop();

    if (!lastAIMessage?.sender_persona_id) {
      return groupPersonas[0].id;
    }

    const lastSpeakerIndex = groupPersonas.findIndex(p => p.id === lastAIMessage.sender_persona_id);
    const nextIndex = (lastSpeakerIndex + 1) % groupPersonas.length;
    
    // 15% chance of random speaker for natural flow
    if (Math.random() < 0.15) {
      const randomIndex = Math.floor(Math.random() * groupPersonas.length);
      return groupPersonas[randomIndex].id;
    }
    
    return groupPersonas[nextIndex].id;
  }, [groupPersonas, core.messages]);

  // Check if response should be throttled
  const checkResponseThrottling = useCallback((): boolean => {
    if (groupPersonas.length === 0) return true;

    // Always allow response if user mentioned someone
    const lastUserMessage = core.messages[core.messages.length - 1];
    if (lastUserMessage?.sender_type === 'user') {
      const userMessage = lastUserMessage.content.toLowerCase();
      for (const persona of groupPersonas) {
        const name = persona.name.toLowerCase();
        if (userMessage.includes(name) || userMessage.includes(`${name}さん`)) {
          return true;
        }
      }
    }

    // Check cooldown
    const representativePersona = groupPersonas[0];
    const stateKey = `${conversationId}_${representativePersona.id}`;
    const currentState = groupChatStates.current.get(stateKey) || {
      lastResponseTimestamp: 0,
      consecutiveResponses: 0
    };

    if (Date.now() - currentState.lastResponseTimestamp < responseCooldown) {
      return false;
    }

    return true;
  }, [groupPersonas, core.messages, conversationId, responseCooldown]);

  // Send message with group logic
  const sendMessage = useCallback(async (message: string, romajiMode: boolean = false) => {
    if (!message.trim() || core.sending || !session || !user) return;

    const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();
    
    try {
      core.setSending(true);

      // Handle first message (introductions)
      if (core.messages.length === 0) {
        await handleFirstMessage(finalMessage);
        return;
      }

      // Create user message
      const userMessage = await core.createUserMessage(conversationId, finalMessage);
      core.setMessages(prev => [...prev, userMessage]);

      // Check if AI should respond
      const shouldGenerateResponse = checkResponseThrottling();
      
      if (!shouldGenerateResponse && core.messages.filter(m => m.sender_type === 'ai').length > 0) {
        core.setSending(false);
        return;
      }

      // Get next AI speaker
      const nextSpeakerId = getNextAISpeaker();
      const speakingPersona = groupPersonas.find(p => p.id === nextSpeakerId);
      
      if (speakingPersona) {
        setTypingPersonas(prev => new Set(prev).add(nextSpeakerId));
        
        // Natural delay
        const delay = Math.random() * 2000 + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        setTypingPersonas(prev => {
          const newSet = new Set(prev);
          newSet.delete(nextSpeakerId);
          return newSet;
        });
      }
      
      // Get group context
      const { data: conversation } = await supabase
        .from("conversations")
        .select(`
          title,
          conversation_templates (
            title,
            group_prompt_suffix
          )
        `)
        .eq("id", conversationId)
        .single();

      const groupTopic = conversation?.conversation_templates?.title || conversation?.title || "group conversation";
      const groupContext = conversation?.conversation_templates?.group_prompt_suffix || "";

      // Generate AI response
      const response = await fetch("/api/chat/secure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tutorId: nextSpeakerId,
          conversationId: conversationId,
          message: finalMessage,
          groupTopic: groupTopic,
          groupContext: groupContext,
          isGroupConversation: true,
          allParticipants: groupPersonas.map(p => ({ id: p.id, name: p.name }))
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get AI response: ${response.status} ${errorText}`);
      }

      const aiData = await response.json();

      // Create AI message
      const aiMessage = await core.createAIMessage(
        conversationId, 
        aiData.content || '', 
        aiData.english_translation, 
        nextSpeakerId
      );

      if (aiMessage) {
        core.setMessages(prev => [...prev, aiMessage]);
      }

      // Update group chat state
      const stateKey = `${conversationId}_${nextSpeakerId}`;
      groupChatStates.current.set(stateKey, {
        lastResponseTimestamp: Date.now(),
        consecutiveResponses: (groupChatStates.current.get(stateKey)?.consecutiveResponses || 0) + 1
      });

    } catch (error) {
      logError("Send message error:", error);
      toast({
        title: "Error sending message",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      core.setSending(false);
    }
  }, [conversationId, core, session, user, groupPersonas, checkResponseThrottling, getNextAISpeaker, toast]);

  // Handle first message with introductions
  const handleFirstMessage = useCallback(async (userMessage: string) => {
    try {
      // Create user message
      const userMsg = await core.createUserMessage(conversationId, userMessage);
      core.setMessages(prev => [...prev, userMsg]);

      // Get conversation context
      const { data: conversation } = await supabase
        .from("conversations")
        .select(`
          title,
          conversation_templates (
            title,
            group_prompt_suffix
          )
        `)
        .eq("id", conversationId)
        .single();

      const groupTopic = conversation?.conversation_templates?.title || conversation?.title || "group conversation";
      const groupContext = conversation?.conversation_templates?.group_prompt_suffix || "";

      // Trigger introductions from all personas
      for (const persona of groupPersonas) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        const response = await fetch("/api/chat/secure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tutorId: persona.id,
            conversationId: conversationId,
            message: "start-introduction",
            groupTopic: groupTopic,
            groupContext: groupContext,
            isGroupConversation: true,
            allParticipants: groupPersonas.map(p => ({ id: p.id, name: p.name }))
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          
          const aiMessage = await core.createAIMessage(
            conversationId,
            aiData.content || '',
            aiData.english_translation,
            persona.id
          );

          if (aiMessage) {
            core.setMessages(prev => [...prev, aiMessage]);
          }
        }
      }
      
    } catch (error) {
      logError("First message error:", error);
    } finally {
      core.setSending(false);
    }
  }, [conversationId, core, session, groupPersonas]);

  // Initialize on mount
  useEffect(() => {
    if (conversationId && session) {
      loadGroupConversation();
    }
  }, [conversationId, session, loadGroupConversation]);

  const getPersonaById = useCallback((id: string): GroupPersona | null => {
    return groupPersonas.find(p => p.id === id) || null;
  }, [groupPersonas]);

  return {
    ...core,
    groupPersonas,
    typingPersonas,
    sendMessage,
    getPersonaById,
    loadGroupConversation
  };
}
