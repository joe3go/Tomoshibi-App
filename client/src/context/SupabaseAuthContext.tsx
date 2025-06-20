
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  const authInitialized = useRef(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (authInitialized.current) {
      return;
    }
    authInitialized.current = true;

    let mounted = true;

    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Set loading timeout as backup
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // Reduced to 5 seconds

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('Initial session loaded:', !!session);
          setSession(session);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session);
      
      if (mounted) {
        setSession(session);
        
        // Only set loading to false if we haven't already
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    subscriptionRef.current = subscription;
    initializeAuth();

    return () => {
      mounted = false;
      authInitialized.current = false;
      clearTimeout(loadingTimeout);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Reset initialization flag when component unmounts
  useEffect(() => {
    return () => {
      authInitialized.current = false;
    };
  }, []);

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
