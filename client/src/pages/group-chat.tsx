import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Eye, EyeOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { bind, unbind, toHiragana } from "wanakana";
import FuriganaText from "@/components/FuriganaText";
import type { GroupMessage, GroupPersona, GroupChatState } from "@/types/chat";
import { logDebug, logError, logInfo } from "@utils/logger";
import { isEnglishMessage, sanitizeInput } from "@utils/validation";

export default function GroupChat() {
  const [, params] = useRoute("/group-chat/:conversationId");
  const [, setLocation] = useLocation();
  const { session, user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [groupPersonas, setGroupPersonas] = useState<GroupPersona[]>([]);
  const [showFurigana, setShowFurigana] = useState(() => {
    return localStorage.getItem("furigana-visible") === "true";
  });
  const [romajiMode, setRomajiMode] = useState(false);

  // Group chat specific state
  const groupChatStates = useRef<Map<string, GroupChatState>>(new Map());
  const responseCooldown = 8000; // 8 seconds for more natural flow
  const [typingPersonas, setTypingPersonas] = useState<Set<string>>(new Set());

  const conversationId = params?.conversationId;

  useEffect(() => {
    if (conversationId && session) {
      loadGroupConversation();
    }
  }, [conversationId, session]);

  const loadGroupConversation = async () => {
    try {
      setLoading(true);

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

      setConversation(convData);

      // Load group personas from template - using correct database persona IDs
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
      await loadMessages();

    } catch (error) {
      logError("Error loading group conversation:", error);
      toast({
        title: "Error loading conversation",
        description: "Please try again or return to dashboard.",
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

    if (!msgError && msgData) {
      setMessages(msgData);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || sending || !session || !user) return;

    const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();
    
    try {
      setSending(true);
      setMessage("");

      // Check if this is the first message (welcome/onboarding logic)
      if (messages.length === 0) {
        await handleFirstMessage(finalMessage);
        return;
      }

      // Create user message
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "user",
          content: finalMessage,
          sender_persona_id: null,
        })
        .select()
        .single();

      if (userError) {
        logError("User message error:", userError);
        throw new Error(`Failed to save user message: ${userError.message}`);
      }

      // Add user message to UI immediately
      setMessages(prev => [...prev, userMessage]);

      // Group chat throttling logic - but always allow at least one AI response
      const shouldGenerateResponse = checkResponseThrottling();
      
      if (!shouldGenerateResponse && messages.filter(m => m.sender_type === 'ai').length > 0) {
        console.log('⏳ Throttling AI response, user message saved');
        setSending(false);
        return;
      }

      // Show typing indicator and natural delay
      const nextSpeakerId = getNextAISpeaker();
      const speakingPersona = groupPersonas.find(p => p.id === nextSpeakerId);
      
      if (speakingPersona) {
        setTypingPersonas(prev => new Set(prev).add(nextSpeakerId));
        
        // Variable delay for thinking effect
        const delay = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        
        setTypingPersonas(prev => {
          const newSet = new Set(prev);
          newSet.delete(nextSpeakerId);
          return newSet;
        });
      }
      
      // Get conversation template to pass group context
      const { data: conversation, error: convError } = await supabase
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

      // Generate AI response using the chat/secure endpoint with group context
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
        logError("AI response error:", `${response.status} ${errorText}`);
        throw new Error(`Failed to get AI response: ${response.status} ${errorText}`);
      }

      const aiData = await response.json();

      // Create AI message in database
      const { data: aiMessage, error: aiError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "ai",
          content: aiData.content || '',
          english_translation: aiData.english_translation || null,
          sender_persona_id: nextSpeakerId,
        })
        .select()
        .single();

      if (aiError) {
        logError("AI message error:", aiError);
        throw new Error(`Failed to save AI message: ${aiError.message}`);
      }

      if (aiMessage) {
        setMessages(prev => [...prev, aiMessage]);
      }

      // Update group chat state
      updateGroupChatState(nextSpeakerId);

    } catch (error) {
      logError("Send message error details:", error);
      toast({
        title: "Error sending message",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Welcome and onboarding logic for first message
  const handleFirstMessage = async (userMessage: string) => {
    try {
      // Create user message first
      const { data: userMsg, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "user",
          content: userMessage,
          sender_persona_id: null,
        })
        .select()
        .single();

      if (userError) throw new Error("Failed to save user message");
      setMessages(prev => [...prev, userMsg]);

      // Get conversation template data
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
      logInfo(`Starting group introductions for ${groupPersonas.length} personas`);
      
      for (const persona of groupPersonas) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // Stagger introductions

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
          
          // Create AI message
          const { data: aiMessage } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender_type: "ai",
              content: aiData.content || '',
              english_translation: aiData.english_translation || null,
              sender_persona_id: persona.id,
            })
            .select()
            .single();

          if (aiMessage) {
            setMessages(prev => [...prev, aiMessage]);
          }
        }
      }
      
    } catch (error) {
      logError("First message error:", error);
    } finally {
      setSending(false);
    }
  };

  const checkResponseThrottling = (): boolean => {
    if (groupPersonas.length === 0) return true;

    // Check if user mentioned someone specifically - always allow response
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.sender_type === 'user') {
      const userMessage = lastUserMessage.content.toLowerCase();
      for (const persona of groupPersonas) {
        const name = persona.name.toLowerCase();
        if (userMessage.includes(name) || userMessage.includes(`${name}さん`)) {
          logDebug(`User mentioned ${persona.name}, bypassing throttling`);
          return true;
        }
      }
    }

    // More relaxed throttling for natural group dynamics
    const representativePersona = groupPersonas[0];
    const stateKey = `${conversationId}_${representativePersona.id}`;
    const currentState = groupChatStates.current.get(stateKey) || {
      lastResponseTimestamp: 0,
      consecutiveResponses: 0
    };

    // Reduced cooldown for more natural flow
    if (Date.now() - currentState.lastResponseTimestamp < 8000) { // 8 seconds
      logDebug('Group chat cooldown active, skipping AI response');
      return false;
    }

    return true;
  };

  const getNextAISpeaker = (): string => {
    if (groupPersonas.length === 0) return "";

    // Check if user mentioned a specific persona by name in their most recent message
    const userMessages = messages.filter(m => m.sender_type === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    
    if (lastUserMessage) {
      const userMessage = lastUserMessage.content.toLowerCase();
      for (const persona of groupPersonas) {
        const name = persona.name.toLowerCase();
        // Check for name mentions with Japanese particles
        if (userMessage.includes(name) || 
            userMessage.includes(`${name}さん`) || 
            userMessage.includes(`${name}は`) ||
            userMessage.includes(`${name}が`)) {
          logDebug(`User mentioned ${persona.name}, they will respond next`);
          return persona.id;
        }
      }
    }

    // Find the last AI message to determine next speaker
    const lastAIMessage = messages
      .filter(msg => msg.sender_type === 'ai' && msg.sender_persona_id)
      .pop();

    if (!lastAIMessage?.sender_persona_id) {
      // No previous AI speaker, use first persona
      return groupPersonas[0].id;
    }

    // Check if the last AI message was asking a question to another persona
    const lastAIContent = lastAIMessage.content.toLowerCase();
    for (const persona of groupPersonas) {
      const name = persona.name.toLowerCase();
      // If the last AI message mentioned another persona, let that persona respond
      if (lastAIContent.includes(`${name}さん`) || 
          lastAIContent.includes(`${name}は`) ||
          lastAIContent.includes(`${name}が`) ||
          lastAIContent.includes(`どう思います`) ||
          lastAIContent.includes(`どうですか`)) {
        if (persona.id !== lastAIMessage.sender_persona_id) {
          logDebug(`${persona.name} was mentioned/asked a question, they will respond next`);
          return persona.id;
        }
      }
    }

    // Use round-robin with some randomness
    const lastSpeakerIndex = groupPersonas.findIndex(p => p.id === lastAIMessage.sender_persona_id);
    const nextIndex = (lastSpeakerIndex + 1) % groupPersonas.length;
    
    // Add 15% chance of random speaker for natural flow (reduced from 20%)
    if (Math.random() < 0.15) {
      const randomIndex = Math.floor(Math.random() * groupPersonas.length);
      return groupPersonas[randomIndex].id;
    }
    
    return groupPersonas[nextIndex].id;
  };

  const updateGroupChatState = (personaId: string) => {
    const stateKey = `${conversationId}_${personaId}`;
    groupChatStates.current.set(stateKey, {
      lastResponseTimestamp: Date.now(),
      consecutiveResponses: (groupChatStates.current.get(stateKey)?.consecutiveResponses || 0) + 1
    });
  };

  const getPersonaById = (id: string): GroupPersona | null => {
    return groupPersonas.find(p => p.id === id) || null;
  };

  const getAvatarImage = (persona: GroupPersona | null) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

  const getPersonaBubbleStyles = (persona: GroupPersona | null) => {
    if (!persona) return 'bg-gray-100 text-gray-900 border border-gray-200';
    
    switch (persona.name) {
      case 'Keiko':
        return 'bg-rose-100 text-rose-900 border border-rose-200';
      case 'Aoi':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      case 'Haruki':
        return 'bg-orange-100 text-orange-900 border border-orange-200';
      case 'Satoshi':
        return 'bg-blue-100 text-blue-900 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-900 border border-gray-200';
    }
  };

  // Wanakana binding
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
          logDebug("Unbind cleanup completed");
        }
      }
    };
  }, [romajiMode]);

  // Save furigana preference
  useEffect(() => {
    localStorage.setItem("furigana-visible", showFurigana.toString());
  }, [showFurigana]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading group conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">Group conversation not found</p>
          <Button onClick={() => setLocation("/practice-groups")} className="mt-4">
            Return to Practice Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/practice-groups")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {groupPersonas.slice(0, 3).map((persona, index) => (
                <img
                  key={persona.id}
                  src={getAvatarImage(persona)}
                  alt={persona.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-background"
                  style={{ zIndex: groupPersonas.length - index }}
                />
              ))}
              {groupPersonas.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{groupPersonas.length - 3}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium">{conversation.title}</h3>
              <p className="text-sm text-muted-foreground">
                {groupPersonas.length} participants
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFurigana(!showFurigana)}
          >
            {showFurigana ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Furigana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRomajiMode(!romajiMode)}
          >
            <Globe className="w-4 h-4" />
            {romajiMode ? "あ" : "A"}
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            const senderPersona = msg.sender_persona_id ? getPersonaById(msg.sender_persona_id) : null;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender_type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0">
                  {msg.sender_type === 'user' ? (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      You
                    </div>
                  ) : (
                    <img
                      src={getAvatarImage(senderPersona)}
                      alt={senderPersona?.name || "AI"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                </div>

                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender_type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : getPersonaBubbleStyles(senderPersona)
                  }`}
                >
                  {/* Persona name and timestamp for AI messages */}
                  {msg.sender_type === 'ai' && senderPersona && (
                    <div className="relative mb-2">
                      <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full 
                        ${Date.now() - new Date(msg.created_at).getTime() < 30000 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-muted'
                        }`}
                      />
                      <div className="text-xs font-medium opacity-80">
                        {senderPersona.name}
                        <span className="ml-2 text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <FuriganaText
                    text={msg.content}
                    showFurigana={showFurigana}
                    showToggleButton={false}
                    enableWordLookup={true}
                    onSaveToVocab={(word: string, reading?: string) => {
                      logDebug('Saving word to vocab:', word, reading);
                    }}
                    className="text-sm leading-relaxed"
                  />

                  {msg.sender_type === 'ai' && msg.english_translation && (
                    <div className="mt-2">
                      <details className="text-sm opacity-80">
                        <summary className="cursor-pointer hover:opacity-100">
                          Show English translation
                        </summary>
                        <div className="mt-1 p-2 bg-black/10 rounded-md">
                          {msg.english_translation}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message in Japanese..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            size="lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}