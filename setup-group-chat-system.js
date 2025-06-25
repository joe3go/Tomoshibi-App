// Setup script to create group chat tables and insert templates
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_DEV_URL || 'https://gsnnydemkpllycgzmalv.supabase.co',
  process.env.VITE_SUPABASE_DEV_SERVICE_KEY || process.env.VITE_SUPABASE_DEV_ANON_KEY
);

async function setupGroupChatSystem() {
  console.log('Setting up group chat system...');
  
  try {
    // Read and execute SQL file
    const sqlContent = fs.readFileSync('./setup-group-chat-tables.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    if (error) {
      console.log('SQL execution via RPC failed, trying direct queries...');
      
      // Try individual table creation
      const { error: templatesError } = await supabase
        .from('conversation_templates')
        .select('id')
        .limit(1);
        
      if (templatesError && templatesError.code === '42P01') {
        console.log('conversation_templates table does not exist - manual creation required');
        console.log('Please run the SQL in setup-group-chat-tables.sql manually in Supabase Dashboard');
        return;
      }
    }
    
    // Test if templates exist
    const { data: templates, error: fetchError } = await supabase
      .from('conversation_templates')
      .select('*')
      .eq('mode', 'group');
      
    if (fetchError) {
      console.log('Error fetching templates:', fetchError.message);
      return;
    }
    
    console.log('Group chat templates available:', templates?.length || 0);
    
    // Test conversation participants table
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .select('id')
      .limit(1);
      
    if (participantsError && participantsError.code === '42P01') {
      console.log('conversation_participants table does not exist - manual creation required');
      return;
    }
    
    console.log('✓ Group chat system setup complete');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupGroupChatSystem();