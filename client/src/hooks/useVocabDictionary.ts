import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface DictionaryEntry {
  word: string;
  reading: string;
  meaning: string;
  type?: string;
}

class VocabDictionary {
  private cache = new Map<string, DictionaryEntry>();
  private supabaseData = new Map<string, DictionaryEntry>();
  private isLoaded = false;

  async loadSupabaseVocabulary() {
    if (this.isLoaded) return;

    console.log('🔍 Loading vocabulary dictionary from Supabase...');
    try {
      const { data: vocab, error } = await supabase
        .from('vocab_library')
        .select('hiragana, english_meaning, kanji, word_type, jlpt_level');

      if (error) {
        console.error('❌ Supabase vocabulary loading error:', error);
        throw error;
      }

      if (vocab) {
        console.log('📚 Processing', vocab.length, 'vocabulary entries from Supabase...');

        // Track counts by level for verification
        const levelCounts: Record<string, number> = {};

        vocab.forEach(item => {
          const word = item.kanji || item.hiragana;
          const entry: DictionaryEntry = {
            word: word,
            reading: item.hiragana,
            meaning: item.english_meaning,
            type: item.word_type
          };

          // Index by both kanji and hiragana for flexible lookup
          this.supabaseData.set(word, entry);
          if (item.kanji && item.kanji !== item.hiragana) {
            this.supabaseData.set(item.hiragana, entry);
          }

          // Track level counts
          levelCounts[item.jlpt_level] = (levelCounts[item.jlpt_level] || 0) + 1;
        });

        console.log('📊 Vocabulary loaded by JLPT level:', levelCounts);
      }

      this.isLoaded = true;
      console.log(`✅ Successfully loaded ${this.supabaseData.size} vocabulary entries from Supabase`);
    } catch (error) {
      console.error('❌ Failed to load vocabulary from Supabase:', error);
    }
  }

  lookupWord(word: string): DictionaryEntry | null {
    // Check cache first
    if (this.cache.has(word)) {
      return this.cache.get(word)!;
    }

    // Check Supabase data
    const entry = this.supabaseData.get(word);
    if (entry) {
      this.cache.set(word, entry);
      return entry;
    }

    return null;
  }

  // Find the longest matching word from a given position in text
  findLongestMatch(text: string, startIndex: number): { word: string; entry: DictionaryEntry } | null {
    let longestMatch: { word: string; entry: DictionaryEntry } | null = null;

    // Try increasingly longer substrings
    for (let length = 1; length <= Math.min(8, text.length - startIndex); length++) {
      const candidate = text.substring(startIndex, startIndex + length);
      const entry = this.lookupWord(candidate);

      if (entry) {
        longestMatch = { word: candidate, entry };
      }
    }

    return longestMatch;
  }
}

const dictionary = new VocabDictionary();

export function useVocabDictionary() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDictionary = async () => {
      await dictionary.loadSupabaseVocabulary();
      setIsLoading(false);
    };

    loadDictionary();
  }, []);

  const lookupWord = useCallback((word: string) => {
    return dictionary.lookupWord(word);
  }, []);

  const findLongestMatch = useCallback((text: string, startIndex: number) => {
    return dictionary.findLongestMatch(text, startIndex);
  }, []);

  return {
    isLoading,
    lookupWord,
    findLongestMatch
  };
}