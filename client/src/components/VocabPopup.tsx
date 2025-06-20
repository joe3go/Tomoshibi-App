import React, { useState, useEffect, useRef } from 'react';
import { Volume2, BookOpen, X } from 'lucide-react';

interface VocabPopupProps {
  word: string;
  reading: string;
  meaning: string;
  position: { x: number; y: number };
  onClose: () => void;
  onSave?: (word: string, reading: string, meaning: string) => void;
}

export function VocabPopup({ word, reading, meaning, position, onClose, onSave }: VocabPopupProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Audio playback
  const playAudio = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const audioUrl = `https://assets.languagepod101.com/dictionary/japanese/audiomp3/${encodeURIComponent(word)}_jp_1.mp3`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      
      await audio.play();
    } catch (error) {
      setIsPlaying(false);
      console.log('Audio playback failed:', error);
    }
  };

  // Save to vocabulary vault
  const saveToVault = async () => {
    if (isSaving || saved) return;
    
    setIsSaving(true);
    
    try {
      // Save to localStorage
      const stored = localStorage.getItem('vocab-vault') || '[]';
      const vault = JSON.parse(stored);
      
      const existing = vault.find((item: any) => item.word === word);
      if (!existing) {
        vault.push({
          word,
          reading,
          meaning,
          source: 'chat-popup',
          addedAt: new Date().toISOString()
        });
        
        localStorage.setItem('vocab-vault', JSON.stringify(vault));
      }
      
      setSaved(true);
      if (onSave) {
        onSave(word, reading, meaning);
      }
      
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Position popup within viewport
  useEffect(() => {
    if (popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y;
      
      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      
      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        y = position.y - rect.height - 10;
      }
      
      popup.style.left = `${Math.max(10, x)}px`;
      popup.style.top = `${Math.max(10, y)}px`;
    }
  }, [position]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Word information */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {word}
          </span>
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className="text-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {reading}
        </div>
        
        <div className="text-sm text-gray-800 dark:text-gray-200">
          {meaning}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={saveToVault}
          disabled={isSaving || saved}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Storage indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span className="text-yellow-600 dark:text-yellow-400">• Saving locally</span>
      </div>
    </div>
  );
}