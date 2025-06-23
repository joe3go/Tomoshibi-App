const { createClient } = require('@supabase/supabase-js');

async function emergencyTableFix() {
  const supabaseUrl = process.env.VITE_SUPABASE_DEV_URL;
  const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🚑 Emergency fix for conversations table...');

  try {
    // First, let's see what columns actually exist
    console.log('1. Checking current table structure...');
    const { data: existing, error: checkError } = await supabase
      .from('conversations')
      .select('*')
      .limit(0);

    console.log('Current table check result:', { existing, checkError });

    // Try using the HTTP API directly to execute SQL
    console.log('2. Attempting direct SQL execution via HTTP...');
    
    const sqlQuery = `
      -- Drop and recreate conversations table
      DROP TABLE IF EXISTS public.conversations CASCADE;
      
      CREATE TABLE public.conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          persona_id UUID NOT NULL,
          scenario_id UUID,
          title TEXT,
          phase TEXT DEFAULT 'greeting',
          status TEXT DEFAULT 'active',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "conversations_policy" ON public.conversations
      FOR ALL USING (auth.uid()::text = user_id::text);
      
      CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
      CREATE INDEX idx_conversations_persona_id ON public.conversations(persona_id);
      CREATE INDEX idx_conversations_status ON public.conversations(status);
      
      GRANT ALL ON public.conversations TO authenticated;
      GRANT ALL ON public.conversations TO service_role;
    `;

    // Try multiple SQL execution methods
    const methods = [
      () => supabase.rpc('exec_sql', { sql: sqlQuery }),
      () => supabase.rpc('execute_sql', { query: sqlQuery }),
      () => supabase.rpc('run_sql', { statement: sqlQuery })
    ];

    let success = false;
    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`Trying method ${i + 1}...`);
        const { data, error } = await methods[i]();
        if (!error) {
          console.log('✅ SQL executed successfully!');
          success = true;
          break;
        } else {
          console.log(`Method ${i + 1} failed:`, error.message);
        }
      } catch (e) {
        console.log(`Method ${i + 1} exception:`, e.message);
      }
    }

    if (!success) {
      console.log('❌ All SQL execution methods failed');
      console.log('📋 Manual intervention required:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Execute the SQL from SUPABASE_CONVERSATIONS_FIX.sql');
      console.log('3. Test conversation creation after execution');
      return;
    }

    // Test if the fix worked
    console.log('3. Testing fixed table structure...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: personas } = await supabase.from('personas').select('id').limit(1);
    
    if (users.users && users.users.length > 0 && personas && personas.length > 0) {
      const testData = {
        user_id: users.users[0].id,
        persona_id: personas[0].id,
        title: 'Test Conversation',
        status: 'active'
      };

      const { data: testConv, error: testError } = await supabase
        .from('conversations')
        .insert(testData)
        .select()
        .single();

      if (testError) {
        console.log('❌ Test failed:', testError.message);
      } else {
        console.log('✅ Table fix successful! Test conversation:', testConv.id);
        // Clean up test
        await supabase.from('conversations').delete().eq('id', testConv.id);
        console.log('🧹 Test conversation cleaned up');
      }
    }

  } catch (error) {
    console.error('Emergency fix failed:', error.message);
  }
}

emergencyTableFix();