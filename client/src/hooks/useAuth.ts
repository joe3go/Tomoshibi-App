import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Failed to get Supabase session:', error);
        }
        setUser(session?.user || null);
        setLoading(false);
      } catch (error) {
        console.error('Failed to get Supabase session:', error);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!user;

  return {
    user: user ? {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
      preferredKanjiDisplay: user.user_metadata?.preferred_kanji_display || 'furigana',
    } : null,
    isLoading: loading,
    isAuthenticated,
    session: user ? { user } : null,
    error: null,
    supabaseSession: user ? { user } : null,
  };
}