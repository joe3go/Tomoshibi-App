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

  // Parse text when it changes
  useEffect(() => {
    const parseText = async () => {
      if (text) {
        try {
          const tokens = await parseJapaneseTextWithFurigana(text);
          setParsedTokens(tokens);
        } catch (error) {
          console.warn('Text parsing failed:', error);
          setParsedTokens([{ type: 'text', surface: text }]);
        }
      } else {
        setParsedTokens([]);
      }
    };

    parseText();
  }, [text]);

  // Load preference from localStorage on mount (only for internal state)
  useEffect(() => {
    if (externalShowFurigana === undefined) {
      const savedPreference = localStorage.getItem("furigana-visible");
      if (savedPreference !== null) {
        setInternalShowFurigana(savedPreference === "true");
      }
    }
  }, [externalShowFurigana]);

  // Toggle function handles both internal and external state
  const toggleFurigana = () => {
    const newState = !showFurigana;
    if (onToggleFurigana) {
      onToggleFurigana(newState);
    } else {
      setInternalShowFurigana(newState);
      localStorage.setItem("furigana-visible", newState.toString());
    }
  };

  // Handle word click for definition lookup
  const handleWordClick = (token: ParsedToken, event: React.MouseEvent) => {
    if (!enableWordLookup || token.type === 'punctuation') return;
    
    const word = token.kanji || token.surface;
    if (!word) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedWord({
      word,
      reading: token.reading,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  // Get word styling based on type and interactivity
  const getWordStyling = (token: ParsedToken): string => {
    const baseStyle = "transition-colors duration-200";
    
    if (!enableWordLookup || token.type === 'punctuation') {
      return baseStyle;
    }

    return `${baseStyle} hover:bg-blue-100 hover:text-blue-800 cursor-pointer rounded px-1`;
  };

  // Parse text to identify kanji with furigana notation (fallback)
  const parseTextFallback = (input: string) => {
    // Matches both Japanese and standard parentheses
    const furiganaPattern = /([一-龯々]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaPattern.exec(input)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: input.slice(lastIndex, match.index),
        });
      }

      // Add the furigana match
      parts.push({
        type: "furigana",
        kanji: match[1],
        reading: match[2],
      });

      lastIndex = furiganaPattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push({
        type: "text",
        content: input.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: input }];
  };

  const parsedText = parseText(text);

  return (
    <div className={className}>
      {showToggleButton && (
        <div className="mb-4">
          <Button
            onClick={toggleFurigana}
            variant="outline"
            size="sm"
            className="text-sm"
          >
            {showFurigana ? "Hide Furigana" : "Show Furigana"}
          </Button>
        </div>
      )}

      <div className="leading-relaxed">
        {parsedText.map((part, index) => {
          if (part.type === "furigana") {
            return showFurigana ? (
              <ruby key={index} className="inline-block mr-1">
                {part.kanji}
                <rt className="text-xs leading-none">{part.reading}</rt>
              </ruby>
            ) : (
              <span key={index}>{part.kanji}</span>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    </div>
  );
}
