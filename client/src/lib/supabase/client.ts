
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../environment';

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
