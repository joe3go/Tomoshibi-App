import { useAuth } from '@/context/SupabaseAuthContext';

export function useSupabaseAuth() {
  const { user, loading, session } = useAuth();

  return { 
    user, 
    loading, 
    isAuthenticated: !!session 
  };
}