import { useState, useEffect } from 'react';
import { TypingIndicator as TypingIndicatorType } from '@/../../shared/group-conversation-types';

interface TypingIndicatorProps {
  typingUsers: TypingIndicatorType[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].persona_name} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].persona_name} and ${typingUsers[1].persona_name} are typing${dots}`;
    } else {
      return `Multiple people are typing${dots}`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}