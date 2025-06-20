
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../environment';

const config = getSupabaseConfig();

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: any = null;

const createSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log(`🔗 Creating Supabase client for: ${config.url} (Environment: ${import.meta.env.MODE})`);
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

export const supabase = createSupabaseClient();
