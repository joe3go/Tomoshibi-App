// Core component props interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Chat component types
export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  vocabUsed: number[];
  grammarUsed: number[];
}

export interface ChatConversation {
  id: number;
  userId: number;
  personaId: number;
  scenarioId: number;
  status: 'active' | 'completed';
  startedAt: string;
  completedAt?: string;
  messages: ChatMessage[];
}

export interface TeachingPersona {
  id: number;
  name: string;
  type: 'teacher' | 'friend';
  jlptLevel: string;
  description: string;
  systemPrompt: string;
  personalityTraits: Record<string, unknown>;
  avatarUrl?: string;
}

export interface LearningScenario {
  id: number;
  title: string;
  description: string;
  jlptLevel: string;
  difficulty: number;
  category: string;
  objectives: string[];
  vocabularyFocus: string[];
  grammarFocus: string[];
}

// Vocabulary tracking types
export interface VocabularyWord {
  id: number;
  kanji?: string | null;
  hiragana: string;
  romaji?: string;
  englishMeaning: string;
  jlptLevel: string;
  wordType?: string | null;
}

export interface VocabularyTrackingEntry {
  id: number;
  userId: number;
  wordId: number;
  frequency: number;
  userUsageCount: number;
  aiEncounterCount: number;
  lastSeenAt?: string | null;
  memoryStrength: number;
  nextReviewAt?: string | null;
  source: string;
  word: VocabularyWord;
}

export interface VocabularyStatistics {
  totalWords: number;
  wordsByLevel: Record<string, number>;
  masteredWords: number;
  reviewDueWords: number;
}

// User progress types
export interface UserLearningProgress {
  id: number;
  userId: number;
  jlptLevel: string;
  totalConversations: number;
  vocabEncountered: number[];
  vocabMastered: number[];
  grammarEncountered: number[];
  grammarMastered: number[];
  lastActivity?: string;
}

// Async operation result type
export interface AsyncResult<TData, TError = string> {
  loading: boolean;
  data: TData | null;
  error: TError | null;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JLPT level constants
export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export type JlptLevel = typeof JLPT_LEVELS[number];

export const JLPT_TARGETS: Record<JlptLevel, number> = {
  N5: 800,
  N4: 1500,
  N3: 3750,
  N2: 6000,
  N1: 10000
};

// Theme and UI types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
}

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void;
export type ClickHandler = () => void;
export type SubmitHandler = (event: React.FormEvent) => void;