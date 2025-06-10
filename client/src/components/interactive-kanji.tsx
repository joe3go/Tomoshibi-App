import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InteractiveKanjiProps {
  kanji: string;
  reading: string;
  meaning: string;
  className?: string;
}

export default function InteractiveKanji({ 
  kanji, 
  reading, 
  meaning, 
  className = "" 
}: InteractiveKanjiProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <span 
          className={`interactive-kanji cursor-pointer font-japanese ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {kanji}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="glass-card border-glass-border p-3 max-w-xs"
      >
        <div className="space-y-2">
          <div className="text-lg font-japanese text-center text-lantern-orange">
            {kanji}
          </div>
          <div className="text-sm text-center text-sakura-blue font-japanese">
            {reading}
          </div>
          <div className="text-xs text-center text-off-white/80">
            {meaning}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
