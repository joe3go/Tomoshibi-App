import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use stable Neon database for backend operations
const connectionString = process.env.DATABASE_URL;

console.log("🔗 Connecting to database:", connectionString?.replace(/:([^:@]*@)/, ':***@'));

if (!connectionString) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });