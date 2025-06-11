import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Settings, MoreHorizontal, Send, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FuriganaText from "@/components/furigana-text";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";


export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem('furigana-visible');
    return saved !== null ? saved === 'true' : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversationId = params?.conversationId ? parseInt(params.conversationId) : 0;

  const { data: conversationData, isLoading } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
  });

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
      });
      return await response.json();
    },
    onSuccess: (messages) => {
      queryClient.setQueryData([`/api/conversations/${conversationId}`], (oldData: any) => ({
        ...oldData,
        messages,
      }));
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/conversations/${conversationId}`, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation completed!",
        description: "Great job! This conversation has been moved to your transcripts.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Failed to complete conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [(conversationData as any)?.messages]);

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertSuggestion = (text: string) => {
    setMessage(prev => prev + text);
  };

  const getAvatarImage = (persona: any) => {
    if (persona?.type === 'teacher') return aoiAvatar; // Aoi is the female teacher
    if (persona?.type === 'friend') return harukiAvatar; // Haruki is the male friend
    return aoiAvatar; // Default fallback
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-navy">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-lantern-orange border-l-transparent rounded-full animate-spin"></div>
            <span className="text-off-white">Loading conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-navy">
        <Card className="glass-card border-glass-border">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-off-white mb-2">Conversation Not Found</h2>
            <p className="text-off-white/70 mb-4">This conversation doesn't exist or you don't have access to it.</p>
            <Button onClick={() => setLocation("/")} className="gradient-button">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conversation = (conversationData as any)?.conversation;
  const messages = (conversationData as any)?.messages || [];
  
  // Handle case where conversation doesn't exist
  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">Conversation Not Found</h2>
          <p className="text-muted-foreground mb-6">This conversation doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation("/")} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }
  
  const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === conversation?.personaId) : null;
  const scenario = Array.isArray(scenarios) ? scenarios.find((s: any) => s.id === conversation?.scenarioId) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <header className="glass-card rounded-b-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
              <img 
                src={getAvatarImage(persona)} 
                alt={persona?.name || 'Persona'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text avatar if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                      persona?.type === 'teacher' 
                        ? 'from-lantern-orange to-lantern-orange/60' 
                        : 'from-sakura-blue to-sakura-blue/60'
                    }">
                      <span class="text-lg">
                        ${persona?.type === 'teacher' ? '👩‍🏫' : '🧑‍🎤'}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-off-white">{persona?.name || 'AI'}</h3>
              <p className="text-sm text-off-white/60">{scenario?.title || 'Conversation'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !showFurigana;
              setShowFurigana(newState);
              localStorage.setItem('furigana-visible', newState.toString());
            }}
            className="px-3 py-1 text-xs hover:bg-lantern-orange/20 transition-colors text-off-white"
          >
            {showFurigana ? 'Hide Furigana' : 'Show Furigana'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => completeConversationMutation.mutate()}
            disabled={completeConversationMutation.isPending}
            className="px-3 py-1 text-xs hover:bg-green-500/20 transition-colors text-off-white flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete</span>
          </Button>
          <Button variant="ghost" size="sm" className="p-2 text-off-white hover:bg-kanji-glow">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'justify-end' : ''
            }`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                  <img 
                    src={getAvatarImage(persona)} 
                    alt={persona?.name || 'AI'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to text avatar if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="avatar ${persona?.type === 'teacher' ? 'sensei' : 'yuki'} w-full h-full flex items-center justify-center">
                          <span class="text-sm font-japanese">
                            ${persona?.type === 'teacher' ? '先' : '友'}
                          </span>
                        </div>
                      `;
                    }}
                  />
                </div>
              )}
              
              <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                {msg.feedback && (
                  <div className="mb-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-700">✨ {msg.feedback}</p>
                  </div>
                )}
                
                <div className={`font-japanese mb-2 ${msg.sender === 'user' ? 'text-white' : 'text-primary'}`}>
                  <FuriganaText 
                    text={msg.content} 
                    showFurigana={showFurigana}
                    onToggleFurigana={(show) => setShowFurigana(show)}
                    showToggleButton={false}
                    className="text-inherit"
                  />
                </div>
                
                {msg.sender === 'ai' && (
                  <div className="mt-2 text-xs text-secondary">
                    💡 Keep practicing! You're doing great!
                  </div>
                )}
              </div>
              
              {msg.sender === 'user' && (
                <div className="avatar student flex-shrink-0">
                  <span className="text-sm">You</span>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
              <img 
                src={getAvatarImage(persona)} 
                alt={persona?.name || 'AI'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                      persona?.type === 'teacher' 
                        ? 'from-lantern-orange to-lantern-orange/60' 
                        : 'from-sakura-blue to-sakura-blue/60'
                    }">
                      <span class="text-sm">
                        ${persona?.type === 'teacher' ? '👩‍🏫' : '🧑‍🎤'}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
              <div className="chat-bubble-ai rounded-2xl rounded-tl-sm p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-lantern-orange/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-lantern-orange/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-lantern-orange/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="glass-card rounded-t-2xl p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response in Japanese... (English is ok too!)"
                className="bg-kanji-glow border-glass-border text-off-white placeholder-off-white/50 focus:border-lantern-orange focus:ring-lantern-orange/20 resize-none"
                rows={1}
                style={{ maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="gradient-button hover-glow flex items-center space-x-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Input Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion('私は')}
              className="px-3 py-1 text-sm hover:bg-lantern-orange/20 font-japanese text-off-white"
            >
              私は
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion('です')}
              className="px-3 py-1 text-sm hover:bg-lantern-orange/20 font-japanese text-off-white"
            >
              です
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion('から来ました')}
              className="px-3 py-1 text-sm hover:bg-lantern-orange/20 font-japanese text-off-white"
            >
              から来ました
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion('よろしくお願いします')}
              className="px-3 py-1 text-sm hover:bg-lantern-orange/20 font-japanese text-off-white"
            >
              よろしくお願いします
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
