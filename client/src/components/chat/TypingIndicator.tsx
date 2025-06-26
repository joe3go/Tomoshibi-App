
import React from "react";
import type { Persona } from "@/types/personas";

interface TypingIndicatorProps {
  personas: Persona[];
  typingPersonaIds: string[] | Set<string>;
  showPersonaName?: boolean;
  className?: string;
}

export function TypingIndicator({
  personas,
  typingPersonaIds,
  showPersonaName = true,
  className = ""
}: TypingIndicatorProps) {
  const typingIds = Array.isArray(typingPersonaIds) ? typingPersonaIds : Array.from(typingPersonaIds);
  const typingPersonas = personas.filter(p => typingIds.includes(p.id));

  if (typingPersonas.length === 0) return null;

  const getAvatarImage = (persona: Persona) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

  const getPersonaBubbleStyles = (persona: Persona) => {
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

  return (
    <div className={`space-y-4 ${className}`}>
      {typingPersonas.map((persona) => (
        <div key={persona.id} className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <img
              src={getAvatarImage(persona)}
              alt={persona.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>

          <div className={`rounded-lg p-3 ${getPersonaBubbleStyles(persona)}`}>
            {showPersonaName && (
              <div className="text-xs font-medium mb-1 opacity-80">
                {persona.name}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm opacity-70">Thinking...</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
