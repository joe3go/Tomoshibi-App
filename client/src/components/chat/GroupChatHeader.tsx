
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
            <div className="relative">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
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
