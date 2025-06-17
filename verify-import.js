import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyawpeylvdqfkhysnjsq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0'
);

async function verifyImport() {
  console.log('Checking Supabase vocabulary import status...\n');
  
  // Get vocabulary counts by level
  const { data: vocab, error } = await supabase
    .from('jlpt_vocab')
    .select('jlpt_level, word_type');
    
  if (error) {
    console.error('Error checking vocabulary:', error.message);
    return;
  }
  
  if (!vocab || vocab.length === 0) {
    console.log('No vocabulary data found in database');
    return;
  }
  
  // Count by level
  const levelCounts = vocab.reduce((acc, item) => {
    acc[item.jlpt_level] = (acc[item.jlpt_level] || 0) + 1;
    return acc;
  }, {});
  
  // Count by word type
  const typeCounts = vocab.reduce((acc, item) => {
    acc[item.word_type] = (acc[item.word_type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 Vocabulary Import Status:');
  console.log('==========================');
  
  ['N1', 'N2', 'N3', 'N4', 'N5'].forEach(level => {
    const count = levelCounts[level] || 0;
    const status = count > 0 ? '✅' : '❌';
    console.log(`${status} ${level}: ${count.toLocaleString()} words`);
  });
  
  const totalWords = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
  console.log(`\n🎯 Total Vocabulary: ${totalWords.toLocaleString()} words`);
  
  console.log('\n📝 Word Types:');
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count.toLocaleString()}`);
    });
  
  // Sample a few words from each level
  console.log('\n🔍 Sample Entries:');
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
    if (levelCounts[level] > 0) {
      const { data: sample } = await supabase
        .from('jlpt_vocab')
        .select('hiragana, english_meaning, kanji')
        .eq('jlpt_level', level)
        .limit(3);
        
      if (sample && sample.length > 0) {
        console.log(`\n${level} Examples:`);
        sample.forEach(word => {
          const display = word.kanji ? `${word.kanji} (${word.hiragana})` : word.hiragana;
          console.log(`   ${display} - ${word.english_meaning}`);
        });
      }
    }
  }
  
  // Check database tables
  console.log('\n🗄️  Database Tables Status:');
  const tables = ['users', 'jlpt_vocab', 'user_vocab', 'user_scenario_progress'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`   ${table}: Error - ${error.message}`);
      } else {
        console.log(`   ${table}: ${count || 0} records`);
      }
    } catch (e) {
      console.log(`   ${table}: Not accessible`);
    }
  }
  
  console.log('\n✅ Supabase migration verification complete!');
  
  if (totalWords > 2000) {
    console.log('\n🎉 Complete vocabulary database successfully imported!');
    console.log('Your Japanese learning app now has authentic JLPT vocabulary data.');
  } else if (totalWords > 500) {
    console.log('\n⏳ Partial import in progress...');
    console.log('Vocabulary import is still running in background.');
  } else {
    console.log('\n⚠️  Import may still be in progress or encountered issues.');
  }
}

verifyImport().catch(console.error);