
export const safeJapaneseString = (value: unknown, fallback = '学生') => {
  const str = typeof value === 'string' ? value : String(value ?? fallback);
  return str.replace(/[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー・]/gu, '').slice(0, 20);
};

export const safeString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return fallback;
  return String(value);
};

export const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};
