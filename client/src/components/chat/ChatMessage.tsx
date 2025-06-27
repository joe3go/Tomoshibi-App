
/**
 * 🧩 Shared between solo and group chat
 * 🔒 Must remain mode-agnostic
 * ✅ All behavior controlled via props or context
 * ❌ No assumptions, no fallbacks — only schema-driven logic
 */
import React from "react";
import FuriganaText from "@/components/FuriganaText";
import type { GroupPersona } from "@/types/chat";

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
  
  const getPersonaBubbleStyles = (persona: GroupPersona | null) => {
    if (!persona) return 'bg-gray-100 text-gray-900 border border-gray-200';
    
    switch (persona.name) {
      case 'Keiko':
        return 'bg-rose-100 text-rose-900 border border-rose-200';
      case 'Aoi':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      case 'Haruki':
        return 'bg-orange-100 text-orange-900 border border-orange-200';
      case 'Satoshi':
        return 'bg-blue-100 text-blue-900 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-900 border border-gray-200';
    }
  };

  const getAvatarImage = (persona: GroupPersona | null) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

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
              ${Date.now() - new Date(message.created_at).getTime() < 30000 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-muted'
              }`}
            />
            <div className="text-xs font-medium opacity-80">
              {persona.name}
              <span className="ml-2 text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
