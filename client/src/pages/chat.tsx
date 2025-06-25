import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ArrowLeft, CheckCircle, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FuriganaText from "@/components/furigana-text";
import { MessageWithVocab } from "@/components/MessageWithVocab";
import { bind, unbind, toHiragana } from 'wanakana';
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/context/SupabaseAuthContext";
import { extractPersonaFromTitle } from "@/lib/supabase-functions";
import { useConversationMode } from "@/hooks/useConversationMode";
// Import vocabulary tracking function from API
const trackVocabularyUsage = async (text: string, source: 'user' | 'ai') => {
  try {
    await fetch('/api/vocab-tracker/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source })
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
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [conversationPersonas, setConversationPersonas] = useState<Persona[]>([]);
  const [typingPersonas, setTypingPersonas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [message, setMessage] = useState("");
  const [romajiMode, setRomajiMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationId = params?.conversationId || null;

  // Use conversation mode hook
  const { isGroup, isSolo } = useConversationMode(conversation);

  // Load initial data
  useEffect(() => {
    if (!session || !user || !conversationId) {
      setLocation("/login");
      return;
    }

    // Run diagnostic in development
    if (process.env.NODE_ENV === 'development') {
      validateConversationParticipants(conversationId);
    }

    loadConversationData();
    loadPersonas();
  }, [conversationId, session, user]);

  const loadConversationData = async () => {
    try {
      setLoading(true);
      
      // Load conversation
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user?.id)
        .single();

      if (convError || !convData) {
        toast({
          title: "Conversation not found",
          description: "This conversation doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }

      setConversation(convData);
      
      console.log('🔍 Conversation loaded:', {
        id: convData.id,
        mode: convData.mode,
        title: convData.title,
        persona_id: convData.persona_id,
        isGroup: convData.mode === 'group'
      });
      
      // Load messages
      await loadMessages();
      
    } catch (error) {
      console.error("Error loading conversation:", error);
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

    if (msgError) {
      console.error("Error loading messages:", msgError);
      return;
    }

    setMessages(msgData || []);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const loadConversationParticipants = async () => {
    try {
      if (isGroup) {
        console.log("🔍 Loading group participants for conversation:", conversationId);
        
        // For group conversations, fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            persona_id,
            role,
            order_in_convo,
            personas(*)
          `)
          .eq("conversation_id", conversationId)
          .order("order_in_convo");

        console.log("🔍 Raw participants query result:", { 
          data: participantsData, 
          error: participantsError,
          dataLength: participantsData?.length 
        });

        if (participantsError) {
          console.error("❌ Participants query error:", participantsError);
          return;
        }

        if (!participantsData || participantsData.length === 0) {
          console.warn("⚠️ No participants found for group conversation:", conversationId);
          return;
        }

        // Debug each participant entry
        participantsData.forEach((participant, index) => {
          console.log(`🔍 Participant ${index}:`, {
            persona_id: participant.persona_id,
            role: participant.role,
            order: participant.order_in_convo,
            persona_resolved: !!participant.personas,
            persona_data: participant.personas
          });
        });

        // Extract personas and filter out any null/undefined entries
        const groupPersonas = participantsData
          .map((p: any) => p.personas)
          .filter(Boolean);

        console.log("✅ Successfully resolved group personas:", {
          totalParticipants: participantsData.length,
          resolvedPersonas: groupPersonas.length,
          personaNames: groupPersonas.map((p: any) => `${p.name}:${p.id}`)
        });

        if (groupPersonas.length === 0) {
          console.error("❌ No personas could be resolved from participants!");
          console.log("🔍 Available persona IDs in system:", personas.map(p => `${p.name}:${p.id}`));
        }

        setConversationPersonas(groupPersonas);
      } else {
        // Single chat: find persona by conversation persona_id or title
        await loadSinglePersona();
      }
    } catch (error) {
      console.error("❌ Error loading conversation participants:", error);
      await loadSinglePersona();
    }
  };

  const loadSinglePersona = async () => {
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
        console.log("Single chat with persona:", foundPersona.name);
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

  const sendMessage = async () => {
    if (!message.trim() || sending || !session || !user) return;

    const finalMessage = romajiMode ? toHiragana(message.trim()) : message.trim();
    
    try {
      setSending(true);
      setMessage(""); // Clear input immediately

      console.log("📤 Sending message to conversation:", conversationId);

      // Add user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "user",
          content: finalMessage,
          sender_persona_id: null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userMsgError) {
        throw new Error("Failed to save user message");
      }

      // Immediately add user message to UI
      setMessages(prev => [...prev, userMessage]);

      // Track vocabulary usage for user message
      try {
        await trackVocabularyUsage(finalMessage, 'user');
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
          conversationId: conversationId,
          tutorId: persona?.id || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiData = await response.json();

      // Add AI message
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "ai",
          content: aiData.content || '',
          english_translation: aiData.english_translation || null,
          tutor_feedback: aiData.feedback || null,
          suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : null,
          vocab_used: Array.isArray(aiData.vocabUsed) ? aiData.vocabUsed : [],
          grammar_used: Array.isArray(aiData.grammarUsed) ? aiData.grammarUsed : [],
          sender_persona_id: persona?.id || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (aiMsgError) {
        throw new Error("Failed to save AI message");
      }

      // Immediately add AI message to UI
      setMessages(prev => [...prev, aiMessage]);

      // Track vocabulary usage for AI message
      try {
        await trackVocabularyUsage(aiData.content || '', 'ai');
      } catch (error) {
        console.log("AI vocabulary tracking failed:", error);
      }

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error) {
      console.error("❌ Message send failed:", error);
      setMessage(finalMessage); // Restore message on error
      
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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
      
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Failed to complete conversation",
        description: "Please try again.",
        variant: "destructive",
      });
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
      sendMessage();
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
      {/* Chat Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            {isGroup ? (
              <div className="flex -space-x-2">
                {conversationPersonas.slice(0, 3).map((p, index) => (
                  <img
                    key={p.id}
                    src={getAvatarImage(p)}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-background"
                    style={{ zIndex: conversationPersonas.length - index }}
                  />
                ))}
                {conversationPersonas.length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                    +{conversationPersonas.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <img
                src={getAvatarImage(persona)}
                alt={persona?.name || "Persona"}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-medium">
                {isGroup 
                  ? conversation.title
                  : persona?.name || "AI"
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGroup 
                  ? `Group Chat • ${conversationPersonas.map(p => p.name).join(", ")}`
                  : conversation.title.split("|")[0] || "Conversation"
                }
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={completeConversation}
          className="complete-button"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete
        </Button>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            // Resolve persona per message for group/solo mode
            let senderPersona = null;
            
            if (msg.sender_type === 'ai') {
              if (isGroup) {
                console.log('🔍 Resolving persona for group message:', {
                  messageId: msg.id,
                  senderPersonaId: msg.sender_persona_id,
                  availableConversationPersonas: conversationPersonas.length,
                  availableAllPersonas: personas.length
                });

                // For group messages, find persona by sender_persona_id
                senderPersona = conversationPersonas.find(p => p.id === msg.sender_persona_id);
                
                if (!senderPersona) {
                  console.log('🔍 Not found in conversation personas, checking all personas...');
                  senderPersona = personas.find(p => p.id === msg.sender_persona_id);
                }

                if (!senderPersona) {
                  console.error('❌ Could not resolve sender persona:', {
                    messageId: msg.id,
                    senderPersonaId: msg.sender_persona_id,
                    availableConversationPersonas: conversationPersonas.map(p => `${p.name}:${p.id}`),
                    availableAllPersonas: personas.map(p => `${p.name}:${p.id}`)
                  });
                } else {
                  console.log('✅ Resolved persona:', `${senderPersona.name}:${senderPersona.id}`);
                }
              } else {
                // For solo messages, use the main persona
                senderPersona = persona;
              }
            }

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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                      target.src = "/avatars/default.png";
                    }}
                  />
                )}
              </div>

              <div
                className={`max-w-[70%] rounded-lg p-3 ${getMessageBubbleStyles(msg.sender_type, senderPersona)}`}
              >
                {/* Show persona name in group mode */}
                {isGroup && msg.sender_type === 'ai' && senderPersona && (
                  <div className="text-xs font-medium mb-1 opacity-80">
                    {senderPersona.name}
                  </div>
                )}
                
                <MessageWithVocab content={msg.content}>
                  <FuriganaText
                    text={msg.content}
                    showFurigana={showFurigana}
                    showToggleButton={false}
                  />
                </MessageWithVocab>

                {msg.sender_type === 'ai' && msg.english_translation && (
                  <div className="mt-2">
                    <details className="text-sm text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Show English translation
                      </summary>
                      <div className="mt-1 p-2 bg-muted/50 rounded-md">
                        {msg.english_translation}
                      </div>
                    </details>
                  </div>
                )}

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Learning suggestions ({msg.suggestions.length})
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
            </div>
          );
        })}

          {sending && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <img
                  src={getAvatarImage(persona)}
                  alt={persona?.name || "AI"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              
              <div className={`rounded-lg p-3 ${getMessageBubbleStyles('ai', persona)}`}>
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm opacity-70">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Toggle
              pressed={romajiMode}
              onPressedChange={setRomajiMode}
              aria-label="Toggle romaji input"
              size="sm"
            >
              <Languages className="w-4 h-4" />
              <span className="ml-1">Hiragana</span>
            </Toggle>
            <Toggle
              pressed={showFurigana}
              onPressedChange={setShowFurigana}
              aria-label="Toggle furigana display"
              size="sm"
            >
              <span>振り仮名</span>
            </Toggle>
          </div>
          
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message in Japanese..."
              className="flex-1 min-h-[40px] max-h-[120px] p-2 border rounded-md resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="self-end"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}