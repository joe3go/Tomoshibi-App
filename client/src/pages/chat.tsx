import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Settings,
  MoreHorizontal,
  Send,
  CheckCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EnhancedFuriganaText from "@/components/enhanced-furigana-text";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

// Placeholder translation function (replace with actual API call)
async function translateEnglishToJapanese(text: string): Promise<string> {
  // Simulate an API call with a delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Basic translation logic (replace with real translation)
  return `(Translated) ${text}`;
}

export default function Chat() {
  const [, params] = useRoute("/chat/:conversationId");
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversationId = params?.conversationId
    ? parseInt(params.conversationId)
    : 0;

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
      // Immediately add user message to UI
      const userMessage = {
        id: Date.now(), // Temporary ID
        content,
        sender: 'user', // Fixed: changed from 'role' to 'sender' for proper rendering
        createdAt: new Date().toISOString(),
        vocabUsed: [],
        grammarUsed: []
      };

      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
        (oldData: any) => ({
          ...oldData,
          messages: [...(oldData?.messages || []), userMessage],
        }),
      );

      // Check if the message contains English, if so, translate it
      let translatedContent = content;
      if (/[a-zA-Z]/.test(content)) {
        translatedContent = await translateEnglishToJapanese(content);
      }

      // Send to server
      const response = await apiRequest(
        "POST",
        `/api/conversations/${conversationId}/messages`,
        {
          content: translatedContent, // Send translated content for processing
        },
      );
      return await response.json();
    },
    onSuccess: (messages) => {
      // Replace with actual messages from server
      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
        (oldData: any) => ({
          ...oldData,
          messages,
        }),
      );
      setMessage("");
    },
    onError: (error) => {
      // Remove the optimistic user message on error
      queryClient.setQueryData(
        [`/api/conversations/${conversationId}`],
        (oldData: any) => ({
          ...oldData,
          messages: oldData?.messages?.slice(0, -1) || [],
        }),
      );

      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH",
        `/api/conversations/${conversationId}`,
        {
          status: "completed",
          completedAt: new Date().toISOString(),
        },
      );
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate multiple query keys to refresh all conversation lists
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/completed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });

      toast({
        title: "Conversation completed!",
        description:
          "Great job! This conversation has been moved to your transcripts.",
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
    setMessage((prev) => prev + text);
  };

  const handleFuriganaToggle = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  const getAvatarImage = (persona: any) => {
    if (persona?.type === "teacher") return aoiAvatar; // Aoi is the female teacher
    if (persona?.type === "friend") return harukiAvatar; // Haruki is the male friend
    return aoiAvatar; // Default fallback
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="content-card p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary border-l-transparent rounded-full animate-spin"></div>
            <span className="text-foreground">Loading conversation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!conversationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="content-card">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Conversation Not Found
            </h2>
            <p className="text-muted-foreground mb-4">
              This conversation doesn't exist or you don't have access to it.
            </p>
            <Button
              onClick={() => setLocation("/dashboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
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
        <Card className="content-card p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Conversation Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            This conversation doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const persona = Array.isArray(personas)
    ? personas.find((p: any) => p.id === conversation?.personaId)
    : null;
  const scenario = Array.isArray(scenarios)
    ? scenarios.find((s: any) => s.id === conversation?.scenarioId)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <header className="content-card rounded-b-2xl p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="p-2 text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
              <img
                src={getAvatarImage(persona)}
                alt={persona?.name || "Persona"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text avatar if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                      persona?.type === "teacher"
                        ? "from-primary to-primary/60"
                        : "from-accent to-accent/60"
                    }">
                      <span class="text-lg text-foreground">
                        ${persona?.type === "teacher" ? "👩‍🏫" : "🧑‍🎤"}
                      </span>
                    </div>
                  `;
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {persona?.name || "AI"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {scenario?.title || "Conversation"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFuriganaToggle}
            className="px-3 py-1 text-xs hover:bg-primary/20 transition-colors text-foreground"
          >
            {showFurigana ? "Hide Furigana" : "Show Furigana"}
          </Button>
          {/* Debug info - remove this later */}
          <span className="text-xs text-muted-foreground">
            Furigana: {showFurigana ? "ON" : "OFF"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => completeConversationMutation.mutate()}
            disabled={completeConversationMutation.isPending}
            className="px-3 py-1 text-xs hover:bg-green-500/20 transition-colors text-foreground flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-foreground hover:bg-muted"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.sender === "user" ? "justify-end" : ""
              }`}
            >
              {msg.sender === "ai" && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                  <img
                    src={getAvatarImage(persona)}
                    alt={persona?.name || "AI"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to text avatar if image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                          persona?.type === "teacher"
                            ? "from-primary to-primary/60"
                            : "from-accent to-accent/60"
                        }">
                          <span class="text-sm font-japanese text-foreground">
                            ${persona?.type === "teacher" ? "先" : "友"}
                          </span>
                        </div>
                      `;
                    }}
                  />
                </div>
              )}

              <div
                className={`message-bubble ${msg.sender === "user" ? "user" : "ai"}`}
              >
                {msg.feedback && (
                  <div className="mb-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-green-700">✨ {msg.feedback}</p>
                  </div>
                )}

                <div
                  className={`font-japanese mb-2 ${msg.sender === "user" ? "text-primary-foreground" : "text-foreground"}`}
                >
                  <EnhancedFuriganaText
                    text={msg.content}
                    showFurigana={showFurigana}
                    showToggleButton={false}
                    enableWordHover={msg.sender === "ai"}
                    className="text-inherit"
                  />
                </div>

                {msg.sender === "ai" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    💡 Keep practicing! You're doing great!
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm text-primary-foreground font-medium">
                    You
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Enhanced Typing Indicator */}
          {sendMessageMutation.isPending && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0">
                <img
                  src={getAvatarImage(persona)}
                  alt={persona?.name || "AI"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                        persona?.type === "teacher"
                          ? "from-primary to-primary/60"
                          : "from-accent to-accent/60"
                      }">
                        <span class="text-sm text-foreground">
                          ${persona?.type === "teacher" ? "👩‍🏫" : "🧑‍🎤"}
                        </span>
                      </div>
                    `;
                  }}
                />
              </div>
              <div className="message-bubble ai">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="content-card rounded-t-2xl p-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response in Japanese... (English is ok too!)"
                className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-primary/20 resize-none"
                rows={1}
                style={{ maxHeight: "120px" }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2"
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
              onClick={() => insertSuggestion("私は")}
              className="px-3 py-1 text-sm hover:bg-primary/20 font-japanese text-foreground"
            >
              私は
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion("です")}
              className="px-3 py-1 text-sm hover:bg-primary/20 font-japanese text-foreground"
            >
              です
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion("から来ました")}
              className="px-3 py-1 text-sm hover:bg-primary/20 font-japanese text-foreground"
            >
              から来ました
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertSuggestion("よろしくお願いします")}
              className="px-3 py-1 text-sm hover:bg-primary/20 font-japanese text-foreground"
            >
              よろしくお願いします
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}