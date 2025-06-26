
import type { Persona } from "@/types/personas";
import { getAvatarImage } from "@/lib/chat-utilities";

interface GroupTypingIndicatorProps {
  typingPersonas: Persona[];
  showPersonaName?: boolean;
}

export function GroupTypingIndicator({ 
  typingPersonas, 
  showPersonaName = true 
}: GroupTypingIndicatorProps) {
  if (typingPersonas.length === 0) return null;

  return (
    <div className="flex items-start gap-3 animate-in slide-in-from-bottom-1">
      {typingPersonas.map((persona) => (
        <div key={persona.id} className="flex items-start gap-3">
          <img
            src={getAvatarImage(persona)}
            alt={persona.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
            {showPersonaName && (
              <div className="text-xs text-gray-500 mb-1 font-medium">
                {persona.name}
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm text-gray-500 ml-2">typing...</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
