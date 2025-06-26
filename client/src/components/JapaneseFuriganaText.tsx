import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import WordDefinitionPopup from './WordDefinitionPopup';

// Kuroshiro integration for furigana parsing
let kuroshiro: any = null;
let isKuroshiroInitialized = false;

async function initializeKuroshiro() {
  if (isKuroshiroInitialized) return kuroshiro;
  
  try {
    const Kuroshiro = (await import('kuroshiro')).default;
    const KuromojiAnalyzer = (await import('kuroshiro-analyzer-kuromoji')).default;
    
    kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());
    isKuroshiroInitialized = true;
    return kuroshiro;
  } catch (error) {
    console.warn('Kuroshiro initialization failed, using fallback parser:', error);
    return null;
  }
}

interface ParsedToken {
  type: 'text' | 'kanji';
  surface: string;
  reading?: string;
  isClickable: boolean;
}

interface FuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  showFurigana?: boolean;
  onToggleFurigana?: (show: boolean) => void;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

const JapaneseFuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  showToggleButton = true,
  showFurigana: externalShowFurigana,
  onToggleFurigana,
  enableWordLookup = true,
  onSaveToVocab,
}) => {
  const [internalShowFurigana, setInternalShowFurigana] = useState(true);
  const [parsedTokens, setParsedTokens] = useState<ParsedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    reading?: string;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use external state if provided, otherwise use internal state
  const showFurigana = externalShowFurigana !== undefined ? externalShowFurigana : internalShowFurigana;

  // Load furigana preference from localStorage
  useEffect(() => {
    if (externalShowFurigana === undefined) {
      const saved = localStorage.getItem('furigana-visible');
      if (saved !== null) {
        setInternalShowFurigana(saved === 'true');
      }
    }
  }, [externalShowFurigana]);

  // Parse text with kuroshiro or fallback
  useEffect(() => {
    const parseText = async () => {
      if (!text || text.trim().length === 0) {
        setParsedTokens([]);
        return;
      }

      setIsLoading(true);
      try {
        const k = await initializeKuroshiro();
        
        if (k) {
          // Use kuroshiro for accurate parsing
          const result = await k.convert(text, { mode: 'furigana', to: 'hiragana' });
          const tokens = parseKuroshiroResult(result);
          setParsedTokens(tokens);
        } else {
          // Fallback parser for simple furigana notation
          const tokens = parseFallback(text);
          setParsedTokens(tokens);
        }
      } catch (error) {
        console.warn('Text parsing failed, using fallback:', error);
        const tokens = parseFallback(text);
        setParsedTokens(tokens);
      } finally {
        setIsLoading(false);
      }
    };

    parseText();
  }, [text]);

  const parseKuroshiroResult = (result: string): ParsedToken[] => {
    const tokens: ParsedToken[] = [];
    const rubyRegex = /<ruby>(.+?)<rt>(.+?)<\/rt><\/ruby>/g;
    let lastIndex = 0;
    let match;

    while ((match = rubyRegex.exec(result)) !== null) {
      // Add text before ruby
      if (match.index > lastIndex) {
        const beforeText = result.slice(lastIndex, match.index);
        tokens.push(...parseNonRubyText(beforeText));
      }

      // Add ruby token
      tokens.push({
        type: 'kanji',
        surface: match[1],
        reading: match[2],
        isClickable: true,
      });

      lastIndex = rubyRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < result.length) {
      const remainingText = result.slice(lastIndex);
      tokens.push(...parseNonRubyText(remainingText));
    }

    return tokens;
  };

  const parseFallback = (input: string): ParsedToken[] => {
    // Handle manual furigana notation: 漢字(かんじ) or 漢字（かんじ）
    const furiganaRegex = /([一-龯々\u3400-\u4DBF]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g;
    const tokens: ParsedToken[] = [];
    let lastIndex = 0;
    let match;

    while ((match = furiganaRegex.exec(input)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        const beforeText = input.slice(lastIndex, match.index);
        tokens.push(...parseNonRubyText(beforeText));
      }

      // Add furigana token
      tokens.push({
        type: 'kanji',
        surface: match[1],
        reading: match[2],
        isClickable: true,
      });

      lastIndex = furiganaRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      const remainingText = input.slice(lastIndex);
      tokens.push(...parseNonRubyText(remainingText));
    }

    return tokens;
  };

  const parseNonRubyText = (text: string): ParsedToken[] => {
    if (!text) return [];

    const tokens: ParsedToken[] = [];
    let currentToken = '';

    for (const char of text) {
      if (isPunctuation(char) || isWhitespace(char)) {
        if (currentToken) {
          tokens.push({
            type: containsKanji(currentToken) ? 'kanji' : 'text',
            surface: currentToken,
            isClickable: containsKanji(currentToken),
          });
          currentToken = '';
        }
        tokens.push({
          type: 'text',
          surface: char,
          isClickable: false,
        });
      } else {
        currentToken += char;
      }
    }

    if (currentToken) {
      tokens.push({
        type: containsKanji(currentToken) ? 'kanji' : 'text',
        surface: currentToken,
        isClickable: containsKanji(currentToken),
      });
    }

    return tokens;
  };

  const containsKanji = (text: string): boolean => {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
  };

  const isPunctuation = (char: string): boolean => {
    return /^[。、！？「」『』（）(),.!?\[\]【】]$/.test(char);
  };

  const isWhitespace = (char: string): boolean => {
    return /\s/.test(char);
  };

  const handleToggle = () => {
    const newState = !showFurigana;
    if (onToggleFurigana) {
      onToggleFurigana(newState);
    } else {
      setInternalShowFurigana(newState);
      localStorage.setItem('furigana-visible', newState.toString());
    }
  };

  const handleWordClick = (token: ParsedToken, event: React.MouseEvent) => {
    if (!enableWordLookup || !token.isClickable) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({
      word: token.surface,
      reading: token.reading,
      x: rect.left,
      y: rect.bottom + window.scrollY,
    });
  };

  const renderToken = (token: ParsedToken, index: number) => {
    const baseClasses = 'jp-text';
    const hoverClasses = token.isClickable && enableWordLookup 
      ? 'hover:bg-blue-100 hover:text-blue-800 cursor-pointer rounded px-1 transition-colors'
      : '';

    if (token.type === 'kanji' && token.reading && showFurigana) {
      return (
        <ruby
          key={index}
          className={`ruby-text inline-block mr-1 ${hoverClasses}`}
          onClick={(e) => handleWordClick(token, e)}
          title={enableWordLookup ? 'Click for definition' : undefined}
        >
          <rb className="ruby-base">{token.surface}</rb>
          <rt className="ruby-annotation text-xs leading-none font-normal opacity-80">
            {token.reading}
          </rt>
        </ruby>
      );
    }

    return (
      <span
        key={index}
        className={`${baseClasses} ${hoverClasses}`}
        onClick={(e) => handleWordClick(token, e)}
        title={token.isClickable && enableWordLookup ? 'Click for definition' : undefined}
      >
        {token.surface}
      </span>
    );
  };

  return (
    <div className={`jp-wrap relative ${className}`} ref={containerRef}>
      {showToggleButton && (
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="ruby-toggle flex items-center gap-1 text-sm"
            onClick={handleToggle}
          >
            {showFurigana ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showFurigana ? 'Hide' : 'Show'} Furigana</span>
          </Button>
        </div>
      )}

      <div 
        className="jp-body leading-relaxed text-base"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        {isLoading ? (
          <span className="text-gray-500">Parsing...</span>
        ) : (
          parsedTokens.map(renderToken)
        )}
      </div>

      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord.word}
          reading={selectedWord.reading}
          x={selectedWord.x}
          y={selectedWord.y}
          onClose={() => setSelectedWord(null)}
          onSave={onSaveToVocab}
        />
      )}
    </div>
  );
};

export default JapaneseFuriganaText;