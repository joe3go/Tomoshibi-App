import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/lib/supabase/client";
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { logDebug, logError, logInfo } from "@utils/logger";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logInfo('Initializing auth context...');

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting initial session:', error);
        } else {
          logInfo('Initial session retrieved:', !!initialSession);
          setSession(initialSession);
        }
      } catch (error) {
        console.error('💥 Session retrieval error:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logDebug('Auth state change:', event, !!session);

      if (event === 'INITIAL_SESSION') {
        logInfo('Initial session retrieved:', !!session);
      }
      setSession(session);

      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      logDebug('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};