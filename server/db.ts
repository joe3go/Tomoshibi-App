
import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

// Use Supabase client for backend operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("🔗 Connecting to Supabase:", supabaseUrl);

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Did you forget to set your Supabase credentials?");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// For compatibility with existing drizzle code, we'll create a mock db object
// Most operations should migrate to use supabase client directly
export const db = null; // Will need to migrate queries to use supabase client
export const pool = null; // Legacy, not used with Supabase client
