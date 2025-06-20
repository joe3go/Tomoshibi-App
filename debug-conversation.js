import { createClient } from '@supabase/supabase-js';

async function debugConversation() {
  const supabase = createClient(
    'https://oyawpeylvdqfkhysnjsq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0'
  );

  console.log('Testing conversation lookup...');
  
  // Test 1: Get all conversations
  const { data: allConversations, error: allError } = await supabase
    .from('conversations')
    .select('*');
    
  console.log('All conversations:', allConversations);
  console.log('All conversations error:', allError);
  
  // Test 2: Get specific conversation by ID
  const { data: singleConversation, error: singleError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', 5)
    .single();
    
  console.log('Single conversation (ID 5):', singleConversation);
  console.log('Single conversation error:', singleError);
  
  // Test 3: Get conversation without single()
  const { data: conversationArray, error: arrayError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', 5);
    
  console.log('Conversation as array:', conversationArray);
  console.log('Array error:', arrayError);
}

debugConversation().catch(console.error);