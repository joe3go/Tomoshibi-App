
import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

// Environment-specific Supabase configuration for backend
const isDevelopment = process.env.NODE_ENV === 'development';

const supabaseUrl = isDevelopment 
  ? process.env.VITE_SUPABASE_DEV_URL 
  : process.env.VITE_SUPABASE_PROD_URL;

const supabaseServiceKey = isDevelopment
  ? process.env.VITE_SUPABASE_DEV_SERVICE_KEY
  : process.env.VITE_SUPABASE_PROD_SERVICE_KEY;

console.log("🔗 Connecting to Supabase:", supabaseUrl, "(Environment:", process.env.NODE_ENV || 'development', ")");

if (!supabaseUrl || !supabaseServiceKey) {
  const envPrefix = isDevelopment ? 'DEV' : 'PROD';
  throw new Error(`VITE_SUPABASE_${envPrefix}_URL and VITE_SUPABASE_${envPrefix}_SERVICE_KEY must be set. Did you forget to set your Supabase credentials in Secrets?`);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// For compatibility with existing drizzle code, we'll create a mock db object
// Most operations should migrate to use supabase client directly
export const db = null; // Will need to migrate queries to use supabase client
export const pool = null; // Legacy, not used with Supabase client
