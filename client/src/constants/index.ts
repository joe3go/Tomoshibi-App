
import type { AppConfig, ThemeConfig } from '@/types';

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.PROD ? '' : 'http://localhost:5000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Theme Configuration
export const THEME_CONFIG: ThemeConfig = {
  mode: 'light',
  primaryColor: 'hsl(350, 65%, 45%)',
  fontFamily: 'Noto Sans JP, Inter, sans-serif',
} as const;

// App Configuration
export const APP_CONFIG: AppConfig = {
  apiUrl: API_CONFIG.BASE_URL,
  enableDevTools: !import.meta.env.PROD,
  theme: THEME_CONFIG,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  VOCABULARY: '/vocabulary',
  HISTORY: '/history',
  SETTINGS: '/settings',
  SCENARIOS: '/scenarios',
  TUTORS: '/tutors',
} as const;

// JLPT Levels
export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  SLOW_RENDER: 100, // ms
  SLOW_API: 1000, // ms
  MEMORY_WARNING: 50, // MB
  BUNDLE_SIZE_WARNING: 1000, // KB
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  MESSAGE_MAX_LENGTH: 1000,
  DISPLAY_NAME_MIN_LENGTH: 2,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  ANIMATION_DURATION: 200,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please log in again.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;
