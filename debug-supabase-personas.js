import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsnnydemkpllycgzmalv.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function debugSupabasePersonas() {
  console.log('Debugging Supabase personas table...');
  
  try {
    // Check table structure
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'personas' })
      .select();
      
    if (schemaError) {
      console.log('Schema check failed, trying direct query...');
    } else {
      console.log('Table columns:', columns);
    }
    
    // Try direct count
    const { count, error: countError } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Count error:', countError);
    } else {
      console.log('Total personas in table:', count);
    }
    
    // Try simple select with error details
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*');
      
    if (error) {
      console.error('Query error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Personas found:', personas?.length || 0);
      if (personas && personas.length > 0) {
        console.log('Sample persona:', personas[0]);
      }
    }
    
    // Try inserting a test persona
    console.log('Testing insert...');
    const { data: insertedPersona, error: insertError } = await supabase
      .from('personas')
      .insert({
        name: 'Test Tutor',
        type: 'teacher',
        description: 'Test persona for debugging'
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Successfully inserted test persona:', insertedPersona);
      
      // Clean up test persona
      await supabase
        .from('personas')
        .delete()
        .eq('id', insertedPersona.id);
      console.log('Cleaned up test persona');
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugSupabasePersonas();