import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import WordDefinitionPopup from "./WordDefinitionPopup";

interface ParsedToken {
  word: string;
  reading: string;
  base_form: string;
  pos: string;
}

interface FuriganaTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

export default function FuriganaText({
  text,
  className = "",
  showFurigana: externalShowFurigana,
  enableWordLookup = true,
  onSaveToVocab,
}: FuriganaTextProps) {
  const [showFurigana, setShowFurigana] = useState(true);
  const [tokens, setTokens] = useState<ParsedToken[]>([]);
  const [popupData, setPopupData] = useState<{ word: string; reading?: string; x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load furigana preference from localStorage
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

  // Parse text when it changes
  useEffect(() => {
    if (!text?.trim()) {
      setTokens([]);
      return;
    }

    const parseText = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/parse-japanese', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`Parse failed: ${response.status}`);
        }

        const parsedTokens = await response.json();
        setTokens(parsedTokens);
      } catch (error) {
        console.error('Failed to parse Japanese text:', error);
        // Fallback to simple character parsing
        setTokens([{ word: text, reading: text, base_form: text, pos: "unknown" }]);
      } finally {
        setIsLoading(false);
      }
    };

    parseText();
  }, [text]);

  const handleToggle = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  const handleWordClick = (e: React.MouseEvent, token: ParsedToken) => {
    if (!enableWordLookup) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupData({ 
      word: token.base_form,
      reading: token.reading,
      x: rect.left, 
      y: rect.bottom + window.scrollY 
    });
  };

  const isKanji = (char: string) => {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
  };

  // Enhanced Japanese text parser
  const parseJapaneseText = (text: string): ParsedToken[] => {
    const tokens: ParsedToken[] = [];
    
    // Handle furigana notation: 漢字(かんじ) or 漢字（かんじ）
    const furiganaPattern = /([一-龯々\u3400-\u4DBF]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        tokens.push(...tokenizeText(beforeText));
      }

      // Add the furigana match
      tokens.push({
        word: match[1],
        reading: match[2],
        base_form: match[1],
        pos: "word"
      });

      lastIndex = furiganaPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      tokens.push(...tokenizeText(remainingText));
    }

    return tokens.length > 0 ? tokens : tokenizeText(text);
  };

  const tokenizeText = (text: string): ParsedToken[] => {
    if (!text.trim()) return [];
    
    const tokens: ParsedToken[] = [];
    const segments = text.match(/[\u4e00-\u9faf\u3400-\u4dbf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z0-9]+|[^\s\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbfa-zA-Z0-9]+/g) || [text];
    
    segments.forEach(segment => {
      if (segment.trim()) {
        tokens.push({
          word: segment,
          reading: isKanji(segment) ? segment : segment,
          base_form: segment,
          pos: isKanji(segment) ? "kanji" : /[\u3040-\u309f\u30a0-\u30ff]/.test(segment) ? "kana" : "other"
        });
      }
    });

    return tokens;
  };

  const shouldShowReading = (token: ParsedToken) => {
    return showFurigana && 
           token.reading && 
           token.reading !== token.word && 
           isKanji(token.word);
  };

  if (isLoading) {
    return (
      <div className={`txt-main ${className}`}>
        <div className="animate-pulse">Parsing Japanese text...</div>
      </div>
    );
  }

  return (
    <div className={`txt-main ${className}`} style={{ fontFamily: '"Noto Sans JP", "Inter", sans-serif' }}>
      <div className="mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="text-sm px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          {showFurigana ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="ml-1">{showFurigana ? "Hide" : "Show"} Furigana</span>
        </Button>
      </div>

      <div className="leading-relaxed text-base">
        {tokens.map((token, i) => {
          if (shouldShowReading(token)) {
            return (
              <ruby
                key={i}
                className="inline-block mr-1 hover:bg-blue-50 cursor-pointer rounded px-1 transition-colors duration-200"
                onClick={(e) => handleWordClick(e, token)}
                title={enableWordLookup ? "Click for definition" : undefined}
              >
                {token.word}
                <rt className="text-xs leading-none text-gray-600">{token.reading}</rt>
              </ruby>
            );
          } else {
            return (
              <span
                key={i}
                className={`${enableWordLookup && isKanji(token.word) ? 'hover:bg-blue-50 cursor-pointer rounded px-1' : ''} transition-colors duration-200`}
                onClick={(e) => enableWordLookup ? handleWordClick(e, token) : undefined}
                title={enableWordLookup && isKanji(token.word) ? "Click for definition" : undefined}
              >
                {token.word}
              </span>
            );
          }
        })}
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