import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useState, useEffect } from "react";

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const token = getAuthToken();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && token !== 'null' && token !== 'undefined' && isInitialized,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      // If token is invalid, clear it
      if (error?.status === 401 || error?.status === 403) {
        localStorage.removeItem('token');
      }
    }
  });

  useEffect(() => {
    // Initialize auth state validation
    const initializeAuth = () => {
      const savedToken = getAuthToken();
      
      // Clear invalid tokens immediately
      if (savedToken && (savedToken === 'null' || savedToken === 'undefined' || savedToken.trim() === '')) {
        localStorage.removeItem('token');
      }
      
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const hasValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
  const isLoading_ = !isInitialized || (isLoading && hasValidToken);

  return {
    user,
    isLoading: isLoading_,
    isAuthenticated: !!user && hasValidToken,
    error,
  };
}
