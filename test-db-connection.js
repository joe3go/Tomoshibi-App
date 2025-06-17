import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('Database URL pattern:', connectionString?.replace(/:[^:@]*@/, ':***@'));

const pool = new Pool({ connectionString });

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Connected to database successfully');
    
    // Create a unique test entry to verify we're on the right database
    const testId = Date.now();
    await client.query(`
      INSERT INTO users (email, password_hash, display_name) 
      VALUES ($1, 'test_hash', 'DB_TEST_${testId}') 
      ON CONFLICT (email) DO UPDATE SET display_name = 'DB_TEST_${testId}'
    `, [`test_${testId}@example.com`]);
    
    console.log(`✓ Test entry created: DB_TEST_${testId}`);
    
    // Check total user count
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users in database:', result.rows[0].count);
    
    // Check if vocabulary is loaded
    const vocabResult = await client.query('SELECT COUNT(*) as count FROM jlpt_vocab');
    console.log('Total vocabulary entries:', vocabResult.rows[0].count);
    
    client.release();
    
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
  }
}

testConnection();