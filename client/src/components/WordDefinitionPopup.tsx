import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface WordDefinition {
  word: string;
  reading?: string;
  meanings: string[];
  pos?: string[];
  jlpt_level?: number;
}

interface WordDefinitionPopupProps {
  word: string;
  reading?: string;
  x: number;
  y: number;
  onClose: () => void;
  onSave?: (word: string, reading?: string) => void;
}

export default function WordDefinitionPopup({
  word,
  reading,
  x,
  y,
  onClose,
  onSave
}: WordDefinitionPopupProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/word-definition/${encodeURIComponent(word)}`);
        
        if (response.ok) {
          const data = await response.json();
          setDefinition(data);
        }
      } catch (error) {
        console.error('Error fetching definition:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (word) {
      fetchDefinition();
    }
  }, [word]);

  const saveToVocab = async () => {
    if (!user?.id || !definition) return;
    
    setIsSaving(true);
    try {
      // Save via API endpoint
      await fetch('/api/vocab-tracker/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word: definition.word,
          source: 'lookup'
        })
      });
      
      if (onSave) {
        onSave(definition.word, definition.reading || word);
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save word:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate safe position to avoid going off-screen
  const safeX = Math.min(x, window.innerWidth - 320);
  const safeY = Math.min(y, window.innerHeight - 200);

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <Card
        className="absolute bg-white border shadow-lg w-80"
        style={{
          left: safeX,
          top: safeY,
          zIndex: 1000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Word Definition
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading definition...</span>
            </div>
          ) : definition ? (
            <div className="space-y-3">
              <div>
                <div className="font-bold text-xl">{definition.word}</div>
                {definition.reading && (
                  <div className="text-sm text-gray-600">{definition.reading}</div>
                )}
              </div>
              
              <div>
                <div className="font-semibold mb-1">Meanings:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {definition.meanings.map((meaning, index) => (
                    <li key={index}>{meaning}</li>
                  ))}
                </ul>
              </div>

              {definition.pos && definition.pos.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Part of Speech:</div>
                  <div className="flex flex-wrap gap-1">
                    {definition.pos.map((pos, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {definition.jlpt_level && (
                <div>
                  <Badge variant="outline">
                    JLPT N{definition.jlpt_level}
                  </Badge>
                </div>
              )}

              {user?.id && (
                <Button
                  onClick={saveToVocab}
                  disabled={isSaving}
                  className="w-full"
                  size="sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save to Vocabulary'
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No definition found for "{word}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}