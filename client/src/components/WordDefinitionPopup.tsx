import React, { useState, useEffect } from "react";
import { X, BookOpen, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  examples?: string[];
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
        // Use new Python parser backend
        const response = await fetch(`/definition?word=${encodeURIComponent(word)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Definition not found");
          } else {
            throw new Error(`Failed to fetch definition: ${response.status}`);
          }
          setDefinition(null);
          return;
        }

        const data = await response.json();
        setDefinition(data);
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
      const { error: insertError } = await supabase
        .from('user_vocab')
        .insert({
          user_id: session.user.id,
          word: definition.word,
          reading: definition.reading || reading,
          meaning: definition.meanings.join('; '),
          jlpt_level: definition.jlpt_level,
          pos: definition.pos?.join(', '),
          source: 'chat_lookup'
        });

      if (insertError) {
        console.error('Error saving to vocab:', insertError);
        return;
      }

      // Track vocabulary usage
      await fetch('/api/vocab-tracker/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          word: definition.word,
          source: 'lookup'
        })
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
    return {
      position: 'absolute',
      top: Math.min(y + 8, window.innerHeight - 350),
      left: Math.min(x, window.innerWidth - 320),
      zIndex: 50,
      maxWidth: '300px'
    };
  };

  const getJLPTLevelColor = (level?: number): string => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-green-100 text-green-800';
      case 5: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
        className="popup-def popup-shadow"
        style={getPositionStyles()}
      >
        <div className="bg-white rounded-lg border shadow-lg p-4 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-lg" style={{ fontFamily: '"Noto Sans JP", "Inter", sans-serif' }}>
                {word}
              </span>
              {reading && reading !== word && (
                <span className="text-sm text-gray-600">({reading})</span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Looking up...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-xs text-gray-500 mt-1">
                Try the word in its dictionary form
              </p>
            </div>
          ) : definition ? (
            <div className="space-y-3">
              {/* Tags */}
              <div className="flex items-center gap-1 flex-wrap">
                {definition.pos?.slice(0, 2).map((pos, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                    {pos}
                  </Badge>
                ))}
                {definition.jlpt_level && (
                  <Badge 
                    className={`text-xs px-2 py-0.5 ${getJLPTLevelColor(definition.jlpt_level)}`}
                  >
                    JLPT N{definition.jlpt_level}
                  </Badge>
                )}
              </div>

              {/* Meanings */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Meanings:</h4>
                <ul className="space-y-1 text-sm">
                  {definition.meanings.slice(0, 4).map((meaning, index) => (
                    <li key={index} className="text-gray-800 leading-relaxed">
                      • {meaning}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              {definition.examples && definition.examples.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Examples:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {definition.examples.slice(0, 2).map((example, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded">
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {session && (
                  <Button 
                    size="sm" 
                    onClick={handleSaveToVocab}
                    disabled={isSaving}
                    className="btn-save flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
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
        </div>
      </div>
    </>
  );
}