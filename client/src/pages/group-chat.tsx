import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useGroupChat } from '@/hooks/useGroupChat';
import { GroupChatHeader } from '@/components/chat/GroupChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { GroupTypingIndicator } from '@/components/chat/GroupTypingIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getPersonaDisplayColor } from '@/lib/group-chat-utilities';
import { logDebug, logError } from '../../../utils/logger';

const GroupChatPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user } = useSupabaseAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    messages,
    groupPersonas,
    isLoading,
    typingPersonas,
    sendMessage,
    initializeGroupChat
  } = useGroupChat(conversationId);

  // Get conversation ID from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlConversationId = urlParams.get('conversationId');

    if (urlConversationId) {
      setConversationId(urlConversationId);
    } else {
      // Try to get from localStorage as fallback
      const storedConversationId = localStorage.getItem('currentGroupConversationId');
      if (storedConversationId) {
        setConversationId(storedConversationId);
      } else {
        logDebug('No conversation ID found, redirecting to practice groups');
        setLocation('/practice-groups');
        return;
      }
    }
  }, [setLocation]);

  // Initialize group chat when conversation ID is available
  useEffect(() => {
    if (conversationId && !isInitialized) {
      logDebug('Initializing group chat with ID:', conversationId);
      initializeGroupChat();
      setIsInitialized(true);
    }
  }, [conversationId, isInitialized, initializeGroupChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message sending
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      await sendMessage(content);
    } catch (error) {
      logError('Failed to send message:', error);
    }
  };

  // Handle leaving the group chat
  const handleLeaveChat = () => {
    localStorage.removeItem('currentGroupConversationId');
    setLocation('/practice-groups');
  };

  // Show loading state while initializing
  if (!conversationId || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <GroupChatHeader 
        groupPersonas={groupPersonas}
        onLeaveChat={handleLeaveChat}
      />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Welcome to your group chat!</p>
            <p className="text-sm mt-2">Start the conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((message) => {
            const persona = groupPersonas.find(p => p.id === message.sender_persona_id);

            return (
              <ChatMessage
                key={message.id}
                message={message}
                persona={persona}
                isUser={message.sender_type === 'user'}
                personaColor={persona ? getPersonaDisplayColor(persona.name) : undefined}
              />
            );
          })
        )}

        {/* Typing Indicator */}
        <GroupTypingIndicator 
          typingPersonas={typingPersonas}
          groupPersonas={groupPersonas}
        />

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Type your message to the group..."
        />
      </div>
    </div>
  );
};

export default GroupChatPage;