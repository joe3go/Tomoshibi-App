import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MessageSquare } from "lucide-react";
import FuriganaText from "@/components/furigana-text";

export default function Transcripts() {
  const [, setLocation] = useLocation();
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);

  const { data: completedConversations, isLoading } = useQuery({
    queryKey: ["/api/conversations/completed"],
  });

  const { data: personas = [] } = useQuery({
    queryKey: ["/api/personas"],
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  const { data: transcriptMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/conversations/${selectedTranscript?.id}`],
    enabled: !!selectedTranscript,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  const renderJapaneseText = (text: string, showFurigana: boolean = true) => {
    const furiganaPattern = /([一-龯]+)\(([あ-んァ-ヶー]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push({
        type: 'furigana',
        kanji: match[1],
        reading: match[2]
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return <span key={index}>{part}</span>;
      }
      return (
        <ruby 
          key={index} 
          className={`toggle-furigana ${showFurigana ? '' : 'hide-furigana'}`}
        >
          {part.kanji}
          <rt>{part.reading}</rt>
        </ruby>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="content-card mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Conversation Transcripts</h1>
              <p className="text-muted-foreground">Review your completed Japanese conversations</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transcript List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-primary mb-4">Completed Conversations</h3>
            
            {!Array.isArray(completedConversations) || completedConversations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium text-foreground mb-2">No transcripts yet</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete some conversations to see transcripts here
                  </p>
                  <Button onClick={() => setLocation("/dashboard")} size="sm">
                    Start Practicing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              completedConversations.map((conversation: any) => {
                const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === conversation.personaId) : null;
                const scenario = Array.isArray(scenarios) ? scenarios.find((s: any) => s.id === conversation.scenarioId) : null;
                
                return (
                  <Card 
                    key={conversation.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTranscript?.id === conversation.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTranscript(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className={`avatar ${persona?.type === "teacher" ? "sensei" : "yuki"} flex-shrink-0`}>
                          <span className="font-japanese text-sm">
                            {persona?.type === "teacher" ? "先" : "友"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-primary">
                            {persona?.name || "Unknown"}
                          </h4>
                          <p className="text-sm text-foreground">
                            {scenario?.title || "Practice Session"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(conversation.completedAt || conversation.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Transcript Viewer */}
          <div className="lg:col-span-2">
            {selectedTranscript ? (
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Conversation Transcript</span>
                    <div className="flex items-center space-x-2">
                      <FuriganaText 
                        text="" 
                        showToggleButton={true}
                        className="hidden"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(transcriptMessages as any)?.messages?.map((msg: any) => {
                        const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === selectedTranscript.personaId) : null;
                        
                        return (
                          <div key={msg.id} className={`flex items-start space-x-3 ${
                            msg.sender === 'user' ? 'justify-end' : ''
                          }`}>
                            {msg.sender === 'ai' && (
                              <div className={`avatar ${persona?.type === 'teacher' ? 'sensei' : 'yuki'} flex-shrink-0`}>
                                <span className="text-sm font-japanese">
                                  {persona?.type === 'teacher' ? '先' : '友'}
                                </span>
                              </div>
                            )}
                            
                            <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                              {msg.feedback && (
                                <div className="mb-2 p-2 rounded-lg bg-green-50 border border-green-200">
                                  <p className="text-sm text-green-700">✨ {msg.feedback}</p>
                                </div>
                              )}
                              
                              <div className="font-japanese mb-2">
                                {renderJapaneseText(msg.content)}
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            
                            {msg.sender === 'user' && (
                              <div className="avatar student flex-shrink-0">
                                <span className="text-sm">You</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium text-foreground mb-2">Select a conversation</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a completed conversation from the left to view its transcript
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}