
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { VALIDATION_RULES, ERROR_MESSAGES } from '@/constants';
import type { JLPTLevel } from '@/types';

// Utility function for combining class names
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Type-safe local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};

// Validation utilities
export const validators = {
  email: (email: string): boolean => 
    VALIDATION_RULES.EMAIL_REGEX.test(email),

  password: (password: string): boolean => 
    password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH,

  required: (value: string): boolean => 
    value.trim().length > 0,

  maxLength: (value: string, max: number): boolean => 
    value.length <= max,

  minLength: (value: string, min: number): boolean => 
    value.length >= min,
};

// Format utilities
export const formatters = {
  date: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
    });
  },

  time: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  percentage: (value: number): string => `${Math.round(value)}%`,

  jlptLevel: (level: JLPTLevel): string => `JLPT ${level}`,

  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  },
};

// Performance utilities
export const performance = {
  mark: (name: string): void => {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark: string): number => {
    if ('performance' in window && performance.measure && 'getEntriesByName' in performance) {
      performance.measure(name, startMark, endMark);
      const entries = (performance as any).getEntriesByName(name);
      return entries[entries.length - 1]?.duration || 0;
    }
    return 0;
  },

  clearMarks: (): void => {
    if ('performance' in window && performance.clearMarks) {
      performance.clearMarks();
    }
  },
};

// Error handling utilities
export const errorHandlers = {
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return ERROR_MESSAGES.GENERIC_ERROR;
  },

  logError: (error: unknown, context?: string): void => {
    const message = errorHandlers.getErrorMessage(error);
    console.error(`${context ? `[${context}] ` : ''}${message}`, error);
  },

  createErrorHandler: (context: string) => (error: unknown): void => {
    errorHandlers.logError(error, context);
  },
};

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Async utilities
export const asyncUtils = {
  delay: (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms)),

  timeout: <T>(promise: Promise<T>, ms: number): Promise<T> => 
    Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), ms)
      ),
    ]),

  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await asyncUtils.delay(delay * attempt);
      }
    }
    throw new Error('Max retry attempts exceeded');
  },
};

// Array utilities
export const arrayUtils = {
  unique: <T>(array: T[]): T[] => Array.from(new Set(array)),

  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  groupBy: <T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      (groups[key] = groups[key] || []).push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },
};

// Object utilities
export const objectUtils = {
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  },

  isEmpty: (obj: unknown): boolean => {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object' && obj !== null) return Object.keys(obj as Record<string, unknown>).length === 0;
    return false;
  },
};

// Dashboard-specific utilities
export const dashboardUtils = {
  getScenarioJapanese: (title: string): string => {
    const scenarios: Record<string, string> = {
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
    };
    return scenarios[title] || title;
  },

  getProgressionLabel: (vocabCount: number, completedCount: number): string => {
    const totalInteractions = vocabCount + completedCount;
    if (totalInteractions >= 100) return "🌸 Sakura Scholar";
    if (totalInteractions >= 75) return "🗾 Island Explorer";
    if (totalInteractions >= 50) return "🏮 Lantern Bearer";
    if (totalInteractions >= 25) return "🌱 Bamboo Sprout";
    if (totalInteractions >= 10) return "📚 Study Starter";
    return "🌟 Rising Sun";
  },

  filterConversationsByStatus: <T extends { status?: string }>(
    conversations: readonly T[],
    status: 'active' | 'completed' | 'paused'
  ): readonly T[] => {
    if (!Array.isArray(conversations)) return [];
    return conversations.filter((c) => (c.status || 'active') === status);
  },

  sanitizeInput: (input: string): string => {
    return input.replace(/[<>]/g, '').trim().substring(0, 1000);
  },

  safeArrayAccess: <T>(
    array: readonly T[] | null | undefined,
    defaultValue: readonly T[] = []
  ): readonly T[] => {
    return Array.isArray(array) ? array : defaultValue;
  },

  formatJapaneseDate: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }
};
