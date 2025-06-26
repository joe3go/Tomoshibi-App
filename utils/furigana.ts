
/**
 * Furigana and Japanese text formatting utilities
 */

export const formatFurigana = (text: string, reading?: string): string => {
  if (!reading) return text;
  return `${text}[${reading}]`;
};

export const extractKanjiAndReading = (furiganaText: string): { kanji: string; reading: string } | null => {
  const match = furiganaText.match(/^(.+?)\[(.+?)\]$/);
  if (match) {
    return {
      kanji: match[1],
      reading: match[2]
    };
  }
  return null;
};

export const stripFurigana = (text: string): string => {
  return text.replace(/\[.*?\]/g, '');
};

export const hasKanji = (text: string): boolean => {
  return /[\u4e00-\u9faf]/.test(text);
};

export const hasHiragana = (text: string): boolean => {
  return /[\u3040-\u309f]/.test(text);
};

export const hasKatakana = (text: string): boolean => {
  return /[\u30a0-\u30ff]/.test(text);
};

export const isOnlyHiragana = (text: string): boolean => {
  return /^[\u3040-\u309f\s]*$/.test(text);
};

export const normalizeJapaneseText = (text: string): string => {
  return text.trim().replace(/\s+/g, '');
};
