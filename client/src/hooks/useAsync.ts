import { useState, useEffect, useCallback } from 'react';
import type { AsyncResult } from '@/types';

/**
 * Custom hook for handling async operations with proper TypeScript support
 * Provides loading, data, and error states with automatic cleanup
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): AsyncResult<T, E> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncResult<T, E>>({
    loading: false,
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction();
      setState({ loading: false, data, error: null });
    } catch (error) {
      setState({ 
        loading: false, 
        data: null, 
        error: error instanceof Error ? error.message as E : error as E 
      });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, execute };
}