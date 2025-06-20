
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isDevelopment } from '@/lib/environment';

// Singleton pattern with global reference
declare global {
  var __supabase_client: any;
}

let supabaseClient: any;

// Get environment-specific configuration
const config = getSupabaseConfig();

if (typeof globalThis !== 'undefined' && globalThis.__supabase_client) {
  console.log('🔄 Using existing Supabase client instance');
  supabaseClient = globalThis.__supabase_client;
} else {
  console.log('🔗 Creating new Supabase client for:', config.url, '(Environment:', isDevelopment ? 'development' : 'production' + ')');
  
  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: `tomoshibi-auth-${isDevelopment ? 'dev' : 'prod'}`,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'tomoshibi-client'
      }
    }
  });

  // Store globally to prevent multiple instances
  if (typeof globalThis !== 'undefined') {
    globalThis.__supabase_client = supabaseClient;
  }
}

export const supabase = supabaseClient;
