
// UI component types
export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export interface LoadingState {
  loading: boolean;
  error?: string;
}

export interface FuriganaTextProps {
  text: string;
  showFurigana: boolean;
  showToggleButton?: boolean;
  enableWordLookup?: boolean;
  onSaveToVocab?: (word: string, reading?: string) => void;
  className?: string;
}

export interface WordDefinitionPopupProps {
  word: string;
  reading?: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export interface TypingIndicatorProps {
  personas: string[];
  isVisible: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Navigation types
export interface NavigationItem {
  href: string;
  label: string;
  icon?: React.ComponentType;
}
