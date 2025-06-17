import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force connection to Supabase database
const supabaseUrl = "postgresql://postgres:v8f!6PS@W!&XXvk@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres";
const connectionString = supabaseUrl;

console.log("🔗 Connecting to Supabase database:", connectionString.replace(/:([^:@]*@)/, ':***@'));

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });