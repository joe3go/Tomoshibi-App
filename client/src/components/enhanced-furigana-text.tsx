
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { parseJapaneseTextWithFurigana, ParsedToken } from "@/utils/japanese-parser";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [internalShowFurigana, setInternalShowFurigana] = useState(true);
  const [parsedTokens, setParsedTokens] = useState<ParsedToken[]>([]);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    reading?: string;
    position: { x: number; y: number };
    definition?: string;
  } | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);

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

  const handleWordClick = async (token: ParsedToken, e: React.MouseEvent) => {
    if (!enableWordLookup || (!token.kanji && !token.surface)) return;
    
    e.preventDefault();
    const word = token.kanji || token.surface;
    
    setSelectedWord({
      word,
      reading: token.reading,
      position: { x: e.clientX, y: e.clientY }
    });

    // Fetch definition
    setLoadingDefinition(true);
    try {
      const response = await fetch(`/api/word-definition/${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedWord(prev => prev ? {
          ...prev,
          definition: data.definitions?.[0]?.definition || 'No definition found'
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch definition:', error);
    } finally {
      setLoadingDefinition(false);
    }
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

      {selectedWord && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3 max-w-xs"
          style={{
            left: Math.min(selectedWord.position.x, window.innerWidth - 250),
            top: selectedWord.position.y - 120
          }}
        >
          <div className="text-sm font-medium">{selectedWord.word}</div>
          {selectedWord.reading && (
            <div className="text-xs text-muted-foreground mb-2">{selectedWord.reading}</div>
          )}
          
          {loadingDefinition ? (
            <div className="text-xs text-muted-foreground mb-2">Loading definition...</div>
          ) : selectedWord.definition && (
            <div className="text-xs text-muted-foreground mb-2 max-h-16 overflow-y-auto">
              {selectedWord.definition}
            </div>
          )}

          <div className="flex gap-2">
            {onSaveToVocab && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  onSaveToVocab(selectedWord.word, selectedWord.reading);
                  setSelectedWord(null);
                }}
              >
                Save
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setSelectedWord(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
