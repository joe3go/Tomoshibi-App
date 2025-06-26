import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Plus } from 'lucide-react';
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";

interface WordDefinitionPopupProps {
  word: string;
  reading?: string;
  x: number;
  y: number;
  onClose: () => void;
  onSave?: (word: string, reading?: string) => void;
}

interface DefinitionData {
  word: string;
  reading?: string;
  meanings: string[];
  pos?: string[];
  jlpt_level?: number;
  error?: string;
}

export default function WordDefinitionPopup({
  word,
  reading,
  x,
  y,
  onClose,
  onSave
}: WordDefinitionPopupProps) {
  const [definition, setDefinition] = useState<DefinitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const fetchDefinition = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use existing word definition API
        const response = await fetch(`/api/word-definition/${encodeURIComponent(word)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch definition: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setDefinition(null);
        } else {
          setDefinition(data);
        }
      } catch (err) {
        console.error('Error looking up word:', err);
        setError('Failed to look up word');
        setDefinition(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (word) {
      fetchDefinition();
    }
  }, [word]);

  const handleSaveToVocab = async () => {
    if (!session?.user?.id || !definition) return;
    
    setIsSaving(true);
    try {
      // First, check if word exists in vocab_library
      let vocabLibraryId: string | null = null;
      
      const { data: existingVocab, error: searchError } = await supabase
        .from('vocab_library')
        .select('id')
        .or(`kanji.eq.${definition.word},hiragana.eq.${definition.word}`)
        .limit(1);

      if (searchError) {
        console.error('Error searching vocab library:', searchError);
        return;
      }

      if (existingVocab && existingVocab.length > 0) {
        vocabLibraryId = existingVocab[0].id;
      } else {
        // Create new entry in vocab_library if it doesn't exist
        const { data: newVocab, error: insertLibraryError } = await supabase
          .from('vocab_library')
          .insert({
            kanji: definition.word.match(/[\u4e00-\u9faf]/) ? definition.word : null,
            hiragana: definition.reading || reading || definition.word,
            english_meaning: definition.meanings.join('; '),
            jlpt_level: definition.jlpt_level || 5,
            word_type: definition.pos?.[0] || 'unknown'
          })
          .select('id')
          .single();

        if (insertLibraryError) {
          console.error('Error creating vocab library entry:', insertLibraryError);
          return;
        }

        vocabLibraryId = newVocab.id;
      }

      // Save to user's personal vocabulary in user_vocab
      const { error: userVocabError } = await supabase
        .from('user_vocab')
        .insert({
          id: crypto.randomUUID(),
          user_id: session.user.id,
          word: definition.word,
          reading: definition.reading || reading || definition.word,
          meaning: definition.meanings.join('; '),
          source: 'chat_lookup',
          base_form: definition.word
        });

      if (userVocabError && !userVocabError.message.includes('duplicate')) {
        console.error('Error saving to user vocab:', userVocabError);
      }

      // Track in vocab_tracker for analytics
      if (vocabLibraryId) {
        const { error: trackerError } = await supabase
          .from('vocab_tracker')
          .upsert({
            user_id: session.user.id,
            word_id: vocabLibraryId,
            frequency: 1,
            user_usage_count: 1,
            last_seen_at: new Date().toISOString(),
            source: 'lookup',
            memory_strength: 0.1,
            next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }, {
            onConflict: 'user_id,word_id',
            ignoreDuplicates: false
          });

        if (trackerError) {
          console.error('Error updating vocab tracker:', trackerError);
        }
      }

      // Call parent callback if provided
      if (onSave) {
        onSave(definition.word, definition.reading || reading);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    return {
      position: 'absolute',
      top: Math.min(y + 8, window.innerHeight - 300),
      left: Math.min(x, window.innerWidth - 320),
      zIndex: 50,
      maxWidth: '300px'
    };
  };

  const getJLPTLevelColor = (level?: number): string => {
    switch (level) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-green-600';
      case 5: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="jt-popup"
        style={getPositionStyles()}
      >
        <Card className="jt-popup-box shadow-lg border-2 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="jt-popup-word font-bold text-xl">{word}</span>
                {reading && reading !== word && (
                  <span className="text-base text-gray-600 dark:text-gray-300">
                    ({reading})
                  </span>
                )}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                  Looking up...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try the word in its dictionary form
                </p>
              </div>
            ) : definition ? (
              <div className="space-y-3">
                {/* Part of Speech and JLPT Level */}
                <div className="flex items-center gap-2 flex-wrap">
                  {definition.pos?.map((pos, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {pos}
                    </Badge>
                  ))}
                  {definition.jlpt_level && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getJLPTLevelColor(definition.jlpt_level)}`}
                    >
                      N{definition.jlpt_level}
                    </Badge>
                  )}
                </div>

                {/* Meanings */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Meanings:
                  </h4>
                  <ul className="space-y-1">
                    {definition.meanings.map((meaning, index) => (
                      <li key={index} className="text-sm text-gray-800 dark:text-gray-200">
                        • {meaning}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="jt-popup-actions flex gap-2 pt-2">
                  {session && (
                    <Button 
                      size="sm" 
                      onClick={handleSaveToVocab}
                      disabled={isSaving}
                      className="jt-btn jt-btn-save text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {isSaving ? 'Saving...' : 'Save to Vocab'}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onClose}
                    className="jt-btn text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}