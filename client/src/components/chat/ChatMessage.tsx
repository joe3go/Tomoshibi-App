
/**
 * 🧩 Shared between solo and group chat
 * 🔒 Must remain mode-agnostic
 * ✅ All behavior controlled via props or context
 * ❌ No assumptions, no fallbacks — only schema-driven logic
 */
import React from "react";
import FuriganaText from "@/components/FuriganaText";
import type { GroupPersona } from "@/types/chat";
import { getAvatarImage, getPersonaBubbleStyles, handleAvatarError } from "@/lib/chat/avatarUtils";
import { formatMessageTime, isRecentMessage } from "@/lib/chat/messageUtils";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender_type: 'user' | 'ai';
    sender_persona_id?: string;
    english_translation?: string;
    created_at: string;
  };
  isGroup: boolean;
  persona?: GroupPersona | null;
  showFurigana: boolean;
  className?: string;
}

export function ChatMessage({ 
  message, 
  isGroup, 
  persona, 
  showFurigana,
  className = ""
}: ChatMessageProps) {
  const isUser = message.sender_type === 'user';
  
  // Using shared utilities from avatarUtils

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}>
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            You
          </div>
        ) : (
          <img
            src={getAvatarImage(persona)}
            alt={persona?.name || "AI"}
            className="w-8 h-8 rounded-full object-cover"
            onError={handleAvatarError}
          />
        )}
      </div>

      <div className={`max-w-[70%] rounded-lg p-3 ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : getPersonaBubbleStyles(persona)
      }`}>
        {/* Persona name and timestamp for AI messages in group chat */}
        {!isUser && isGroup && persona && (
          <div className="relative mb-2">
            <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full 
              ${isRecentMessage(message.created_at) 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-muted'
              }`}
            />
            <div className="text-xs font-medium opacity-80">
              {persona.name}
              <span className="ml-2 text-muted-foreground">
                {formatMessageTime(message.created_at)}
              </span>
            </div>
          </div>
        )}
        
        <FuriganaText
          text={message.content}
          showFurigana={showFurigana}
          showToggleButton={false}
          enableWordLookup={true}
          onSaveToVocab={(word: string, reading?: string) => {
            console.log('Saving word to vocab:', word, reading);
          }}
          className="text-sm leading-relaxed"
        />

        {!isUser && message.english_translation && (
          <div className="mt-2">
            <details className="text-sm opacity-80">
              <summary className="cursor-pointer hover:opacity-100">
                Show English translation
              </summary>
              <div className="mt-1 p-2 bg-black/10 rounded-md">
                {message.english_translation}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
