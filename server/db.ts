import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Intelligent database connection with Supabase priority
const supabaseConnectionString = "postgresql://postgres:85j1KMUjJ0cFi4Gn@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres";
const fallbackConnectionString = process.env.DATABASE_URL;

// Function to test connection and choose best database
async function createDatabaseConnection() {
  // Try Supabase first
  try {
    const testPool = new Pool({ 
      connectionString: supabaseConnectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    
    const testClient = await testPool.connect();
    testClient.release();
    await testPool.end();
    
    console.log("🔗 Connected to Supabase database:", supabaseConnectionString.replace(/:([^:@]*@)/, ':***@'));
    return new Pool({ 
      connectionString: supabaseConnectionString,
      ssl: { rejectUnauthorized: false }
    });
  } catch (error) {
    console.log("⚠️ Supabase connection failed, using fallback:", error.message);
    
    console.log("🔗 Connected to fallback database:", fallbackConnectionString.replace(/:([^:@]*@)/, ':***@'));
    return new Pool({ 
      connectionString: fallbackConnectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
}

// Create connection pool synchronously with fallback
let connectionString = supabaseConnectionString;
try {
  // Quick connection test
  const testPool = new Pool({ 
    connectionString: supabaseConnectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 1000
  });
  console.log("🔗 Attempting Supabase connection:", supabaseConnectionString.replace(/:([^:@]*@)/, ':***@'));
} catch {
  connectionString = fallbackConnectionString;
  console.log("🔗 Using fallback database:", fallbackConnectionString.replace(/:([^:@]*@)/, ':***@'));
}

export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });