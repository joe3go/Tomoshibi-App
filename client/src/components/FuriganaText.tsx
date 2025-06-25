import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { parseJapaneseTextWithFurigana, ParsedToken } from "@/utils/japanese-parser";
import WordDefinitionPopup from "./WordDefinitionPopup";

interface FuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

export default function FuriganaText({
  text,
  className = "",
  showToggleButton = true,
  showFurigana: externalShowFurigana,
  onToggleFurigana,
  enableWordLookup = true,
  onSaveToVocab,
}: FuriganaTextProps) {
  const [showFurigana, setShowFurigana] = useState(true);
  const [tokens, setTokens] = useState<ParsedToken[]>([]);
  const [popupData, setPopupData] = useState<{ word: string; reading?: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const parsed = parseJapaneseTextWithFurigana(text);
    setTokens(parsed);
  }, [text]);

  // Load preference from localStorage on mount
  useEffect(() => {
    if (externalShowFurigana === undefined) {
      const saved = localStorage.getItem("furigana-visible");
      if (saved !== null) {
        setShowFurigana(saved === "true");
      }
    } else {
      setShowFurigana(externalShowFurigana);
    }
  }, [externalShowFurigana]);

  const handleToggle = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    if (onToggleFurigana) {
      onToggleFurigana(newState);
    } else {
      localStorage.setItem("furigana-visible", newState.toString());
    }
  };

  const handleClick = (e: React.MouseEvent, token: ParsedToken) => {
    if (!enableWordLookup) return;
    
    const word = token.kanji || token.content;
    if (!word) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupData({ 
      word, 
      reading: token.reading,
      x: rect.left, 
      y: rect.bottom + window.scrollY 
    });
  };

  return (
    <div className={`jt-wrap ${className}`}>
      {showToggleButton && (
        <Button
          variant="ghost"
          size="sm"
          className="jt-toggle mb-2"
          onClick={handleToggle}
        >
          {showFurigana ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="ml-1">{showFurigana ? "Hide" : "Show"} Reading Guides</span>
        </Button>
      )}

      <div className="jt-body leading-relaxed">
        {tokens.map((t, i) =>
          t.type === "text" ? (
            <span key={i} className="jt-text">{t.content}</span>
          ) : showFurigana ? (
            <ruby
              key={i}
              className="jt-ruby inline-block mr-1 hover:bg-blue-100 cursor-pointer rounded px-1 transition-colors"
              onClick={(e) => handleClick(e, t)}
            >
              {t.kanji}
              <rt className="text-xs text-blue-600 font-medium">
                {t.reading}
              </rt>
            </ruby>
          ) : (
            <span
              key={i}
              className="jt-kanji hover:bg-blue-100 cursor-pointer rounded px-1 transition-colors"
              onClick={(e) => handleClick(e, t)}
            >
              {t.kanji}
            </span>
          )
        )}
      </div>

      {popupData && (
        <WordDefinitionPopup
          word={popupData.word}
          reading={popupData.reading}
          x={popupData.x}
          y={popupData.y}
          onClose={() => setPopupData(null)}
          onSave={onSaveToVocab}
        />
      )}
    </div>
  );
}