
import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

// Use consistent Supabase configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("🔗 Connecting to Supabase:", supabaseUrl, "(Environment:", process.env.NODE_ENV || 'development', ")");

if (!supabaseUrl || !serviceKey) {
  throw new Error(`VITE_SUPABASE_ANON_KEY must be set. Did you forget to set your Supabase credentials in Secrets?`);
}

export const supabase = createClient(supabaseUrl, serviceKey!);

// For compatibility with existing drizzle code, we'll create a mock db object
// Most operations should migrate to use supabase client directly
export const db = null; // Will need to migrate queries to use supabase client
export const pool = null; // Legacy, not used with Supabase client
