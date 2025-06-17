import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Force Supabase connection for migration
const supabaseConnectionString = "postgresql://postgres:85j1KMUjJ0cFi4Gn@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres";
const connectionString = supabaseConnectionString;

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