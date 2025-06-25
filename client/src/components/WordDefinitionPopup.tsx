import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, BookOpen } from 'lucide-react';

interface WordDefinitionPopupProps {
  word: string;
  reading?: string;
  position?: { x: number; y: number };
  onClose: () => void;
  onSaveToVocab?: (word: string, reading?: string) => void;
}

interface DefinitionData {
  word: string;
  reading?: string;
  meanings: string[];
  pos?: string[];
  jlpt_level?: number;
  error?: string;
}

export const WordDefinitionPopup: React.FC<WordDefinitionPopupProps> = ({
  word,
  reading,
  position,
  onClose,
  onSaveToVocab
}) => {
  const [definition, setDefinition] = useState<DefinitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
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

  const handleSaveToVocab = () => {
    if (onSaveToVocab && word) {
      onSaveToVocab(word, reading);
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    if (!position) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      };
    }

    return {
      position: 'fixed',
      top: Math.min(position.y + 10, window.innerHeight - 300),
      left: Math.min(position.x, window.innerWidth - 320),
      zIndex: 1000,
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

  const getJLPTLevelLabel = (level?: number): string => {
    if (!level) return 'Unknown';
    return `N${level}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-999"
        onClick={onClose}
      />
      
      {/* Popup */}
      <Card 
        className="shadow-lg border-2 bg-white dark:bg-gray-800"
        style={getPositionStyles()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-xl">{word}</span>
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
                    {getJLPTLevelLabel(definition.jlpt_level)}
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
              <div className="flex gap-2 pt-2">
                {onSaveToVocab && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveToVocab}
                    className="text-xs"
                  >
                    Save to Vocab
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onClose}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
};

export default WordDefinitionPopup;