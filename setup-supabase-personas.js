import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsnnydemkpllycgzmalv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbnJ5ZGVta3BsbHljZ3ptYWx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE0ODQ4OSwiZXhwIjoyMDY1NzI0NDg5fQ.G7zJF8TdkxHQkTSrwOYOwg9GCYgE4vweTxhNgxnyFq0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPersonas() {
  console.log('Setting up personas table in Supabase...');

  try {
    // Create personas table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS personas (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('teacher', 'friend')),
          description TEXT,
          jlpt_level TEXT DEFAULT 'N5',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.error('Error creating personas table:', createError);
      // Try using direct SQL execution instead
      const { error: directError } = await supabase
        .from('personas')
        .select('id')
        .limit(1);

      if (directError && directError.code === 'PGRST116') {
        console.log('Personas table does not exist, creating via RPC...');
        throw new Error('Table creation needed');
      }
    }

    // Check if personas already exist
    const { data: existingPersonas, error: checkError } = await supabase
      .from('personas')
      .select('*');

    if (checkError) {
      console.error('Error checking existing personas:', checkError);
      return;
    }

    if (existingPersonas && existingPersonas.length > 0) {
      console.log('Personas already exist:', existingPersonas.length);
      return;
    }

    // Insert default personas
    const { data, error } = await supabase
      .from('personas')
      .insert([
        {
          name: 'Aoi',
          type: 'teacher',
          description: 'A formal Japanese teacher who focuses on proper grammar, cultural context, and structured learning. Perfect for building strong foundations in Japanese.',
          jlpt_level: 'N5'
        },
        {
          name: 'Haruki',
          type: 'friend',
          description: 'A friendly Japanese tutor who emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence in speaking.',
          jlpt_level: 'N5'
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting personas:', error);
      return;
    }

    console.log('Successfully created personas:', data);
    console.log('Personas setup complete!');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupPersonas();