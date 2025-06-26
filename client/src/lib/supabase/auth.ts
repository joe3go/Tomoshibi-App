import { supabase } from './client';
import type { Session, User } from '@supabase/supabase-js';
import { logError, logInfo } from "@utils/logger";
import { isValidEmail } from "@utils/validation";

export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}