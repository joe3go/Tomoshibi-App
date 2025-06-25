import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
}

export default function FuriganaText({
  text,
  className = "",
  showToggleButton = true,
  showFurigana: externalShowFurigana,
  onToggleFurigana,
}: FuriganaTextProps) {
  const [internalShowFurigana, setInternalShowFurigana] = useState(true);

  // Use external state if provided, otherwise use internal state
  const showFurigana =
    externalShowFurigana !== undefined
      ? externalShowFurigana
      : internalShowFurigana;

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

  // Parse text to identify kanji with furigana notation: 漢字(かんじ) or 漢字（かんじ）
  const parseText = (input: string) => {
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

      <div className="text-lg leading-relaxed">
        {parsedText.map((part, index) => {
          if (part.type === "furigana") {
            return (
              <ruby
                key={index}
                className="inline-block mr-1"
                style={{ display: showFurigana ? 'ruby' : 'inline' }}
              >
                {part.kanji}
                {showFurigana && <rt className="text-xs">{part.reading}</rt>}
              </ruby>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>
    </div>
  );
}
