
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const token = getAuthToken();
  
  // Initialize Supabase session
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        // Wait for Supabase to restore session from localStorage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          setSupabaseSession(session);
          setSupabaseLoading(false);
        }
      } catch (error) {
        console.error('Failed to get Supabase session:', error);
        if (mounted) {
          setSupabaseLoading(false);
        }
      }
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSupabaseSession(session);
        setSupabaseLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && token !== 'null' && token !== 'undefined' && isInitialized && !supabaseLoading,
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
    // Initialize auth state validation after Supabase is ready
    if (!supabaseLoading) {
      const savedToken = getAuthToken();
      
      // Clear invalid tokens immediately
      if (savedToken && (savedToken === 'null' || savedToken === 'undefined' || savedToken.trim() === '')) {
        localStorage.removeItem('token');
      }
      
      setIsInitialized(true);
    }
  }, [supabaseLoading]);

  const hasValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
  const isLoading = supabaseLoading || !isInitialized || (userLoading && hasValidToken);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && hasValidToken && !!supabaseSession,
    error,
    supabaseSession,
  };
}
