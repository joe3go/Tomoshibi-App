import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isDevelopment } from '@/lib/environment';
import { logDebug, logInfo } from "@utils/logger";

// Enhanced singleton with proper cleanup
let supabaseClient: any = null;

// Get environment-specific configuration
const config = getSupabaseConfig();

function createSupabaseClient() {
  if (supabaseClient) {
    console.log('🔄 Using existing Supabase client instance');
    return supabaseClient;
  }

  logInfo('Creating new Supabase client for:', config.url, '(Environment:', isDevelopment ? 'development' : 'production' + ')');

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

  return supabaseClient;
}

export const supabase = createSupabaseClient();