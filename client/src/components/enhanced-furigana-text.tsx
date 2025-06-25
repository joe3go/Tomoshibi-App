import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import WordDefinitionPopup from './word-definition-popup';

interface FuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
  enableWordHover?: boolean;
}

interface ParsedText {
  type: 'text' | 'furigana';
  content?: string;
  kanji?: string;
  reading?: string;
}

let hoverTimeout: NodeJS.Timeout | null = null;

export default function EnhancedFuriganaText({
  text,
  className = "",
  showToggleButton = true,
  showFurigana: externalShowFurigana,
  onToggleFurigana,
  enableWordHover = true,
}: FuriganaTextProps) {
  const [internalShowFurigana, setInternalShowFurigana] = useState(true);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isPopupLocked, setIsPopupLocked] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

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
  const parseText = (input: string): ParsedText[] => {
    // Matches both Japanese and standard parentheses
    const furiganaPattern = /([一-龯々]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    const parts: ParsedText[] = [];
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

  // Extract individual words from text for hover functionality
  const extractWords = (content: string): string[] => {
    // More sophisticated Japanese text segmentation
    const words: string[] = [];
    let currentWord = '';

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      // Check character type
      const isKanji = /[一-龯々]/.test(char);
      const isHiragana = /[ぁ-ん]/.test(char);
      const isKatakana = /[ァ-ヶー]/.test(char);
      const isAlphabetic = /[A-Za-z]/.test(char);
      const isNumber = /\d/.test(char);
      const isPunctuation = /[。、！？「」（）\s]/.test(char);

      if (isPunctuation) {
        if (currentWord.length > 0) {
          words.push(currentWord);
          currentWord = '';
        }
      } else if (isKanji || isHiragana || isKatakana || isAlphabetic || isNumber) {
        currentWord += char;

        // Break on character type changes (except kanji to hiragana)
        const nextChar = content[i + 1];
        if (nextChar) {
          const nextIsKanji = /[一-龯々]/.test(nextChar);
          const nextIsHiragana = /[ぁ-ん]/.test(nextChar);
          const nextIsKatakana = /[ァ-ヶー]/.test(nextChar);
          const nextIsAlphabetic = /[A-Za-z]/.test(nextChar);
          const nextIsNumber = /\d/.test(nextChar);
          const nextIsPunctuation = /[。、！？「」（）\s]/.test(nextChar);

          // Break conditions
          if (nextIsPunctuation || 
              (isKatakana && !nextIsKatakana) ||
              (isAlphabetic && !nextIsAlphabetic) ||
              (isNumber && !nextIsNumber) ||
              (isHiragana && (nextIsKanji || nextIsKatakana)) ||
              (isKanji && nextIsKatakana)) {
            if (currentWord.length > 0) {
              words.push(currentWord);
              currentWord = '';
            }
          }
        }
      }
    }

    if (currentWord.length > 0) {
      words.push(currentWord);
    }

    return words.filter(word => word.length > 0 && /[一-龯々ぁ-んァ-ヶー]/.test(word));
  };

  const handleWordHover = useCallback((word: string, event: React.MouseEvent) => {
    if (!enableWordHover || word.length < 2) return;

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Debounce the hover with 200ms delay
    hoverTimeout = setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setPopupPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY,
      });
      setHoveredWord(word);
      setIsPopupLocked(false);
    }, 200);
  }, [enableWordHover]);

  const handleWordLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Only close if not locked
    if (!isPopupLocked) {
      setTimeout(() => {
        if (!isPopupLocked) {
          setHoveredWord(null);
        }
      }, 300);
    }
  }, [isPopupLocked]);

  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    if (!enableWordHover) return;

    event.preventDefault();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY,
    });
    setHoveredWord(word);
    setIsPopupLocked(true);
  }, [enableWordHover]);

  const closePopup = useCallback(() => {
    setHoveredWord(null);
    setIsPopupLocked(false);
  }, []);

  const renderTextWithHover = (content: string) => {
    if (!enableWordHover) {
      return <span>{content}</span>;
    }

    const words = extractWords(content);
    if (words.length === 0) {
      return <span>{content}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    words.forEach((word, index) => {
      const wordIndex = content.indexOf(word, lastIndex);

      // Add text before the word
      if (wordIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, wordIndex)}
          </span>
        );
      }

      // Add the hoverable word
      parts.push(
        <span
          key={`word-${index}`}
          className="cursor-pointer hover:bg-accent/50 hover:text-accent-foreground rounded px-0.5 transition-colors"
          onMouseEnter={(e) => handleWordHover(word, e)}
          onMouseLeave={handleWordLeave}
          onClick={(e) => handleWordClick(word, e)}
        >
          {word}
        </span>
      );

      lastIndex = wordIndex + word.length;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  const renderTextWithFurigana = (text: string) => {
    if (!showFurigana) {
      return <span className="japanese-text">{text}</span>;
    }

    // Parse furigana in format: kanji[furigana]
    const furiganaRegex = /([一-龯々]+)\[([ひらがな\u3040-\u309F]+)\]/g;
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    let match;
    while ((match = furiganaRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      // Add furigana ruby element
      const kanji = match[1];
      const reading = match[2];
      elements.push(
        <ruby key={match.index} className="furigana-ruby">
          {kanji}
          <rt className="furigana-reading">{reading}</rt>
        </ruby>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : <span className="japanese-text">{text}</span>;
  };

  const parsedText = parseText(text);

  return (
    <div className={className} ref={textRef}>
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
                className={`inline-block mr-1 ${showFurigana ? "" : "hide-furigana"}`}
              >
                <span
                  className="cursor-pointer hover:bg-accent/50 hover:text-accent-foreground rounded px-0.5 transition-colors"
                  onMouseEnter={(e) => enableWordHover && handleWordHover(part.kanji!, e)}
                  onMouseLeave={handleWordLeave}
                  onClick={(e) => enableWordHover && handleWordClick(part.kanji!, e)}
                >
                  {part.kanji}
                </span>
                <rt className="text-xs">{part.reading}</rt>
              </ruby>
            );
          } else {
            return (
              <span key={index} className="mr-1">
                {renderTextWithHover(part.content || "")}
              </span>
            );
          }
        })}
      </div>

      {/* Word Definition Popup */}
      {hoveredWord && (
        <WordDefinitionPopup
          word={hoveredWord}
          position={popupPosition}
          onClose={closePopup}
          isLocked={isPopupLocked}
        />
      )}
    </div>
  );
}