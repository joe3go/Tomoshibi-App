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

interface Persona {
  id: string;
  name: string;
  type: string;
  avatar_url: string;
  description: string;
}

export default function ChatNew() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
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

  // Load initial data
  useEffect(() => {
    if (!session || !user || !conversationId) {
      setLocation("/login");
      return;
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

  const loadPersonas = async () => {
    const { data, error } = await supabase.from("personas").select("*");
    if (!error && data) {
      setPersonas(data);
    }
  };

  // Set persona when conversation and personas are loaded
  useEffect(() => {
    if (conversation && personas.length > 0) {
      const { personaId } = extractPersonaFromTitle(conversation.title || "");
      const foundPersona = personas.find(p => p.id === personaId);
      setPersona(foundPersona || null);
    }
  }, [conversation, personas]);

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
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img
              src={getAvatarImage(persona)}
              alt={persona?.name || "Persona"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium">{persona?.name || "AI"}</h3>
              <p className="text-sm text-muted-foreground">
                {conversation.title.split("|")[0] || "Conversation"}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={completeConversation}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender_type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <MessageWithVocab content={msg.content} className="vocab-enabled-message">
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
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
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