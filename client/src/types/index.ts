// Base component props interface
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Route component props that extend BaseComponentProps
export interface RouteComponentProps extends BaseComponentProps {
  params?: Record<string, string | undefined>;
}

// Form field option type
export interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// Loading state type
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Error state type
export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

// Async operation result
export interface AsyncResult<T = any> {
  data?: T;
  error?: string;
  isLoading: boolean;
}

// JLPT types
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Event handler types
export type ChangeHandler<T = string> = (value: T) => void;

// Chat related types
export interface ChatConversation {
  id: number;
  scenarioId: number;
  personaId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  content: string;
  isFromUser: boolean;
  furiganaData?: any;
  createdAt: Date;
}

export interface TeachingPersona {
  id: number;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  teachingStyle: string;
  jlptLevel: JlptLevel;
}

export interface LearningScenario {
  id: number;
  title: string;
  description: string;
  jlptLevel: JlptLevel;
  category: string;
  objectives: string[];
}

// Vocabulary types
export interface VocabularyTrackingEntry {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  jlptLevel: JlptLevel;
  encountered: boolean;
  mastered: boolean;
  encounterCount: number;
}

export interface VocabularyStatistics {
  totalWords: number;
  masteredWords: number;
  encounteredWords: number;
  byLevel: Record<JlptLevel, {
    total: number;
    mastered: number;
    encountered: number;
  }>;
}

// User progress types
export interface UserLearningProgress {
  id: number;
  userId: number;
  jlptLevel: JlptLevel;
  vocabularyWordsEncountered: number[];
  vocabularyWordsMastered: number[];
  grammarPatternsEncountered: number[];
  grammarPatternsMastered: number[];
  totalConversationSessions: number;
  totalMessagesSentCount: number;
}