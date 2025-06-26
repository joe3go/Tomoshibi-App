
/**
 * Debug logging utilities
 */

export const logDebug = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`🐛 ${message}`, ...args);
  }
};

export const logInfo = (message: string, ...args: any[]): void => {
  console.info(`ℹ️ ${message}`, ...args);
};

export const logWarning = (message: string, ...args: any[]): void => {
  console.warn(`⚠️ ${message}`, ...args);
};

export const logError = (message: string, error?: any): void => {
  console.error(`❌ ${message}`, error);
};

export const logSuccess = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${message}`, ...args);
  }
};

export const createTimedLogger = (label: string) => {
  const start = Date.now();
  return {
    log: (message: string) => {
      const elapsed = Date.now() - start;
      logDebug(`[${label}] ${message} (${elapsed}ms)`);
    },
    end: () => {
      const elapsed = Date.now() - start;
      logDebug(`[${label}] Completed in ${elapsed}ms`);
    }
  };
};
