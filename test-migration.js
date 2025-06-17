import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: "postgresql://postgres:85j1KMUjJ0cFi4Gn@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function testMigration() {
  const client = await pool.connect();
  
  try {
    // Test 1: Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Test 2: Create a test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    await client.query(`
      INSERT INTO users (email, password_hash, display_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name
    `, ['test@tomoshibi.com', hashedPassword, 'Test User']);
    
    console.log('👤 Test user created: test@tomoshibi.com / testpassword');
    
    // Test 3: Check personas
    const personasResult = await client.query('SELECT * FROM personas');
    console.log(`🎭 Personas available: ${personasResult.rows.length}`);
    personasResult.rows.forEach(persona => {
      console.log(`  ✓ ${persona.name}: ${persona.description}`);
    });
    
    // Test 4: Check scenarios
    const scenariosResult = await client.query('SELECT * FROM scenarios');
    console.log(`📚 Scenarios available: ${scenariosResult.rows.length}`);
    scenariosResult.rows.forEach(scenario => {
      console.log(`  ✓ ${scenario.title} (${scenario.difficulty_level})`);
    });
    
    // Test 5: Check vocabulary count
    const vocabResult = await client.query('SELECT jlpt_level, COUNT(*) as count FROM jlpt_vocab GROUP BY jlpt_level ORDER BY jlpt_level');
    console.log('📖 Vocabulary by level:');
    vocabResult.rows.forEach(row => {
      console.log(`  ✓ ${row.jlpt_level}: ${row.count} words`);
    });
    
    console.log('\n🎉 Supabase migration test completed successfully!');
    console.log('🔐 Login with: test@tomoshibi.com / testpassword');
    
  } catch (error) {
    console.error('Migration test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testMigration();