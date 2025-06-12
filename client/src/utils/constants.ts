import type { JlptLevel } from '@/types';

// JLPT Level Constants
export const JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const JLPT_TARGETS: Record<JlptLevel, number> = {
  N5: 800,
  N4: 1500,
  N3: 3750,
  N2: 6000,
  N1: 10000
} as const;

export const JLPT_LEVEL_COLORS: Record<JlptLevel, string> = {
  N5: 'bg-green-100 text-green-800',
  N4: 'bg-blue-100 text-blue-800',
  N3: 'bg-yellow-100 text-yellow-800',
  N2: 'bg-orange-100 text-orange-800',
  N1: 'bg-red-100 text-red-800'
} as const;

// Application Constants
export const APP_NAME = 'Tomoshibi' as const;
export const APP_DESCRIPTION = 'AI-powered Japanese language learning platform' as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  FURIGANA_VISIBLE: 'furigana-visible',
  THEME_MODE: 'theme-mode',
  USER_PREFERENCES: 'user-preferences'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    ME: '/api/auth/me',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout'
  },
  CONVERSATIONS: '/api/conversations',
  PERSONAS: '/api/personas',
  SCENARIOS: '/api/scenarios',
  PROGRESS: '/api/progress',
  VOCAB_TRACKER: '/api/vocab-tracker'
} as const;

// UI Constants
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280
} as const;