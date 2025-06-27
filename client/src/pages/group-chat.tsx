import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGroupChat } from "@/hooks/useGroupChat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { GroupChatHeader } from "@/components/chat/GroupChatHeader";
import { Button } from "@/components/ui/button";
import { logDebug } from "@utils/logger";
import { useChatUIState } from "@/hooks/useChatUIState";
import { useAutoScroll } from "@/hooks/useAutoScroll";

export default function GroupChat() {
  const [, params] = useRoute("/group-chat/:conversationId");
  const [, setLocation] = useLocation();
  const { messagesEndRef } = useAutoScroll(messages);

  const { showFurigana, romajiMode, toggleFurigana, toggleRomajiMode } = useChatUIState();

  // Check both URL query parameters and path parameters
  const urlParams = new URLSearchParams(window.location.search);
  const queryConversationId = urlParams.get('conversationId');

  // Extract from path if using /group-chat/:conversationId format
  const pathMatch = window.location.pathname.match(/\/group-chat\/([^\/]+)/);
  const pathConversationId = pathMatch ? pathMatch[1] : null;

  const urlConversationId = queryConversationId || pathConversationId;

  logDebug('Current URL:', window.location.href);
  logDebug('Query conversationId:', queryConversationId);
  logDebug('Path conversationId:', pathConversationId);
  logDebug('Final conversationId:', urlConversationId);

  const conversationId = params?.conversationId || urlConversationId;

  const {
    loading,
    sending,
    messages,
    conversation,
    groupPersonas,
    typingPersonas,
    sendMessage,
    getPersonaById
  } = useGroupChat(conversationId || "");

  // Auto-scroll handled by useAutoScroll hook

  // Furigana persistence handled by useChatUIState hook

  const handleSendMessage = (message: string) => {
    sendMessage(message, romajiMode);
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
      <GroupChatHeader
        conversation={conversation}
        groupPersonas={groupPersonas}
        showFurigana={showFurigana}
        onToggleFurigana={toggleFurigana}
        romajiMode={romajiMode}
        onToggleRomajiMode={toggleRomajiMode}
        onBack={() => setLocation("/practice-groups")}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            const senderPersona = msg.sender_persona_id ? getPersonaById(msg.sender_persona_id) : null;

            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                isGroup={true}
                persona={senderPersona}
                showFurigana={showFurigana}
              />
            );
          })}

          {/* Typing indicators */}
          {typingPersonas.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {Array.from(typingPersonas).map(personaId => {
                const persona = getPersonaById(personaId);
                return persona ? (
                  <div key={personaId} className="flex items-center gap-2">
                    <img
                      src={persona.avatar_url?.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`}
                      alt={persona.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span>{persona.name} is typing...</span>
                  </div>
                ) : null;
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={sending}
            placeholder="Type your message to the group..."
            romajiMode={romajiMode}
            onRomajiModeToggle={toggleRomajiMode}
          />
        </div>
      </div>
    </div>
  );
}