import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required but not configured. Please provide your Supabase anonymous key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);