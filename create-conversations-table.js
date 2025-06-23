import { createClient } from '@supabase/supabase-js';

async function createConversationsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_DEV_URL;
  const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Creating conversations table with proper UUID schema...');

  // Create a properly structured conversation record to define the schema
  try {
    // Get test data
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: personas } = await supabase.from('personas').select('id').limit(1);
    
    if (!users.users || !personas || users.users.length === 0 || personas.length === 0) {
      console.log('No users or personas found for schema creation');
      return;
    }

    const testUserId = users.users[0].id;
    const testPersonaId = personas[0].id;

    // Generate a UUID for the conversation
    const conversationId = crypto.randomUUID();

    console.log('Creating conversation with proper structure...');

    // Try to create with the required structure - this will fail if columns don't exist
    // but will help us understand what we need to recreate
    const conversationData = {
      id: conversationId,
      user_id: testUserId,
      persona_id: testPersonaId,
      scenario_id: null,
      title: 'Test Schema Conversation',
      phase: 'greeting',
      status: 'active',
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (createError) {
      console.log('Schema creation failed:', createError.message);
      console.log('Required manual table creation in Supabase Dashboard');
      console.log('SQL for conversations table:');
      console.log(`
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
      `);
      return;
    }

    console.log('Success! Conversation created:', newConv.id);
    
    // Clean up test conversation
    await supabase.from('conversations').delete().eq('id', newConv.id);
    console.log('Test conversation cleaned up');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createConversationsTable();