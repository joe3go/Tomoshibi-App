
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
  const renderCount = useRef(0);
  const loadingStateChanges = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log('🔄 AuthContext Render:', {
      renderCount: renderCount.current,
      loading,
      hasSession: !!session,
      authInitialized: authInitialized.current,
      timestamp: new Date().toISOString()
    });

    // Prevent multiple initializations
    if (authInitialized.current) {
      console.log('⚠️ AuthContext already initialized, skipping...');
      return;
    }
    authInitialized.current = true;
    console.log('🚀 Initializing AuthContext...');

    let mounted = true;

    // Cleanup any existing subscription first
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Set loading timeout as backup
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ Auth loading timeout - forcing loading to false');
        setLoading(false);
        loadingStateChanges.current += 1;
      }
    }, 5000); // Reduced to 5 seconds

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('📡 Fetching initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          console.log('✅ Initial session loaded:', {
            hasSession: !!session,
            userEmail: session?.user?.email,
            sessionId: session?.session_id
          });
          setSession(session);
          setLoading(false);
          loadingStateChanges.current += 1;
          clearTimeout(loadingTimeout);
        } else {
          console.log('❌ Component unmounted, ignoring session');
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error);
        if (mounted) {
          setSession(null);
          setLoading(false);
          loadingStateChanges.current += 1;
          clearTimeout(loadingTimeout);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', {
        event,
        hasSession: !!session,
        userEmail: session?.user?.email,
        sessionId: session?.session_id,
        mounted,
        currentLoading: loading,
        timestamp: new Date().toISOString()
      });
      
      if (mounted) {
        setSession(session);
        
        // Only set loading to false if we haven't already
        if (loading) {
          console.log('🔄 Setting loading to false from auth state change');
          setLoading(false);
          loadingStateChanges.current += 1;
        }
        clearTimeout(loadingTimeout);
      } else {
        console.log('❌ Auth state change ignored - component unmounted');
      }
    });

    subscriptionRef.current = subscription;
    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up AuthContext');
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
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          fontSize: '11px',
          borderRadius: '4px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div>🔍 Auth Debug:</div>
          <div>Loading: {loading ? 'true' : 'false'}</div>
          <div>Session: {session ? 'exists' : 'null'}</div>
          <div>User: {session?.user?.email || 'none'}</div>
          <div>Renders: {renderCount.current}</div>
          <div>Loading Changes: {loadingStateChanges.current}</div>
          <div>Initialized: {authInitialized.current ? 'true' : 'false'}</div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
