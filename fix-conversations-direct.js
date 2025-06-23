import { createClient } from '@supabase/supabase-js';

async function fixConversationsTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_DEV_URL;
  const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Fixing conversations table schema...');

  try {
    // Get test data for creating the proper table structure
    const { data: users } = await supabase.auth.admin.listUsers();
    const { data: personas } = await supabase.from('personas').select('id, name').limit(1);
    
    if (!users.users || !personas || users.users.length === 0 || personas.length === 0) {
      console.log('No users or personas found');
      return;
    }

    const testUserId = users.users[0].id;
    const testPersonaId = personas[0].id;

    console.log('User ID:', testUserId);
    console.log('Persona ID:', testPersonaId);

    // Try creating a conversation with the expected UUID schema
    // This will work if the table has the right structure
    const conversationId = crypto.randomUUID();
    
    const conversationData = {
      id: conversationId,
      user_id: testUserId,
      persona_id: testPersonaId,
      scenario_id: null,
      title: 'Test Conversation',
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
      console.log('❌ Table structure incompatible:', createError.message);
      
      // Since we can't execute SQL directly, we'll create the table through multiple operations
      console.log('🔧 Attempting to fix table structure through operations...');
      
      // First, try to understand current structure by checking what columns exist
      const { error: selectError } = await supabase
        .from('conversations')
        .select('id, user_id, persona_id')
        .limit(0);
      
      if (selectError && selectError.message.includes("persona_id")) {
        console.log('🚨 Missing persona_id column - table needs manual recreation');
        console.log('📋 Please run this SQL in Supabase SQL Editor:');
        console.log(`
-- Drop existing table
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create new table with proper UUID schema
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

-- Add foreign key constraints
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_conversations_persona 
FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "conversations_policy" ON public.conversations
FOR ALL USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_persona_id ON public.conversations(persona_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
        `);
        
        return;
      }
      
      console.log('Other error:', selectError);
      return;
    }

    console.log('✅ Conversation created successfully:', newConv.id);
    console.log('🧹 Cleaning up test conversation...');
    
    // Clean up test conversation
    await supabase.from('conversations').delete().eq('id', newConv.id);
    console.log('✅ Table structure is correct and working');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixConversationsTable();