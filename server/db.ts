
import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

// Environment-aware Supabase configuration for backend
const supabaseUrl = process.env.NODE_ENV === 'production'
  ? 'https://oyawpeylvdqfkhysnjsq.supabase.co'
  : 'https://gsnnydemkpllycgzmalv.supabase.co';

const serviceKey = process.env.NODE_ENV === 'production'
  ? process.env.VITE_SUPABASE_PROD_SERVICE_KEY
  : process.env.VITE_SUPABASE_DEV_SERVICE_KEY;

console.log("🔗 Connecting to Supabase:", supabaseUrl, "(Environment:", process.env.NODE_ENV || 'development', ")");

if (!supabaseUrl || !serviceKey) {
  const envPrefix = process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV';
  throw new Error(`VITE_SUPABASE_${envPrefix}_SERVICE_KEY must be set. Did you forget to set your Supabase credentials in Secrets?`);
}

export const supabase = createClient(supabaseUrl, serviceKey!);

// For compatibility with existing drizzle code, we'll create a mock db object
// Most operations should migrate to use supabase client directly
export const db = null; // Will need to migrate queries to use supabase client
export const pool = null; // Legacy, not used with Supabase client
