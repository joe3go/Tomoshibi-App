// Test script to verify group chat functionality
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_DEV_URL || 'https://gsnnydemkpllycgzmalv.supabase.co',
  process.env.VITE_SUPABASE_DEV_SERVICE_KEY || process.env.VITE_SUPABASE_DEV_ANON_KEY
);

async function testGroupChatSystem() {
  console.log('Testing group chat system...');
  
  try {
    // Test 1: Check conversation_templates
    console.log('\n1. Testing conversation templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('conversation_templates')
      .select('*')
      .eq('mode', 'group');
    
    if (templatesError) {
      console.log('Templates error:', templatesError.message);
    } else {
      console.log(`✓ Found ${templates.length} group templates:`, templates.map(t => t.title));
    }
    
    // Test 2: Check conversation_participants table
    console.log('\n2. Testing conversation_participants table...');
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .select('id')
      .limit(1);
    
    if (participantsError) {
      console.log('Participants table error:', participantsError.message);
    } else {
      console.log('✓ conversation_participants table exists');
    }
    
    // Test 3: Check conversations table has mode column
    console.log('\n3. Testing conversations table mode column...');
    const { error: conversationsError } = await supabase
      .from('conversations')
      .select('id, mode')
      .limit(1);
    
    if (conversationsError) {
      console.log('Conversations mode column error:', conversationsError.message);
    } else {
      console.log('✓ conversations table has mode column');
    }
    
    // Test 4: Check personas exist for group templates
    console.log('\n4. Testing persona availability...');
    if (templates && templates.length > 0) {
      const allPersonaIds = templates.flatMap(t => t.default_personas || []);
      const uniquePersonaIds = [...new Set(allPersonaIds)];
      
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, name')
        .in('id', uniquePersonaIds);
      
      if (personasError) {
        console.log('Personas error:', personasError.message);
      } else {
        console.log(`✓ Found ${personas.length}/${uniquePersonaIds.length} required personas:`, 
          personas.map(p => p.name));
      }
    }
    
    console.log('\n✅ Group chat system test complete');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGroupChatSystem();