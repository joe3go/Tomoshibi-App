const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gsnnydemkpllycgzmalv.supabase.co',
  process.env.VITE_SUPABASE_DEV_SERVICE_KEY
);

async function setupConversationsTable() {
  console.log('Setting up conversations table with direct approach...');
  
  try {
    // First, create a test conversation to understand the current schema
    console.log('Testing current schema...');
    
    // Check if we can create a conversation with integer user_id
    const testUserId = 1; // Use integer instead of UUID
    
    const { data: testData, error: testError } = await supabase
      .from('conversations')
      .insert({
        user_id: testUserId,
        persona_id: 6,
        scenario_id: null,
        status: 'active'
      })
      .select()
      .single();

    if (testError) {
      console.log('Current table structure incompatible:', testError.message);
      
      // Since we can't modify the table structure, let's work with what we have
      // We'll need to create a mapping between UUID users and integer IDs
      console.log('Creating user mapping approach...');
      
      // For now, let's use a simple hash function to convert UUID to integer
      const uuidToInt = (uuid) => {
        // Simple hash function to convert UUID to integer
        let hash = 0;
        for (let i = 0; i < uuid.length; i++) {
          const char = uuid.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
      };
      
      const mappedUserId = uuidToInt('4c54ce90-b1cc-421d-a6cc-a169f83c06fd');
      console.log('Mapped user ID:', mappedUserId);
      
      // Try with mapped ID
      const { data: mappedData, error: mappedError } = await supabase
        .from('conversations')
        .insert({
          user_id: mappedUserId,
          persona_id: 6,
          scenario_id: null,
          status: 'active'
        })
        .select()
        .single();

      if (mappedError) {
        console.error('Mapped approach failed:', mappedError);
      } else {
        console.log('✅ Conversation created with mapped ID:', mappedData.id);
        
        // Clean up test
        await supabase.from('conversations').delete().eq('id', mappedData.id);
        console.log('Test conversation cleaned up');
      }
      
    } else {
      console.log('✅ Test conversation created:', testData.id);
      
      // Clean up test
      await supabase.from('conversations').delete().eq('id', testData.id);
      console.log('Test conversation cleaned up');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupConversationsTable();