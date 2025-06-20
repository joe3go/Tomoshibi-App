import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = getAuthToken();

  // Initialize Supabase session
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Failed to get Supabase session:', error);
        }
        setSession(session);
        setLoading(false);
      } catch (error) {
        console.error('Failed to get Supabase session:', error);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { data: user, isLoading: userLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && token !== 'null' && token !== 'undefined' && !loading && !!session,
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

  const hasValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
  const isAuthenticated = !!user && hasValidToken && !!session;

  return {
    user,
    isLoading: loading || (userLoading && hasValidToken && !!session),
    isAuthenticated,
    session,
    error,
    supabaseSession: session, // Keep for backward compatibility
  };
}