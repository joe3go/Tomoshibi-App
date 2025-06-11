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
          className={`interactive-kanji cursor-pointer font-japanese relative inline-block ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {kanji}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="bottom" 
        className="bg-background border border-border p-3 max-w-xs shadow-lg rounded-lg z-50"
        sideOffset={5}
      >
        <div className="space-y-2">
          <div className="text-lg font-japanese text-center text-primary">
            {kanji}
          </div>
          <div className="text-sm text-center text-blue-600 font-japanese">
            {reading}
          </div>
          <div className="text-xs text-center text-foreground">
            {meaning}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
