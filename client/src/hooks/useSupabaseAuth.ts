import { useState, useEffect } from 'react';
import { SupabaseUser } from '@/lib/supabase/types';
import { getCurrentUser, onAuthStateChange } from '@/lib/supabase/auth';

export function useSupabaseAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial user
    getCurrentUser().then((user) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isAuthenticated: !!user };
}