import { createClient } from '@supabase/supabase-js';

// Environment-specific configuration
const isDevelopment = import.meta.env.MODE === 'development';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';

// Use environment-specific keys
const supabaseAnonKey = isDevelopment 
  ? (import.meta.env.VITE_SUPABASE_DEV_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
  : (import.meta.env.VITE_SUPABASE_PROD_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY);

console.log('🔧 Supabase Client Environment:', isDevelopment ? 'development' : 'production');
console.log('🔧 Using Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);