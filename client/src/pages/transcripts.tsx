
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MessageSquare } from "lucide-react";
import FuriganaText from "@/components/enhanced-furigana";

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
      <div className="transcripts-loading-container">
        <div className="transcripts-loading-content">
          <div className="transcripts-loading-spinner"></div>
          <p className="transcripts-loading-text">Loading transcripts...</p>
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
    <div className="transcripts-page-container">
      <div className="transcripts-content-wrapper">
        {/* Header */}
        <header className="transcripts-header">
          <div className="transcripts-header-content">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="transcripts-back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="transcripts-page-title">Conversation Transcripts</h1>
              <p className="transcripts-page-subtitle">Review your completed Japanese conversations</p>
            </div>
          </div>
        </header>

        <div className="transcripts-layout">
          {/* Transcript List */}
          <div className="transcripts-sidebar">
            <h3 className="transcripts-sidebar-title">Completed Conversations</h3>
            
            {!Array.isArray(completedConversations) || completedConversations.length === 0 ? (
              <Card>
                <CardContent className="transcripts-empty-state">
                  <MessageSquare className="transcripts-empty-icon" />
                  <h4 className="transcripts-empty-title">No transcripts yet</h4>
                  <p className="transcripts-empty-description">
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
                    className={`transcripts-conversation-card ${
                      selectedTranscript?.id === conversation.id 
                        ? 'transcripts-conversation-card-selected' 
                        : ''
                    }`}
                    onClick={() => setSelectedTranscript(conversation)}
                  >
                    <CardContent className="transcripts-conversation-content">
                      <div className="transcripts-conversation-header">
                        <div className={`transcripts-avatar ${persona?.type === "teacher" ? "transcripts-avatar-sensei" : "transcripts-avatar-yuki"}`}>
                          <span className="transcripts-avatar-text">
                            {persona?.type === "teacher" ? "先" : "友"}
                          </span>
                        </div>
                        <div className="transcripts-conversation-info">
                          <h4 className="transcripts-conversation-persona">
                            {persona?.name || "Unknown"}
                          </h4>
                          <p className="transcripts-conversation-scenario">
                            {scenario?.title || "Practice Session"}
                          </p>
                        </div>
                      </div>

                      <div className="transcripts-conversation-meta">
                        <Badge variant="secondary" className="transcripts-status-badge">
                          Completed
                        </Badge>
                        <div className="transcripts-conversation-date">
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
          <div className="transcripts-main">
            {selectedTranscript ? (
              <Card className="transcripts-viewer">
                <CardHeader>
                  <CardTitle className="transcripts-viewer-title">
                    <span>Conversation Transcript</span>
                    <div className="transcripts-viewer-controls">
                      <FuriganaText 
                        text="" 
                        showToggleButton={true}
                        className="hidden"
                      />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="transcripts-viewer-content">
                  {messagesLoading ? (
                    <div className="transcripts-messages-loading">
                      <div className="transcripts-loading-spinner"></div>
                    </div>
                  ) : (
                    <div className="transcripts-messages-list">
                      {(transcriptMessages as any)?.messages?.map((msg: any) => {
                        const persona = Array.isArray(personas) ? personas.find((p: any) => p.id === selectedTranscript.personaId) : null;
                        
                        return (
                          <div key={msg.id} className={`transcripts-message ${
                            msg.sender === 'user' ? 'transcripts-message-user' : 'transcripts-message-ai'
                          }`}>
                            {msg.sender === 'ai' && (
                              <div className={`transcripts-message-avatar ${persona?.type === 'teacher' ? 'transcripts-avatar-sensei' : 'transcripts-avatar-yuki'}`}>
                                <span className="transcripts-message-avatar-text">
                                  {persona?.type === 'teacher' ? '先' : '友'}
                                </span>
                              </div>
                            )}
                            
                            <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                              {msg.feedback && (
                                <div className="transcripts-message-feedback">
                                  <p className="transcripts-feedback-text">✨ {msg.feedback}</p>
                                </div>
                              )}
                              
                              <div className="transcripts-message-content">
                                {renderJapaneseText(msg.content)}
                              </div>
                              
                              <div className="transcripts-message-timestamp">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            
                            {msg.sender === 'user' && (
                              <div className="transcripts-message-avatar transcripts-avatar-student">
                                <span className="transcripts-message-avatar-text">You</span>
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
              <Card className="transcripts-placeholder">
                <CardContent className="transcripts-placeholder-content">
                  <MessageSquare className="transcripts-placeholder-icon" />
                  <h4 className="transcripts-placeholder-title">Select a conversation</h4>
                  <p className="transcripts-placeholder-description">
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
