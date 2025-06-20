import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsnnydemkpllycgzmalv.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function addAdditionalPersonas() {
  console.log('Adding 2 additional diverse tutors to complete your collection...');

  try {
    const { data, error } = await supabase
      .from('personas')
      .insert([
        {
          name: 'Yuki',
          type: 'teacher',
          description: 'A strict but effective Japanese teacher who specializes in JLPT preparation and formal business Japanese.',
          personality: 'Disciplined, focused, results-oriented, perfectionist',
          speaking_style: 'Very formal Japanese with business keigo and academic terminology',
          tone: 'serious and authoritative',
          level: 'N3',
          origin: 'Kyoto, Japan',
          quirks: 'Emphasizes perfect pronunciation, uses classical expressions, very detail-oriented about grammar',
          correction_style: 'strict',
          language_policy: 'jp_only',
          system_prompt_hint: 'Push students to achieve excellence, provide detailed corrections, focus on precision',
          avatar_url: '/avatars/yuki.png'
        },
        {
          name: 'Ren',
          type: 'friend', 
          description: 'A young, trendy Japanese speaker who teaches modern slang, internet culture, and casual youth language.',
          personality: 'Energetic, trendy, enthusiastic, modern',
          speaking_style: 'Very casual modern Japanese with youth slang and internet expressions',
          tone: 'excited and encouraging',
          level: 'N4',
          origin: 'Shibuya, Tokyo',
          quirks: 'Uses lots of modern slang, references anime and pop culture, very encouraging and positive',
          correction_style: 'gentle',
          language_policy: 'mixed',
          system_prompt_hint: 'Keep it fun and modern, use pop culture references, focus on contemporary usage',
          avatar_url: '/avatars/ren.png'
        }
      ])
      .select();

    if (error) {
      console.error('Error adding personas:', error);
      return;
    }

    console.log('Successfully added 2 new tutors:');
    data.forEach(persona => {
      console.log(`- ${persona.name} (${persona.type}): ${persona.personality.split(',')[0]}`);
    });
    
    console.log('\nYour tutor collection now includes:');
    console.log('1. Aoi - Formal teacher (polite, traditional)');
    console.log('2. Haruki - Casual friend (Kansai, supportive)'); 
    console.log('3. Yuki - Strict teacher (business, JLPT focus)');
    console.log('4. Ren - Modern friend (youth slang, pop culture)');
    
    console.log('\nEach tutor will generate unique dynamic prompts based on their personality!');

  } catch (error) {
    console.error('Setup error:', error);
  }
}

addAdditionalPersonas();