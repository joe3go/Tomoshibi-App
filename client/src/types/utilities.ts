import type { ScenarioTranslation, ProgressionLevel, ProgressMetrics } from './dashboard';
import type { VocabTracker, Conversation } from '@shared/schema';

/**
 * Utility function type definitions for dashboard operations
 */

/**
 * Function to get Japanese translation for scenario titles
 */
export type GetScenarioJapaneseFunction = (title: string) => string;

/**
 * Function to calculate progression label based on metrics
 */
export type GetProgressionLabelFunction = (
  vocabData: readonly VocabTracker[],
  completedConversations: readonly Conversation[]
) => string;

/**
 * Function to filter conversations by status
 */
export type FilterConversationsByStatusFunction = <T extends Conversation>(
  conversations: readonly T[],
  status: 'active' | 'completed' | 'paused'
) => readonly T[];

/**
 * Function to calculate progress metrics
 */
export type CalculateProgressMetricsFunction = (
  vocabData: readonly VocabTracker[],
  completedConversations: readonly Conversation[]
) => ProgressMetrics;

/**
 * Function to validate form data
 */
export type ValidateSettingsFormFunction = (data: {
  displayName: string;
  newPassword: string;
}) => {
  isValid: boolean;
  errors: Record<string, string>;
};

/**
 * Function to handle file upload
 */
export type HandleFileUploadFunction = (
  file: File,
  endpoint: string,
  onSuccess: (url: string) => void,
  onError: (error: string) => void
) => Promise<void>;

/**
 * Function to format date for display
 */
export type FormatDateFunction = (date: Date | string) => string;

/**
 * Function to sanitize user input
 */
export type SanitizeInputFunction = (input: string) => string;

/**
 * Constants for progression levels
 */
export const PROGRESSION_LEVELS: readonly ProgressionLevel[] = [
  { threshold: 100, label: 'Sakura Scholar', emoji: '🌸' },
  { threshold: 75, label: 'Island Explorer', emoji: '🗾' },
  { threshold: 50, label: 'Lantern Bearer', emoji: '🏮' },
  { threshold: 25, label: 'Bamboo Sprout', emoji: '🌱' },
  { threshold: 10, label: 'Study Starter', emoji: '📚' },
  { threshold: 0, label: 'Rising Sun', emoji: '🌟' }
] as const;

/**
 * Constants for scenario translations
 */
export const SCENARIO_TRANSLATIONS: ScenarioTranslation = {
  'Self-Introduction': '自己紹介',
  'Shopping': '買い物',
  'Restaurant': 'レストラン',
  'Directions': '道案内',
  'Weather': '天気',
  'Family': '家族',
  'Hobbies': '趣味',
  'Work': '仕事',
  'Travel': '旅行',
  'Health': '健康'
} as const;

/**
 * Type guards for runtime type checking
 */
export const isValidConversationStatus = (
  status: string
): status is 'active' | 'completed' | 'paused' => {
  return ['active', 'completed', 'paused'].includes(status);
};

export const isValidJLPTLevel = (
  level: string
): level is 'N5' | 'N4' | 'N3' | 'N2' | 'N1' => {
  return ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level);
};

/**
 * Error types for better error handling
 */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface APIError {
  readonly status: number;
  readonly message: string;
  readonly timestamp: Date;
}

/**
 * Success response types
 */
export interface SuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}

export interface ErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly details?: ValidationError[];
}

/**
 * Generic API response type
 */
export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;