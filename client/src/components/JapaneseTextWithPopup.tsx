import React, { useState, useRef, useCallback } from 'react';
import { VocabPopup } from './VocabPopup';
import { useVocabDictionary } from '@/hooks/useVocabDictionary';

interface JapaneseTextWithPopupProps {
  children: React.ReactNode;
  className?: string;
}

interface PopupState {
  word: string;
  reading: string;
  meaning: string;
  position: { x: number; y: number };
}

// Utility to check if text contains Japanese characters
function hasJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// Utility to check if character is Japanese
function isJapanese(char: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(char);
}

// Get word boundary for Japanese text
function getWordAtPosition(text: string, position: number): { word: string; start: number; end: number } | null {
  if (!text || position < 0 || position >= text.length) return null;
  
  const char = text[position];
  if (!isJapanese(char)) return null;

  let start = position;
  let end = position + 1;

  // Extend backwards to find word start
  while (start > 0 && isJapanese(text[start - 1])) {
    start--;
  }

  // Extend forwards to find word end
  while (end < text.length && isJapanese(text[end])) {
    end++;
  }

  return {
    word: text.substring(start, end),
    start,
    end
  };
}

export function JapaneseTextWithPopup({ children, className }: JapaneseTextWithPopupProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { findLongestMatch, isLoading } = useVocabDictionary();

  const handleTextClick = useCallback((event: React.MouseEvent) => {
    if (isLoading) return;

    const target = event.target as HTMLElement;
    const textContent = target.textContent || '';
    
    if (!hasJapanese(textContent)) return;

    // Get click position relative to the text
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range) return;

    const clickPosition = range.startOffset;
    const wordInfo = getWordAtPosition(textContent, clickPosition);
    
    if (!wordInfo) return;

    // Try to find the longest matching dictionary entry
    const match = findLongestMatch(textContent, wordInfo.start);
    
    if (match) {
      setPopup({
        word: match.word,
        reading: match.entry.reading,
        meaning: match.entry.meaning,
        position: {
          x: event.clientX,
          y: event.clientY
        }
      });
    }
  }, [findLongestMatch, isLoading]);

  const handleClosePopup = useCallback(() => {
    setPopup(null);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onClick={handleTextClick}
        style={{ cursor: hasJapanese(containerRef.current?.textContent || '') ? 'pointer' : 'default' }}
      >
        {children}
      </div>
      
      {popup && (
        <VocabPopup
          word={popup.word}
          reading={popup.reading}
          meaning={popup.meaning}
          position={popup.position}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}