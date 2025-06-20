import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VocabPopup } from './VocabPopup';
import { useVocabDictionary } from '@/hooks/useVocabDictionary';
// Vocabulary tracking temporarily disabled

interface MessageWithVocabProps {
  content: string;
  className?: string;
  children?: React.ReactNode;
}

interface PopupState {
  word: string;
  reading: string;
  meaning: string;
  position: { x: number; y: number };
}

// Check if text contains Japanese characters
function hasJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// Check if character is Japanese
function isJapanese(char: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(char);
}

// Enhanced word detection for Japanese text
function detectWordAtPosition(text: string, position: number): { word: string; start: number; end: number } | null {
  if (!text || position < 0 || position >= text.length) return null;
  
  const char = text[position];
  if (!isJapanese(char)) return null;

  let start = position;
  let end = position + 1;

  // Move backwards to find word boundary
  while (start > 0) {
    const prevChar = text[start - 1];
    if (!isJapanese(prevChar) || /[\u3001\u3002\u30FB\u300C\u300D\u300E\u300F]/.test(prevChar)) {
      break;
    }
    start--;
  }

  // Move forwards to find word boundary
  while (end < text.length) {
    const nextChar = text[end];
    if (!isJapanese(nextChar) || /[\u3001\u3002\u30FB\u300C\u300D\u300E\u300F]/.test(nextChar)) {
      break;
    }
    end++;
  }

  return {
    word: text.substring(start, end),
    start,
    end
  };
}

export function MessageWithVocab({ content, className, children }: MessageWithVocabProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const { findLongestMatch, isLoading } = useVocabDictionary();

  // Track vocabulary usage when message is rendered
  useEffect(() => {
    if (hasJapanese(content)) {
      // Track vocabulary usage with conjugation normalization
      // Vocabulary tracking temporarily disabled
    }
  }, [content]);

  // Handle click/tap on Japanese text
  const handleTextInteraction = useCallback((event: React.MouseEvent) => {
    if (isLoading || !hasJapanese(content)) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    let textContent = target.textContent || '';
    
    // If clicking on a child element, get the full message content
    if (!textContent || textContent.length < content.length / 2) {
      textContent = content;
    }

    // Get click position
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range || !range.startContainer.textContent) return;

    const clickedText = range.startContainer.textContent;
    const clickPosition = range.startOffset;
    
    // Find word at click position
    const wordInfo = detectWordAtPosition(clickedText, clickPosition);
    if (!wordInfo) return;

    // Try to find dictionary match starting from the detected word position
    let bestMatch = findLongestMatch(clickedText, wordInfo.start);
    
    // If no match found with longest match, try with the detected word
    if (!bestMatch && wordInfo.word.length >= 1) {
      const simpleEntry = findLongestMatch(wordInfo.word, 0);
      if (simpleEntry) {
        bestMatch = simpleEntry;
      }
    }

    if (bestMatch) {
      setPopup({
        word: bestMatch.word,
        reading: bestMatch.entry.reading,
        meaning: bestMatch.entry.meaning,
        position: {
          x: event.clientX,
          y: event.clientY
        }
      });
    }
  }, [content, findLongestMatch, isLoading]);

  const handleClosePopup = useCallback(() => {
    setPopup(null);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hasJapanese(content)) {
      setIsHovering(true);
    }
  }, [content]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Apply hover styling for Japanese content
  const interactiveClassName = hasJapanese(content) && !isLoading
    ? `${className || ''} ${isHovering ? 'bg-blue-50 dark:bg-blue-900/20' : ''} transition-colors duration-150 cursor-pointer select-text`
    : className;

  return (
    <>
      <div
        ref={messageRef}
        className={interactiveClassName}
        onClick={handleTextInteraction}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-vocab-enabled={hasJapanese(content)}
      >
        {children || content}
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