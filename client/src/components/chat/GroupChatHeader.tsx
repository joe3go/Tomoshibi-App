import React from 'react';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Persona } from '@/types/personas';

interface GroupChatHeaderProps {
  onBack: () => void;
  title: string;
  subtitle: string;
  personas?: Persona[];
  showFurigana?: boolean;
  onToggleFurigana?: () => void;
  romajiMode?: boolean;
  onToggleRomaji?: () => void;
}

export function GroupChatHeader({
  onBack,
  title,
  subtitle,
  personas = [],
  showFurigana,
  onToggleFurigana,
  romajiMode,
  onToggleRomaji,
}: GroupChatHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              {personas.slice(0, 3).map((persona, index) => (
                <Avatar key={persona.id} className="w-8 h-8 border-2 border-white">
                  <AvatarImage src={persona.avatar_url} alt={persona.name} />
                  <AvatarFallback>{persona.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
              {personas.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{personas.length - 3}
                </div>
              )}
            </div>

            <div>
              <h1 className="font-semibold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Participant List */}
      {personas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1"
            >
              <Avatar className="w-4 h-4">
                <AvatarImage src={persona.avatar_url} alt={persona.name} />
                <AvatarFallback className="text-xs">{persona.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{persona.name}</span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}