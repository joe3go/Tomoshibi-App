
import { useState, useEffect, useCallback, useRef } from 'react';

import { API_CONFIG } from '@/constants';
import { errorHandlers } from '@/lib/utils';
import type { UseApiReturn } from '@/types';

interface UseApiOptions {
  immediate?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> & { execute: () => Promise<void> } {
  const {
    immediate = true,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (): Promise<void> => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const result = await apiCall();
        
        if (!mountedRef.current) return;
        
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        
        if (attempt < retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }
    }

    if (!mountedRef.current) return;

    setError(lastError!);
    setLoading(false);
    onError?.(lastError!);
    errorHandlers.logError(lastError!, 'useApi');
  }, [apiCall, retryAttempts, retryDelay, onError, onSuccess]);

  const refetch = useCallback(async (): Promise<void> => {
    await execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    execute,
  };
}

// Specialized hooks for common API patterns
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  initialPage: number = 1,
  initialLimit: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  
  const api = useApi(
    () => apiCall(page, limit),
    { immediate: false }
  );

  const { data, loading, error, refetch } = api;

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  useEffect(() => {
    refetch();
  }, [page, limit, refetch]);

  return {
    data: data?.data || [],
    total: data?.total || 0,
    page,
    limit,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    refetch,
  };
}

export function useMutationApi<T, P = void>(
  apiCall: (params: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(params);
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      errorHandlers.logError(error, 'useMutationApi');
      throw error;
    }
  }, [apiCall]);

  return {
    mutate,
    loading,
    error,
  };
}
