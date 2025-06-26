import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import WordDefinitionPopup from './WordDefinitionPopup';

// Import kuroshiro lazily to avoid SSR issues
let kuroshiro: any = null;

interface FuriganaToken {
  type: 'text' | 'kanji' | 'kana';
  surface: string;
  reading?: string;
  pos?: string;
}

interface FuriganaTextProps {
  text: string;
  className?: string;
  showToggleButton?: boolean;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  showToggleButton = true,
  enableWordLookup = true,
  onSaveToVocab
}) => {
  const [showFurigana, setShowFurigana] = useState(true);
  const [tokens, setTokens] = useState<FuriganaToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    reading?: string;
    x: number;
    y: number;
  } | null>(null);

  // Cache for parsed results
  const [cache] = useState(new Map<string, FuriganaToken[]>());

  // Enhanced fallback parser for Japanese text with furigana notation
  const parseWithFallback = (inputText: string): FuriganaToken[] => {
    const tokens: FuriganaToken[] = [];
    
    // Support multiple furigana formats:
    // 1. 漢字(かんじ) - parentheses format
    // 2. 漢字（かんじ） - full-width parentheses format  
    // 3. 漢字|かんじ - pipe format
    const patterns = [
      /([一-龯々\u3400-\u4DBF]+)\|([ぁ-んァ-ヶー]+)/g, // pipe format
      /([一-龯々\u3400-\u4DBF]+)[（\(]([ぁ-んァ-ヶー]+)[）\)]/g // parentheses format
    ];

    let processedText = inputText;
    let allMatches: Array<{match: RegExpMatchArray, start: number, end: number}> = [];

    // Find all matches from all patterns
    patterns.forEach(pattern => {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(inputText)) !== null) {
        allMatches.push({
          match,
          start: match.index!,
          end: match.index! + match[0].length
        });
      }
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start);

    let lastIndex = 0;

    for (const {match, start, end} of allMatches) {
      // Add text before this match
      if (start > lastIndex) {
        const beforeText = inputText.slice(lastIndex, start);
        if (beforeText.trim()) {
          tokens.push(...parseNonFuriganaText(beforeText));
        }
      }

      // Add the furigana match
      tokens.push({
        type: "kanji",
        surface: match[1],
        reading: match[2]
      });

      lastIndex = end;
    }

    // Add remaining text
    if (lastIndex < inputText.length) {
      const remainingText = inputText.slice(lastIndex);
      if (remainingText.trim()) {
        tokens.push(...parseNonFuriganaText(remainingText));
      }
    }

    return tokens.length > 0 ? tokens : [{ type: "text", surface: inputText }];
  };

  const parseNonFuriganaText = (text: string): FuriganaToken[] => {
    if (!text) return [];
    
    const tokens: FuriganaToken[] = [];
    let currentToken = '';
    
    for (const char of text) {
      if (isPunctuation(char)) {
        // Flush current token if exists
        if (currentToken) {
          if (containsKanji(currentToken)) {
            tokens.push({
              type: "kanji",
              surface: currentToken,
              reading: undefined // No reading available
            });
          } else {
            tokens.push({
              type: "text",
              surface: currentToken
            });
          }
          currentToken = '';
        }
        // Add punctuation as text
        tokens.push({
          type: "text",
          surface: char
        });
      } else {
        currentToken += char;
      }
    }
    
    // Flush remaining token
    if (currentToken) {
      if (containsKanji(currentToken)) {
        tokens.push({
          type: "kanji",
          surface: currentToken,
          reading: undefined
        });
      } else {
        tokens.push({
          type: "text",
          surface: currentToken
        });
      }
    }
    
    return tokens;
  };

  const containsKanji = (text: string): boolean => {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
  };

  const isPunctuation = (text: string): boolean => {
    return /^[。、！？「」『』（）(),.!?\s]$/.test(text);
  };

  // Initialize kuroshiro
  const initializeKuroshiro = useCallback(async () => {
    if (isInitialized) return;

    try {
      // For browser environment, kuroshiro has compatibility issues
      // We'll implement a fallback parser instead
      console.log('Initializing Japanese text parser...');
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize kuroshiro:', error);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Parse text with kuroshiro
  const parseText = useCallback(async (inputText: string): Promise<FuriganaToken[]> => {
    if (!inputText.trim()) return [];

    // Check cache first
    if (cache.has(inputText)) {
      return cache.get(inputText)!;
    }

    if (!isInitialized) {
      await initializeKuroshiro();
    }

    // Use enhanced fallback parsing that handles furigana notation
    const tokens = parseWithFallback(inputText);
    cache.set(inputText, tokens);
    return tokens;
  }, [cache, initializeKuroshiro, isInitialized]);

  // Parse text when it changes
  useEffect(() => {
    const processText = async () => {
      if (!text) {
        setTokens([]);
        return;
      }

      setIsLoading(true);
      try {
        const parsedTokens = await parseText(text);
        setTokens(parsedTokens);
      } finally {
        setIsLoading(false);
      }
    };

    processText();
  }, [text, parseText]);

  // Load furigana preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('furigana-visible');
    if (saved !== null) {
      setShowFurigana(saved === 'true');
    }
  }, []);

  const handleToggleFurigana = () => {
    const newState = !showFurigana;
    setShowFurigana(newState);
    localStorage.setItem('furigana-visible', newState.toString());
  };

  const handleWordClick = (e: React.MouseEvent, token: FuriganaToken) => {
    if (!enableWordLookup || token.type === 'text') return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({
      word: token.surface,
      reading: token.reading,
      x: rect.left,
      y: rect.bottom + window.scrollY
    });
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  return (
    <div className={`furigana-wrap ${className}`}>
      {showToggleButton && (
        <Button
          variant="ghost"
          size="sm"
          className="ruby-toggle mb-2"
          onClick={handleToggleFurigana}
        >
          {showFurigana ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="ml-1">{showFurigana ? 'Hide' : 'Show'} Furigana</span>
        </Button>
      )}

      <div className="jp-text leading-relaxed" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>
        {isLoading ? (
          <span className="text-gray-400">Parsing...</span>
        ) : (
          tokens.map((token, index) => {
            if (token.type === 'kanji' && token.reading) {
              return showFurigana ? (
                <ruby
                  key={index}
                  className={`jp-word inline-block mr-1 ${
                    enableWordLookup ? 'hover:bg-blue-100 cursor-pointer rounded px-1 transition-colors' : ''
                  }`}
                  onClick={(e) => handleWordClick(e, token)}
                  title={enableWordLookup ? 'Click for definition' : undefined}
                >
                  {token.surface}
                  <rt className="text-xs leading-none" style={{ fontSize: '0.6em' }}>
                    {token.reading}
                  </rt>
                </ruby>
              ) : (
                <span
                  key={index}
                  className={`jp-word ${
                    enableWordLookup ? 'hover:bg-blue-100 cursor-pointer rounded px-1 transition-colors' : ''
                  }`}
                  onClick={(e) => handleWordClick(e, token)}
                  title={enableWordLookup ? 'Click for definition' : undefined}
                >
                  {token.surface}
                </span>
              );
            }

            return (
              <span
                key={index}
                className={enableWordLookup && token.type !== 'text' ? 'jp-word hover:bg-blue-100 cursor-pointer rounded px-1 transition-colors' : ''}
                onClick={(e) => enableWordLookup && token.type !== 'text' ? handleWordClick(e, token) : undefined}
              >
                {token.surface}
              </span>
            );
          })
        )}
      </div>

      {selectedWord && (
        <WordDefinitionPopup
          word={selectedWord.word}
          reading={selectedWord.reading}
          x={selectedWord.x}
          y={selectedWord.y}
          onClose={handleClosePopup}
          onSave={onSaveToVocab}
        />
      )}
    </div>
  );
};

export default FuriganaText;