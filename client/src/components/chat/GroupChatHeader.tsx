
import { ArrowLeft, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Languages } from "lucide-react";
import type { Persona } from "@/types/personas";

interface GroupChatHeaderProps {
  onBack: () => void;
  title: string;
  subtitle?: string;
  personas: Persona[];
  showFurigana: boolean;
  onToggleFurigana: () => void;
  romajiMode: boolean;
  onToggleRomaji: () => void;
  onComplete?: () => void;
}

interface Persona {
  id: string;
  name: string;
  avatar_url?: string;
  type: string;
}

export function GroupChatHeader({
  onBack,
  title,
  subtitle,
  personas,
  showFurigana,
  onToggleFurigana,
  romajiMode,
  onToggleRomaji,
  onComplete
}: GroupChatHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            {/* Persona Avatars */}
            <div className="flex -space-x-2">
              {personas.slice(0, 3).map((persona) => (
                <div
                  key={persona.id}
                  className="relative h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden"
                >
                  {persona.avatar_url ? (
                    <img
                      src={persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`}
                      alt={persona.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling!.className = "h-full w-full flex items-center justify-center text-xs font-medium";
                      }}
                    />
                  ) : null}
                  <div className="hidden h-full w-full flex items-center justify-center text-xs font-medium">
                    {persona.name.charAt(0)}
                  </div>
                </div>
              ))}
              {personas.length > 3 && (
                <div className="relative h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{personas.length - 3}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {personas.map(p => p.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Toggle
            pressed={showFurigana}
            onPressedChange={onToggleFurigana}
            aria-label="Toggle furigana"
            size="sm"
          >
            あ
          </Toggle>
          
          <Toggle
            pressed={romajiMode}
            onPressedChange={onToggleRomaji}
            aria-label="Toggle romaji input"
            size="sm"
          >
            <Languages className="h-4 w-4" />
          </Toggle>

          {onComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onComplete}
              className="ml-2"
            >
              End Chat
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
