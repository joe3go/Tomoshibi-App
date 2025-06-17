import React, { useState, useEffect, useRef } from 'react';
import { Volume2, BookOpen, X } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase/client';

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
  const { user } = useSupabaseAuth();

  // Audio playback
  const playAudio = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const audioUrl = `https://assets.languagepod101.com/dictionary/japanese/audiomp3/${encodeURIComponent(word)}_jp_1.mp3`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        console.log('Audio not available for:', word);
      };
      
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
      if (user) {
        // Save to Supabase
        const { error } = await supabase
          .from('user_vocab')
          .upsert({
            word: word,
            reading: reading,
            meaning: meaning,
            source: 'chat-popup'
          }, {
            onConflict: 'word'
          });

        if (error) throw error;
      } else {
        // Fallback to localStorage
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
      }
      
      setSaved(true);
      onSave?.(word, reading, meaning);
      
      // Auto-close after successful save
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Position popup to avoid overflow
  const getPopupStyle = () => {
    const popup = popupRef.current;
    if (!popup) return { left: position.x, top: position.y };

    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = position.x;
    let top = position.y - rect.height - 8; // Above the word

    // Adjust horizontal position if popup would overflow
    if (left + rect.width > viewportWidth - 16) {
      left = viewportWidth - rect.width - 16;
    }
    if (left < 16) left = 16;

    // Adjust vertical position if popup would overflow
    if (top < 16) {
      top = position.y + 24; // Below the word
    }
    if (top + rect.height > viewportHeight - 16) {
      top = viewportHeight - rect.height - 16;
    }

    return { left, top };
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs"
      style={getPopupStyle()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {word}
          </div>
          {reading && reading !== word && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {reading}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2"
        >
          <X size={16} />
        </button>
      </div>

      {/* Meaning */}
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {meaning}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Audio button */}
        <button
          onClick={playAudio}
          disabled={isPlaying}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
        >
          <Volume2 size={12} />
          {isPlaying ? 'Playing...' : 'Audio'}
        </button>

        {/* Save button */}
        <button
          onClick={saveToVault}
          disabled={isSaving || saved}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
            saved
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
          } disabled:opacity-50`}
        >
          <BookOpen size={12} />
          {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Storage indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {user ? (
          <span className="text-green-600 dark:text-green-400">• Syncing to cloud</span>
        ) : (
          <span className="text-yellow-600 dark:text-yellow-400">• Saving locally</span>
        )}
      </div>
    </div>
  );
}