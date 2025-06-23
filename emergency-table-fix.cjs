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
    // Since SQL execution methods aren't available, let's use a workaround
    // We'll try to create the table by inserting a record with all required fields
    // This will force Supabase to create the missing columns or show us what exists
    
    console.log('1. Attempting to create table structure through insert operation...');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: personas } = await supabase.from('personas').select('id').limit(1);
    
    if (!users.users || !personas || users.users.length === 0 || personas.length === 0) {
      console.log('No users or personas found');
      return;
    }

    const testUserId = users.users[0].id;
    const testPersonaId = personas[0].id;

    // Try to insert with the full schema we need
    const conversationData = {
      id: crypto.randomUUID(),
      user_id: testUserId,
      persona_id: testPersonaId,
      scenario_id: null,
      title: 'Schema Test',
      phase: 'greeting',
      status: 'active',
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('2. Testing conversation insert with full schema...');
    
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      
      if (insertError.message.includes('persona_id')) {
        console.log('📋 Missing persona_id column confirmed');
        console.log('🔧 Manual table recreation required');
        console.log('');
        console.log('Execute this SQL in Supabase Dashboard > SQL Editor:');
        console.log('');
        console.log('DROP TABLE IF EXISTS public.conversations CASCADE;');
        console.log('');
        console.log('CREATE TABLE public.conversations (');
        console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
        console.log('    user_id UUID NOT NULL,');
        console.log('    persona_id UUID NOT NULL,');
        console.log('    scenario_id UUID,');
        console.log('    title TEXT,');
        console.log('    phase TEXT DEFAULT \'greeting\',');
        console.log('    status TEXT DEFAULT \'active\',');
        console.log('    started_at TIMESTAMPTZ DEFAULT NOW(),');
        console.log('    completed_at TIMESTAMPTZ,');
        console.log('    created_at TIMESTAMPTZ DEFAULT NOW(),');
        console.log('    updated_at TIMESTAMPTZ DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('CREATE POLICY "conversations_policy" ON public.conversations');
        console.log('FOR ALL USING (auth.uid()::text = user_id::text);');
        console.log('');
        console.log('CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);');
        console.log('CREATE INDEX idx_conversations_persona_id ON public.conversations(persona_id);');
        console.log('CREATE INDEX idx_conversations_status ON public.conversations(status);');
        console.log('');
        console.log('GRANT ALL ON public.conversations TO authenticated;');
        console.log('GRANT ALL ON public.conversations TO service_role;');
        
        return;
      }
      
      console.log('Other insert error:', insertError);
      return;
    }

    console.log('✅ Conversation created successfully:', newConv.id);
    console.log('🧹 Cleaning up test conversation...');
    
    // Clean up test conversation
    await supabase.from('conversations').delete().eq('id', newConv.id);
    console.log('✅ Table structure is working correctly!');

  } catch (error) {
    console.error('Emergency fix failed:', error.message);
  }
}

emergencyTableFix();