
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  user: any;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  user: null,
});

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadHandled = false;

    // Timeout to ensure loading never stays true indefinitely
    const loadingTimeout = setTimeout(() => {
      if (mounted && !initialLoadHandled) {
        console.warn('Auth loading timeout reached, setting loading to false');
        setLoading(false);
        initialLoadHandled = true;
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted && !initialLoadHandled) {
          setSession(session);
          setLoading(false);
          initialLoadHandled = true;
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted && !initialLoadHandled) {
          setSession(null);
          setLoading(false);
          initialLoadHandled = true;
          clearTimeout(loadingTimeout);
        }
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      if (mounted) {
        setSession(session);
        // Always set loading to false after any auth state change
        if (!initialLoadHandled) {
          setLoading(false);
          initialLoadHandled = true;
          clearTimeout(loadingTimeout);
        }
      }
    });

    return () => {
      mounted = false;
      initialLoadHandled = true;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, [])

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      user: session?.user || null 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
