
import React from "react";
import FuriganaText from "@/components/FuriganaText";
import { MessageWithVocab } from "@/components/MessageWithVocab";
import type { Persona } from "@/types/personas";

interface ChatMessageProps {
  // Message data
  id: string;
  content: string;
  senderType: 'user' | 'ai';
  englishTranslation?: string;
  suggestions?: string[];
  createdAt?: string;
  
  // Persona data
  senderPersona?: Persona | null;
  isGroup?: boolean;
  
  // Display options
  showFurigana: boolean;
  showPersonaName?: boolean;
  showTimestamp?: boolean;
  
  // Callbacks
  onSaveToVocab?: (word: string, reading?: string) => void;
  
  // Styling
  className?: string;
}

export function ChatMessage({
  id,
  content,
  senderType,
  englishTranslation,
  suggestions,
  createdAt,
  senderPersona,
  isGroup = false,
  showFurigana,
  showPersonaName = false,
  showTimestamp = false,
  onSaveToVocab,
  className = ""
}: ChatMessageProps) {
  const getAvatarImage = (persona: Persona | null) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

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

    return 'bg-gray-100 text-gray-900 border border-gray-200';
  };

  return (
    <div
      className={`flex items-start gap-3 ${senderType === 'user' ? 'flex-row-reverse' : 'flex-row'} ${className}`}
    >
      <div className="flex-shrink-0">
        {senderType === 'user' ? (
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
        className={`max-w-[70%] rounded-lg p-3 ${getMessageBubbleStyles(senderType, senderPersona)}`}
      >
        {/* Persona name and timestamp for AI messages */}
        {senderType === 'ai' && (showPersonaName || showTimestamp) && senderPersona && (
          <div className="relative mb-2">
            {createdAt && showTimestamp && (
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full 
                ${Date.now() - new Date(createdAt).getTime() < 30000 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-muted'
                }`}
              />
            )}
            <div className="text-xs font-medium opacity-80">
              {showPersonaName && senderPersona.name}
              {showTimestamp && createdAt && (
                <span className="ml-2 text-muted-foreground">
                  {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )}

        <MessageWithVocab content={content}>
          <div className="text-sm leading-relaxed">
            <FuriganaText
              text={content}
              showFurigana={showFurigana}
              showToggleButton={false}
              enableWordLookup={true}
              onSaveToVocab={onSaveToVocab}
            />
          </div>
        </MessageWithVocab>

        {senderType === 'ai' && englishTranslation && (
          <div className="mt-2">
            <details className="text-sm opacity-80">
              <summary className="cursor-pointer hover:opacity-100">
                Show English translation
              </summary>
              <div className="mt-1 p-2 bg-black/10 rounded-md">
                {englishTranslation}
              </div>
            </details>
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                Learning suggestions ({suggestions.length})
              </summary>
              <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                {suggestions.map((suggestion: string, index: number) => (
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
}
