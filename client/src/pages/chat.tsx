import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Toggle } from "@/components/ui/toggle";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChatConversation } from "@/hooks/useChatConversation";
import { useMessageSending } from "@/hooks/useMessageSending";
import { useConversationMode } from "@/hooks/useConversationMode";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { loadGroupPersonas, loadSoloPersona, loadAllPersonas, populateConversationParticipants } from "@/lib/supabase/loaders";
import { safeFindPersona, safeMapPersonas } from "@/lib/chat-utilities";
import { logDebug, logError } from "@utils/logger";
import { supabase } from "@/lib/supabase/client";
import { extractPersonaFromTitle } from "@/lib/chat-utilities";
import { bind, unbind } from "wanakana";
// Import vocabulary tracking function from API
// Import vocabulary tracking function from API
const trackVocabularyUsage = async (text: string, source: 'user' | 'ai', authSession: any, tutorId?: string, conversationId?: string) => {
  try {
    await fetch('/api/vocab-tracker/increment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authSession?.access_token}`
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
  created_at: string;
}

// Diagnostic function to validate conversation participants
const validateConversationParticipants = async (conversationId: string) => {
  console.log('🔧 Running conversation participants diagnostic...');

  // Check conversation exists and get its mode
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .select('id, mode, title, persona_id')
    .eq('id', conversationId)
    .single();

  if (convError || !conv) {
    console.error('❌ Conversation not found:', convError);
    return;
  }

  console.log('✅ Conversation found:', conv);

  // Check participants table
  const { data: participants, error: partError } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId);

  if (partError) {
    console.error('❌ Error fetching participants:', partError);
    return;
  }

  console.log('🔍 Raw participants data:', participants);

  // Check if persona IDs exist in personas table
  if (participants && participants.length > 0) {
    for (const participant of participants) {
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .select('id, name')
        .eq('id', participant.persona_id)
        .single();

      if (personaError || !persona) {
        console.error('❌ Invalid persona ID in participants:', participant.persona_id, personaError);
      } else {
        console.log('✅ Valid persona:', persona);
      }
    }
  }
};



interface Persona {
  id: string;
  name: string;
  type: string;
  avatar_url: string;
  description: string;
}

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const conversationId = params?.conversationId || null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Chat conversation hook
  const { conversation, messages, loading, error, addMessage, completeConversation } = useChatConversation(conversationId);
  
  // Message sending hook
  const { sendMessage: sendMessageHandler, sending } = useMessageSending();

  // Local state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [conversationPersonas, setConversationPersonas] = useState<Persona[]>([]);
  const [message, setMessage] = useState("");
  const [romajiMode, setRomajiMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  // Use conversation mode hook
  const { isGroup, isSolo } = useConversationMode(conversation);

  // Load initial data
  useEffect(() => {
    if (!user || !conversationId) {
      setLocation("/login");
      return;
    }

    // Run diagnostic in development
    if (process.env.NODE_ENV === 'development') {
      validateConversationParticipants(conversationId);
    }

    loadPersonas();
  }, [conversationId, user]);

  

  const loadConversationParticipants = async () => {
    try {
      let loadedPersonas: Persona[] = [];

      if (isGroup) {
        console.log("🔍 Loading group participants for conversation:", conversationId);

        // Try to populate participants table first if empty
        await populateConversationParticipants(conversationId);

        loadedPersonas = await loadGroupPersonas(conversationId);

        if (loadedPersonas.length === 0) {
          console.warn("⚠️ No group personas found even after population attempt");
          // Final fallback: load first 3 personas as mock participants
          const allPersonas = await loadAllPersonas();
          loadedPersonas = allPersonas.slice(0, 3);
          console.log("🔧 Using emergency fallback personas:", loadedPersonas.map(p => p.name));
        }
      } else {
        console.log("🔍 Loading solo persona for conversation:", conversationId);
        const soloPersona = await loadSoloPersona(conversationId);

        if (soloPersona) {
          loadedPersonas = [soloPersona];
        } else {
          // Fallback: extract from title
          await loadSinglePersonaFallback();
          return;
        }
      }

      setConversationPersonas(loadedPersonas);
      if (!isGroup && loadedPersonas.length > 0) {
        setPersona(loadedPersonas[0]);
      }

      console.log("🧠 Loaded personas:", loadedPersonas.map(p => p.name));
    } catch (error) {
      console.error("❌ Error loading conversation participants:", error);
      if (!isGroup) {
        await loadSinglePersonaFallback();
      }
    }
  };

  const loadSinglePersonaFallback = async () => {
    if (conversation && personas.length > 0) {
      // First try to find persona by persona_id from conversation
      let foundPersona = null;

      if (conversation.persona_id) {
        foundPersona = personas.find(p => p.id === conversation.persona_id);
      }

      // Fallback: Extract persona name from title
      if (!foundPersona && conversation.title) {
        const titleParts = conversation.title.split('|')[0].trim();
        const personaName = titleParts.replace(/^Chat with\s+/i, '').trim();
        foundPersona = personas.find(p => 
          p.name.toLowerCase() === personaName.toLowerCase()
        );
      }

      if (foundPersona) {
        setConversationPersonas([foundPersona]);
        setPersona(foundPersona);
        console.log("🧠 Loaded solo persona:", foundPersona.name);
        console.log("🧠 Loaded personas:", [foundPersona.name]);
      }
    }
  };

  const loadPersonas = async () => {
    const { data, error } = await supabase.from("personas").select("*");
    if (!error && data) {
      setPersonas(data);
    }
  };

  // Set persona when conversation and personas are loaded
  useEffect(() => {
    if (conversation && personas.length > 0) {
      console.log('🔍 Setting up persona for conversation:', {
        conversationId: conversation.id,
        mode: conversation.mode,
        title: conversation.title,
        persona_id: conversation.persona_id,
        availablePersonas: personas.length
      });

      const { personaId } = extractPersonaFromTitle(conversation.title || "");
      const foundPersona = personas.find(p => p.id === personaId);

      console.log('🔍 Persona extraction result:', {
        extractedPersonaId: personaId,
        foundPersona: foundPersona ? `${foundPersona.name}:${foundPersona.id}` : null
      });

      setPersona(foundPersona || null);

      // Load participants after persona setup
      loadConversationParticipants();
    }
  }, [conversation, personas]);

  const getMessageBubbleStyles = (messageType: 'user' | 'ai', persona?: Persona | null) => {
    if (messageType === 'user') {
      return 'bg-blue-500 text-white';
    }

    // AI message bubble styling based on persona
    if (persona?.name === 'Keiko') {
      return 'bg-rose-100 text-rose-900 border border-rose-200';
    } else if (persona?.name === 'Aoi') {
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    } else if (persona?.name === 'Haruki') {
      return 'bg-orange-100 text-orange-900 border border-orange-200';
    } else if (persona?.name === 'Satoshi') {
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    }

    // Default AI styling
    return 'bg-gray-100 text-gray-900 border border-gray-200';
  };

  const handleSendMessage = async () => {
    if (!conversationId) return;
    
    const tutorId = persona?.id ?? conversationPersonas?.[0]?.id ?? "";
    
    await sendMessageHandler(
      message,
      romajiMode,
      {
        conversationId,
        tutorId,
        isGroupConversation: isGroup
      },
      (userMessage) => {
        addMessage(userMessage);
        setMessage(""); // Clear input after successful send
      },
      (aiMessage) => {
        addMessage(aiMessage);
      }
    );
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
          console.log("Unbind cleanup completed");
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
      handleSendMessage();
    }
  };

  const getAvatarImage = (persona: Persona | null) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">Conversation not found</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatHeader
        onBack={() => setLocation("/dashboard")}
        title={isGroup ? conversation?.title || "Group Chat" : persona?.name || "AI"}
        subtitle={isGroup 
          ? `Group Chat • ${conversationPersonas.map(p => p.name).join(", ")}`
          : conversation?.title?.split("|")[0] || "Conversation"
        }
        isGroup={isGroup}
        personas={conversationPersonas}
        currentPersona={persona}
        showFurigana={showFurigana}
        onToggleFurigana={() => setShowFurigana(!showFurigana)}
        romajiMode={romajiMode}
        onToggleRomaji={() => setRomajiMode(!romajiMode)}
        onComplete={completeConversation}
      />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            // Resolve persona per message for group/solo mode
            let senderPersona = null;

            if (msg.sender_type === 'ai') {
              if (isGroup) {
                senderPersona = safeFindPersona(conversationPersonas, msg.sender_persona_id) ||
                               safeFindPersona(personas, msg.sender_persona_id);
              } else {
                senderPersona = persona;
              }
            }

            return (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                content={msg.content}
                senderType={msg.sender_type}
                englishTranslation={msg.english_translation}
                suggestions={msg.suggestions}
                createdAt={msg.created_at}
                senderPersona={senderPersona}
                isGroup={isGroup}
                showFurigana={showFurigana}
                showPersonaName={isGroup}
                onSaveToVocab={(word: string, reading?: string) => {
                  console.log('Saving word to vocab:', word, reading);
                }}
              />
            );
          })}

          {sending && (
            <TypingIndicator
              personas={persona ? [persona] : conversationPersonas}
              typingPersonaIds={persona ? [persona.id] : []}
              showPersonaName={false}
            />
          )}
        </div>
      </div>

      <ChatInput
        message={message}
        onMessageChange={setMessage}
        onSendMessage={handleSendMessage}
        romajiMode={romajiMode}
        disabled={sending}
      />
    </div>
  );
}