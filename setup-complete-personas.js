import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsnnydemkpllycgzmalv.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;

if (!serviceKey) {
  console.error('Missing VITE_SUPABASE_DEV_SERVICE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupCompletePersonas() {
  console.log('Setting up complete personas table with enhanced tutor data...');

  try {
    // First, ensure the table has all required columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE personas 
        ADD COLUMN IF NOT EXISTS tone TEXT,
        ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'N5',
        ADD COLUMN IF NOT EXISTS origin TEXT,
        ADD COLUMN IF NOT EXISTS quirks TEXT,
        ADD COLUMN IF NOT EXISTS correction_style TEXT DEFAULT 'gentle',
        ADD COLUMN IF NOT EXISTS language_policy TEXT DEFAULT 'mixed',
        ADD COLUMN IF NOT EXISTS system_prompt_hint TEXT;
      `
    });

    if (alterError) {
      console.log('Note: Could not alter table structure (may already exist):', alterError.message);
    }

    // Clear existing personas
    const { error: deleteError } = await supabase
      .from('personas')
      .delete()
      .neq('id', 0); // Delete all

    if (deleteError) {
      console.error('Error clearing personas:', deleteError);
    }

    // Insert comprehensive tutor data
    const { data, error } = await supabase
      .from('personas')
      .insert([
        {
          name: 'Aoi',
          type: 'teacher',
          description: 'A formal Japanese teacher who uses polite language and focuses on proper grammar structure with cultural context.',
          personality: 'Professional, patient, encouraging, detail-oriented',
          speaking_style: 'Formal Japanese with keigo (polite language)',
          tone: 'polite and encouraging',
          level: 'N5',
          origin: 'Tokyo, Japan',
          quirks: 'Always uses proper keigo, provides cultural context, emphasizes respect and politeness',
          correction_style: 'gentle',
          language_policy: 'mixed',
          system_prompt_hint: 'Focus on building confidence through encouragement while maintaining proper Japanese etiquette',
          avatar_url: '/avatars/aoi.png'
        },
        {
          name: 'Haruki',
          type: 'friend', 
          description: 'A casual friend who speaks in informal Japanese and helps with everyday conversation practice.',
          personality: 'Friendly, relaxed, supportive, outgoing',
          speaking_style: 'Casual Japanese with colloquialisms and modern expressions',
          tone: 'casual and friendly',
          level: 'N5',
          origin: 'Osaka, Japan',
          quirks: 'Uses Kansai dialect occasionally, very encouraging, likes to share cultural insights about modern Japan',
          correction_style: 'on_request',
          language_policy: 'jp_only',
          system_prompt_hint: 'Keep conversations natural and fun, focus on practical communication over perfect grammar',
          avatar_url: '/avatars/haruki.png'
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting enhanced personas:', error);
      return;
    }

    console.log('Successfully created enhanced personas:');
    data.forEach(persona => {
      console.log(`- ${persona.name} (${persona.type}): ${persona.personality}`);
    });
    
    console.log('\nPersonas setup complete with dynamic prompt system data!');
    console.log('Your tutors now have:');
    console.log('- Unique personalities and speaking styles');
    console.log('- Different correction approaches');  
    console.log('- Cultural backgrounds and quirks');
    console.log('- Secure prompt generation capabilities');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupCompletePersonas();