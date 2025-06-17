// Script to create Supabase tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyawpeylvdqfkhysnjsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTables() {
  console.log('Creating Supabase tables...');

  // Create user_vocab table
  const { data: vocabTable, error: vocabError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_vocab (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        word TEXT NOT NULL,
        reading TEXT NOT NULL,
        meaning TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_vocab_user_id ON user_vocab(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_vocab_created_at ON user_vocab(created_at);
    `
  });

  if (vocabError) {
    console.error('Error creating user_vocab table:', vocabError);
  } else {
    console.log('user_vocab table created successfully');
  }

  // Create user_scenario_progress table
  const { data: progressTable, error: progressError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_scenario_progress (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        scenario_id TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        xp INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, scenario_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_scenario_progress_user_id ON user_scenario_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_scenario_progress_scenario_id ON user_scenario_progress(scenario_id);
    `
  });

  if (progressError) {
    console.error('Error creating user_scenario_progress table:', progressError);
  } else {
    console.log('user_scenario_progress table created successfully');
  }

  // Test insert to verify tables work
  const { data: testData, error: testError } = await supabase
    .from('user_vocab')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000001',
      word: 'こんにちは',
      reading: 'こんにちは',
      meaning: 'hello',
      source: 'test'
    })
    .select();

  if (testError) {
    console.error('Test insert error:', testError);
  } else {
    console.log('Test insert successful:', testData);
  }
}

createTables();