import { createClient } from '@supabase/supabase-js';

async function setupConversationsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_DEV_URL;
  const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('🔧 Setting up conversations table with UUID schema...');

  try {
    // Step 1: Clear existing conversations
    console.log('1. Clearing existing conversations...');
    await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Step 2: Check if table needs to be recreated by testing insert
    console.log('2. Testing current table structure...');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: personas } = await supabase.from('personas').select('id').limit(1);
    
    if (!users.users || !personas || users.users.length === 0 || personas.length === 0) {
      console.log('❌ No users or personas found for testing');
      return;
    }

    const testUserId = users.users[0].id;
    const testPersonaId = personas[0].id;

    // Try to insert with new schema
    const { data: testConv, error: insertError } = await supabase
      .from('conversations')
      .insert({
        user_id: testUserId,
        persona_id: testPersonaId,
        title: 'Schema Test',
        status: 'active',
        phase: 'greeting'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Current schema is incompatible:', insertError.message);
      console.log('📋 The table needs to be recreated manually in Supabase Dashboard');
      console.log('🔧 Required columns for conversations table:');
      console.log('   - id: UUID (Primary Key, default: gen_random_uuid())');
      console.log('   - user_id: UUID (Foreign Key to auth.users)');
      console.log('   - persona_id: UUID (Foreign Key to personas)');
      console.log('   - scenario_id: UUID (nullable)');
      console.log('   - title: TEXT');
      console.log('   - phase: TEXT (default: "greeting")');
      console.log('   - status: TEXT (default: "active")');
      console.log('   - started_at: TIMESTAMPTZ (default: NOW())');
      console.log('   - completed_at: TIMESTAMPTZ (nullable)');
      console.log('   - created_at: TIMESTAMPTZ (default: NOW())');
      console.log('   - updated_at: TIMESTAMPTZ (default: NOW())');
      
      return;
    } else {
      console.log('✅ Schema test successful! Conversation created:', testConv.id);
      
      // Clean up test conversation
      await supabase.from('conversations').delete().eq('id', testConv.id);
      console.log('🧹 Test conversation cleaned up');
    }

    console.log('✅ Conversations table is properly configured');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupConversationsTable();