import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isDevelopment } from '@/lib/environment';

// Get environment-specific configuration
const config = getSupabaseConfig();

console.log('🔗 Creating Supabase client for:', config.url, '(Environment:', isDevelopment ? 'development' : 'production' + ')');

// Create singleton client instance or use existing one
let supabaseClient: any;

if (typeof window !== 'undefined' && (window as any).__supabase_client) {
  console.warn('⚠️ Multiple Supabase clients detected, using existing instance');
  supabaseClient = (window as any).__supabase_client;
} else {
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'tomoshibi-auth-token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  // Store reference to prevent multiple instances
  if (typeof window !== 'undefined') {
    (window as any).__supabase_client = supabaseClient;
  }
}

export const supabase = supabaseClient;