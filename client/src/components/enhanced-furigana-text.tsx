
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { parseJapaneseTextWithFurigana, ParsedToken } from "@/utils/japanese-parser";

interface EnhancedFuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

export default function EnhancedFuriganaText({
  text,
  className = "",
  showToggleButton = true,
  showFurigana: externalShowFurigana,
  onToggleFurigana,
  enableWordLookup = true,
  onSaveToVocab,
}: EnhancedFuriganaTextProps) {
  const [internalShowFurigana, setInternalShowFurigana] = useState(true);
  const [parsedTokens, setParsedTokens] = useState<ParsedToken[]>([]);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    reading?: string;
    position: { x: number; y: number };
  } | null>(null);

  // Use external state if provided, otherwise use internal state
  const showFurigana =
    externalShowFurigana !== undefined
      ? externalShowFurigana
      : internalShowFurigana;

  useEffect(() => {
    const parseText = async () => {
      if (text) {
        try {
          const tokens = await parseJapaneseTextWithFurigana(text);
          setParsedTokens(tokens);
        } catch (error) {
          console.warn('Enhanced furigana parsing failed:', error);
          // Fallback to simple parsing
          setParsedTokens([{ type: 'text', surface: text }]);
        }
      }
    };

    parseText();
  }, [text]);

  const handleToggle = () => {
    const newValue = !showFurigana;
    if (onToggleFurigana) {
      onToggleFurigana(newValue);
    } else {
      setInternalShowFurigana(newValue);
    }
    
    // Save preference to localStorage
    localStorage.setItem('furigana-preference', newValue.toString());
  };

  const handleWordClick = (token: ParsedToken, e: React.MouseEvent) => {
    if (!enableWordLookup || !token.kanji) return;
    
    e.preventDefault();
    setSelectedWord({
      word: token.kanji,
      reading: token.reading,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const getWordStyling = (token: ParsedToken) => {
    if (!enableWordLookup || !token.kanji) return "";
    return "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded px-0.5 transition-colors";
  };

  return (
    <div className={`furigana-wrapper ${className}`}>
      {showToggleButton && (
        <div className="mb-2">
          <Button
            variant="outline"
            onClick={handleToggle}
            size="sm"
            className="text-sm"
          >
            {showFurigana ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showFurigana ? "Hide Furigana" : "Show Furigana"}
          </Button>
        </div>
      )}

      <div className="jt-body">
        {parsedTokens.map((token, index) => {
          if (token.type === "furigana" && token.kanji && token.reading) {
            return showFurigana ? (
              <ruby 
                key={index} 
                className={`inline-block mr-0.5 align-top ${getWordStyling(token)}`}
                onClick={(e) => handleWordClick(token, e)}
              >
                {token.kanji}
                <rt className="!text-blue-600">{token.reading}</rt>
              </ruby>
            ) : (
              <span 
                key={index}
                className={getWordStyling(token)}
                onClick={(e) => handleWordClick(token, e)}
              >
                {token.kanji}
              </span>
            );
          }
          return (
            <span 
              key={index}
              className={getWordStyling(token)}
              onClick={(e) => handleWordClick(token, e)}
            >
              {token.surface}
            </span>
          );
        })}
      </div>

      {selectedWord && onSaveToVocab && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3 max-w-xs"
          style={{
            left: selectedWord.position.x,
            top: selectedWord.position.y - 60
          }}
        >
          <div className="text-sm font-medium">{selectedWord.word}</div>
          {selectedWord.reading && (
            <div className="text-xs text-muted-foreground">{selectedWord.reading}</div>
          )}
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              onSaveToVocab(selectedWord.word, selectedWord.reading);
              setSelectedWord(null);
            }}
          >
            Save to Vocabulary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full"
            onClick={() => setSelectedWord(null)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
