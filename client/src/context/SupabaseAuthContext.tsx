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

  useEffect(() => {
    // Prevent double initialization
    if (initialized.current) return;
    initialized.current = true;

    console.log('🚀 Initializing AuthContext (single instance)...');

    let authSubscription: any = null;

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

        // Set up auth state listener
        authSubscription = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state change:', {
            event,
            hasSession: !!session,
            userEmail: session?.user?.email,
            mounted: mountedRef.current,
            currentLoading: loading,
            timestamp: new Date().toISOString()
          });

          if (!mountedRef.current) {
            console.log('❌ Component unmounted, ignoring session');
            return;
          }

          // Update session for all events
          setSession(session);

          // Only set loading to false after we've processed the initial session or any auth change
          if (loading) {
            console.log('🔄 Setting loading to false from auth state change');
            setLoading(false);
          }
        });

        authSubscription = subscription;

      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up AuthContext');
      mountedRef.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array - only run once

  // Track renders for debugging
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log('🔄 AuthContext Render:', {
    renderCount: renderCount.current,
    loading,
    hasSession: !!session,
    authInitialized: initialized.current,
    timestamp: new Date().toISOString()
  });

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