import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsnnydemkpllycgzmalv.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_DEV_SERVICE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function updateAvatarUrls() {
  console.log('Updating avatar URLs to use new SVG files...');

  try {
    const updates = [
      { name: 'Aoi', avatar_url: '/avatars/aoi.svg' },
      { name: 'Haruki', avatar_url: '/avatars/haruki.svg' },
      { name: 'Yuki', avatar_url: '/avatars/yuki.svg' },
      { name: 'Ren', avatar_url: '/avatars/ren.svg' }
    ];

    for (const update of updates) {
      const { data, error } = await supabase
        .from('personas')
        .update({ avatar_url: update.avatar_url })
        .eq('name', update.name)
        .select();

      if (error) {
        console.error(`Error updating ${update.name}:`, error);
      } else {
        console.log(`Updated ${update.name} avatar: ${update.avatar_url}`);
      }
    }

    console.log('Avatar URLs updated successfully!');

  } catch (error) {
    console.error('Update error:', error);
  }
}

updateAvatarUrls();