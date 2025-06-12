import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Plus, Volume2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface WordDefinition {
  word: string;
  reading: string;
  meaning: string;
  jlptLevel?: string;
  wordType?: string;
  source: 'local' | 'external';
}

interface WordDefinitionPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  isLocked?: boolean;
}

export default function WordDefinitionPopup({ 
  word, 
  position, 
  onClose, 
  isLocked = false 
}: WordDefinitionPopupProps) {
  const [isAdding, setIsAdding] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: definition, isLoading, error } = useQuery({
    queryKey: ['/api/word-definition', word],
    queryFn: async () => {
      const response = await fetch(`/api/word-definition/${encodeURIComponent(word)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Definition not found');
      }
      return response.json() as Promise<WordDefinition>;
    },
    enabled: !!word,
  });

  const addToVocabMutation = useMutation({
    mutationFn: async (wordId: number) => {
      return apiRequest('POST', '/api/vocab-tracker/increment', { wordId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocab-tracker'] });
      setIsAdding(false);
    },
    onError: () => {
      setIsAdding(false);
    },
  });

  const { data: allVocab = [] } = useQuery({
    queryKey: ['/api/vocab'],
  });

  // Handle clicking outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && !isLocked) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isLocked]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAddToVocab = () => {
    if (!definition) return;
    
    // Find the word in our vocabulary database
    const vocabWord = (allVocab as any[]).find((v: any) => 
      v.kanji === definition.word || 
      v.hiragana === definition.word ||
      v.hiragana === definition.reading
    );

    if (vocabWord) {
      setIsAdding(true);
      addToVocabMutation.mutate(vocabWord.id);
    }
  };

  // Calculate popup position to keep it on screen
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: position.y > window.innerHeight / 2 ? position.y - 200 : position.y + 30,
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-80"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <Card className="shadow-lg border-2 bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Word Definition
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Looking up definition...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Definition not found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try searching for "{word}" in a dictionary
              </p>
            </div>
          )}

          {definition && (
            <div className="space-y-3">
              {/* Word Display */}
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  {definition.word}
                </div>
                {definition.reading && definition.reading !== definition.word && (
                  <div className="text-lg text-muted-foreground">
                    {definition.reading}
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {definition.jlptLevel && (
                  <Badge variant="outline">
                    {definition.jlptLevel}
                  </Badge>
                )}
                {definition.wordType && (
                  <Badge variant="secondary">
                    {definition.wordType}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {definition.source === 'local' ? 'Database' : 'External'}
                </Badge>
              </div>

              {/* Meaning */}
              <div className="border-t pt-3">
                <h4 className="font-semibold text-sm mb-2">Meaning</h4>
                <p className="text-sm leading-relaxed">{definition.meaning}</p>
              </div>

              {/* Actions */}
              <div className="border-t pt-3 flex items-center gap-2">
                {definition.source === 'local' && (
                  <Button
                    size="sm"
                    onClick={handleAddToVocab}
                    disabled={isAdding}
                    className="flex-1"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to My Vocabulary
                      </>
                    )}
                  </Button>
                )}
                
                {isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}