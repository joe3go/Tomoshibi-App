
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isDevelopment } from '@/lib/environment';

// Get environment-specific configuration
const config = getSupabaseConfig();

console.log('🔗 Creating Supabase client for:', config.url, '(Environment:', isDevelopment ? 'development' : 'production' + ')');

// Create singleton client instance
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'tomoshibi-auth-token',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Prevent multiple instances
if (typeof window !== 'undefined') {
  if ((window as any).__supabase_client) {
    console.warn('⚠️ Multiple Supabase clients detected, using existing instance');
  } else {
    (window as any).__supabase_client = supabase;
  }
}
