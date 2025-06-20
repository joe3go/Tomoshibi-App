
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

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
  const initialized = useRef(false);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      console.log('🧹 AuthProvider unmounting');
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) {
      console.log('⚠️ Auth already initialized, skipping');
      return;
    }
    
    initialized.current = true;
    console.log('🚀 Initializing AuthContext (single instance)...');

    const initializeAuth = async () => {
      try {
        console.log('📡 Fetching initial session...');

        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting initial session:', error);
        }

        if (mountedRef.current) {
          setSession(initialSession);
          setLoading(false);
          console.log('✅ Initial session loaded:', {
            hasSession: !!initialSession,
            userEmail: initialSession?.user?.email
          });
        }

        // Set up auth state listener (only once)
        if (!subscriptionRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state change:', {
              event,
              hasSession: !!session,
              userEmail: session?.user?.email,
              mounted: mountedRef.current
            });

            if (!mountedRef.current) {
              console.log('❌ Component unmounted, ignoring auth change');
              return;
            }

            setSession(session);
            
            // Only set loading to false after initial session or sign out
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
              setLoading(false);
            }
          });

          subscriptionRef.current = subscription;
        }

      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - only run once

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
