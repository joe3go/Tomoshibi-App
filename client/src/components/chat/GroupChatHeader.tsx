
/**
 * 🧩 Group chat specific header component
 * ✅ Displays group participants and conversation info
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Globe } from "lucide-react";
import type { GroupPersona } from "@/types/chat";

interface GroupChatHeaderProps {
  conversation: {
    title: string;
  };
  groupPersonas: GroupPersona[];
  showFurigana: boolean;
  onToggleFurigana: () => void;
  romajiMode: boolean;
  onToggleRomajiMode: () => void;
  onBack: () => void;
}

export function GroupChatHeader({
  conversation,
  groupPersonas,
  showFurigana,
  onToggleFurigana,
  romajiMode,
  onToggleRomajiMode,
  onBack
}: GroupChatHeaderProps) {
  const getAvatarImage = (persona: GroupPersona) => {
    if (!persona?.avatar_url) return "/avatars/default.png";
    return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {groupPersonas.slice(0, 3).map((persona, index) => (
              <img
                key={persona.id}
                src={getAvatarImage(persona)}
                alt={persona.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-background"
                style={{ zIndex: groupPersonas.length - index }}
              />
            ))}
            {groupPersonas.length > 3 && (
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                +{groupPersonas.length - 3}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{conversation.title}</h3>
            <p className="text-sm text-muted-foreground">
              {groupPersonas.length} participants
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleFurigana}>
          {showFurigana ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          Furigana
        </Button>
        <Button variant="outline" size="sm" onClick={onToggleRomajiMode}>
          <Globe className="w-4 h-4" />
          {romajiMode ? "あ" : "A"}
        </Button>
      </div>
    </header>
  );
}
