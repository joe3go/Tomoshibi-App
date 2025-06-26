import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, BookOpen, Plus } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase/client';

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

const WordDefinitionPopup: React.FC<WordDefinitionPopupProps> = ({
  word,
  reading,
  x,
  y,
  onClose,
  onSave,
}) => {
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
        // Use existing Jisho API integration
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
      // Save to user's personal vocabulary in Supabase
      const { error: insertError } = await supabase.from('user_vocab').insert({
        user_id: session.user.id,
        word: definition.word,
        reading: definition.reading || reading,
        meaning: definition.meanings.join('; '),
        jlpt_level: definition.jlpt_level,
        pos: definition.pos?.join(', '),
        source: 'furigana_lookup',
      });

      if (insertError) {
        console.error('Error saving to vocab:', insertError);
        return;
      }

      // Track vocabulary usage via existing API
      await fetch('/api/vocab-tracker/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          word: definition.word,
          source: 'lookup',
        }),
      });

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
    const maxWidth = 320;
    const maxHeight = 300;
    const margin = 10;

    return {
      position: 'fixed',
      top: Math.min(y + margin, window.innerHeight - maxHeight - margin),
      left: Math.min(x, window.innerWidth - maxWidth - margin),
      zIndex: 1000,
      maxWidth: `${maxWidth}px`,
    };
  };

  const getJLPTLevelColor = (level?: number): string => {
    switch (level) {
      case 1:
        return 'text-red-600 bg-red-50';
      case 2:
        return 'text-orange-600 bg-orange-50';
      case 3:
        return 'text-yellow-600 bg-yellow-50';
      case 4:
        return 'text-green-600 bg-green-50';
      case 5:
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-transparent z-50" onClick={onClose} />

      {/* Popup */}
      <div className="popup fixed z-[1001]" style={getPositionStyles()}>
        <Card className="popup-box shadow-xl border-2 bg-white dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="popup-word font-bold text-xl" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {word}
                </span>
                {reading && reading !== word && (
                  <span className="text-base text-gray-600 dark:text-gray-300">({reading})</span>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Looking up...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                <p className="text-xs text-gray-500 mt-1">Try the word in its dictionary form</p>
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
                    <Badge variant="outline" className={`text-xs border ${getJLPTLevelColor(definition.jlpt_level)}`}>
                      N{definition.jlpt_level}
                    </Badge>
                  )}
                </div>

                {/* Meanings */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">Meanings:</h4>
                  <ul className="space-y-1">
                    {definition.meanings.map((meaning, index) => (
                      <li key={index} className="text-sm text-gray-800 dark:text-gray-200">
                        • {meaning}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="popup-actions flex gap-2 pt-2">
                  {session && (
                    <Button
                      size="sm"
                      onClick={handleSaveToVocab}
                      disabled={isSaving}
                      className="popup-save text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {isSaving ? 'Saving...' : 'Save to Vocab'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
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
};

export default WordDefinitionPopup;