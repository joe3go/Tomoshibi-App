import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force connection to Supabase database
const supabaseUrl = "postgresql://postgres:85j1KMUjJ0cFi4Gn@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres";
const connectionString = supabaseUrl;

console.log("🔗 Connecting to Supabase database:", connectionString.replace(/:([^:@]*@)/, ':***@'));

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });