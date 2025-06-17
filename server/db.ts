import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Supabase pooler connection string for better reliability
const supabaseConnectionString = "postgresql://postgres.oyawpeylvdqfkhysnjsq:85j1KMUjJ0cFi4Gn@aws-0-us-west-1.pooler.supabase.com:6543/postgres";
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