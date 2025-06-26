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

  // Initialize kuroshiro
  const initializeKuroshiro = useCallback(async () => {
    if (isInitialized) return;

    try {
      // Dynamic imports to avoid SSR issues
      const [{ default: Kuroshiro }, { default: KuromojiAnalyzer }] = await Promise.all([
        import('kuroshiro'),
        import('kuroshiro-analyzer-kuromoji')
      ]);

      kuroshiro = new Kuroshiro();
      await kuroshiro.init(new KuromojiAnalyzer());
      setIsInitialized(true);
      console.log('Kuroshiro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize kuroshiro:', error);
      // Continue with fallback parsing
    }
  }, [isInitialized]);

  // Parse text with kuroshiro
  const parseText = useCallback(async (inputText: string): Promise<FuriganaToken[]> => {
    if (!inputText.trim()) return [];

    // Check cache first
    if (cache.has(inputText)) {
      return cache.get(inputText)!;
    }

    if (!isInitialized || !kuroshiro) {
      await initializeKuroshiro();
    }

    if (!kuroshiro) {
      // Fallback parsing without kuroshiro
      return [{ type: 'text', surface: inputText }];
    }

    try {
      // Get tokenized result from kuroshiro in furigana mode
      const result = await kuroshiro.convert(inputText, {
        mode: 'furigana',
        to: 'hiragana'
      });

      // Parse the HTML result which contains ruby tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${result}</div>`, 'text/html');
      const tokens: FuriganaToken[] = [];

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            // Check if this text contains kanji
            const hasKanji = /[\u4e00-\u9faf]/.test(text);
            tokens.push({ 
              type: hasKanji ? 'kanji' : 'text', 
              surface: text 
            });
          }
        } else if (node.nodeName === 'RUBY') {
          const rubyElement = node as Element;
          const kanji = rubyElement.textContent?.replace(/[\(\)（）]/g, '') || '';
          const rtElement = rubyElement.querySelector('rt');
          const reading = rtElement?.textContent || '';
          
          if (kanji) {
            tokens.push({
              type: 'kanji',
              surface: kanji,
              reading: reading || undefined
            });
          }
        } else {
          // Process child nodes recursively
          node.childNodes.forEach(processNode);
        }
      };

      const container = doc.querySelector('div');
      if (container) {
        container.childNodes.forEach(processNode);
      }

      // If no tokens were extracted, fallback to simple parsing
      if (tokens.length === 0) {
        tokens.push({ type: 'text', surface: inputText });
      }

      // Cache the result
      cache.set(inputText, tokens);
      return tokens;
    } catch (error) {
      console.error('Error parsing with kuroshiro:', error);
      // Fallback to simple text token
      const fallbackTokens = [{ type: 'text' as const, surface: inputText }];
      cache.set(inputText, fallbackTokens);
      return fallbackTokens;
    }
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