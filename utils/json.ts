
/**
 * Safe JSON parsing utilities
 */

export const safeParseJSON = <T = any>(jsonString: string, fallback: T | null = null): T | null => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

export const safeStringifyJSON = (obj: any, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error);
    return fallback;
  }
};

export const parseJSONWithSchema = <T>(
  jsonString: string,
  validator: (obj: any) => obj is T,
  fallback: T
): T => {
  const parsed = safeParseJSON(jsonString);
  if (parsed && validator(parsed)) {
    return parsed;
  }
  return fallback;
};
