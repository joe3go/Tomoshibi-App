
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Globe } from "lucide-react";
import type { Persona } from "@/types/personas";

interface ChatHeaderProps {
  // Navigation
  onBack: () => void;
  backButtonText?: string;
  
  // Chat info
  title: string;
  subtitle?: string;
  
  // Persona display
  isGroup: boolean;
  personas: Persona[];
  currentPersona?: Persona | null;
  
  // Controls
  showFurigana: boolean;
  onToggleFurigana: () => void;
  romajiMode: boolean;
  onToggleRomaji: () => void;
  onComplete?: () => void;
  
  // Styling
  className?: string;
}

export function ChatHeader({
  onBack,
  backButtonText = "Back",
  title,
  subtitle,
  isGroup,
  personas,
  currentPersona,
  showFurigana,
  onToggleFurigana,
  romajiMode,
  onToggleRomaji,
  onComplete,
  className = ""
}: ChatHeaderProps) {
  const getAvatarImage = (persona: Persona | null) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

  return (
    <header className={`flex items-center justify-between p-4 border-b bg-card ${className}`}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-3">
          {isGroup ? (
            <div className="flex -space-x-2">
              {personas.slice(0, 3).map((persona, index) => (
                <img
                  key={persona.id}
                  src={getAvatarImage(persona)}
                  alt={persona.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-background"
                  style={{ zIndex: personas.length - index }}
                />
              ))}
              {personas.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{personas.length - 3}
                </div>
              )}
            </div>
          ) : (
            <img
              src={getAvatarImage(currentPersona)}
              alt={currentPersona?.name || "Persona"}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          
          <div>
            <h3 className="font-medium">{title}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFurigana}
        >
          {showFurigana ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          Furigana
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleRomaji}
        >
          <Globe className="w-4 h-4" />
          {romajiMode ? "あ" : "A"}
        </Button>
        
        {onComplete && (
          <Button variant="ghost" size="sm" onClick={onComplete}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete
          </Button>
        )}
      </div>
    </header>
  );
}
