
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const config = {
    url: isDevelopment 
      ? process.env.VITE_SUPABASE_DEV_URL || 'https://gsnnydemkpllycgzmalv.supabase.co'
      : process.env.VITE_SUPABASE_PROD_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co',
    key: isDevelopment 
      ? process.env.VITE_SUPABASE_DEV_ANON_KEY || ''
      : process.env.VITE_SUPABASE_PROD_ANON_KEY || ''
  };

  return createSupabaseClient(config.url, config.key);
}
