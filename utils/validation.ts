
/**
 * General validation utilities
 */

export const isEnglishMessage = (message: string): boolean => {
  // Check if message contains primarily English characters
  const englishRegex = /^[a-zA-Z0-9\s.,!?'"()\-:;]*$/;
  return englishRegex.test(message.trim());
};

export const isJapaneseText = (text: string): boolean => {
  // Check for Hiragana, Katakana, or Kanji characters
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
