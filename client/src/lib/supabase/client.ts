
import { createClient } from '@supabase/supabase-js';
import { getEnvironmentConfig } from '@/lib/environment';

// Get environment-specific configuration
const config = getEnvironmentConfig();

console.log('🔗 Creating Supabase client for:', config.supabaseUrl, '(Environment:', config.environment + ')');

// Create singleton client instance
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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
