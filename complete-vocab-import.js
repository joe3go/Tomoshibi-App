import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://oyawpeylvdqfkhysnjsq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0'
);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function determineWordType(tags) {
  if (!tags) return 'other';
  
  const tagLower = tags.toLowerCase();
  if (tagLower.includes('noun')) return 'noun';
  if (tagLower.includes('verb')) return 'verb';
  if (tagLower.includes('adjective') || tagLower.includes('adj')) return 'adjective';
  if (tagLower.includes('adverb')) return 'adverb';
  if (tagLower.includes('particle')) return 'particle';
  if (tagLower.includes('expression')) return 'expression';
  
  return 'other';
}

async function importAllVocabulary() {
  const files = [
    { file: 'n5_1750040231090.csv', level: 'N5' },
    { file: 'n4_1750040266417.csv', level: 'N4' },
    { file: 'n3_1750040266417.csv', level: 'N3' },
    { file: 'n2_1750040266417.csv', level: 'N2' },
    { file: 'n1_1750040266417.csv', level: 'N1' }
  ];

  let totalImported = 0;
  let errorCount = 0;

  // Clear existing data first
  console.log('Clearing existing vocabulary data...');
  const { error: deleteError } = await supabase
    .from('jlpt_vocab')
    .delete()
    .neq('id', 0); // Delete all records
    
  if (deleteError) {
    console.log('Note: Could not clear existing data:', deleteError.message);
  }

  for (const { file, level } of files) {
    if (!fs.existsSync(file)) {
      console.log(`Skipping ${file} - file not found`);
      continue;
    }

    console.log(`\nProcessing ${level} vocabulary from ${file}...`);
    
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const vocabLines = lines.slice(1); // Skip header
    
    console.log(`Found ${vocabLines.length} entries for ${level}`);
    
    // Process in smaller batches to avoid timeouts
    const batchSize = 25;
    let levelCount = 0;
    
    for (let i = 0; i < vocabLines.length; i += batchSize) {
      const batch = vocabLines.slice(i, i + batchSize);
      const vocabItems = [];
      
      for (const line of batch) {
        const columns = parseCSVLine(line);
        if (columns.length < 3) continue;
        
        const [kanji, hiragana, englishMeaning, tags] = columns;
        if (!hiragana || !englishMeaning) continue;
        
        vocabItems.push({
          kanji: kanji || null,
          hiragana: hiragana.trim(),
          english_meaning: englishMeaning.trim(),
          jlpt_level: level,
          word_type: determineWordType(tags)
        });
      }
      
      if (vocabItems.length > 0) {
        const { data: result, error } = await supabase
          .from('jlpt_vocab')
          .insert(vocabItems);
        
        if (error) {
          console.log(`Error in ${level} batch ${Math.floor(i/batchSize) + 1}:`, error.message);
          errorCount++;
        } else {
          levelCount += vocabItems.length;
          totalImported += vocabItems.length;
          
          // Progress indicator
          const progress = Math.floor((i + batchSize) / vocabLines.length * 100);
          console.log(`${level}: ${progress}% complete (${levelCount} words imported)`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✓ Completed ${level}: ${levelCount} words imported`);
  }
  
  console.log(`\n🎉 Complete vocabulary import finished!`);
  console.log(`Total vocabulary entries imported: ${totalImported}`);
  console.log(`Errors encountered: ${errorCount}`);
  
  // Verify the import
  console.log('\nVerifying import...');
  const { data: counts } = await supabase
    .from('jlpt_vocab')
    .select('jlpt_level');
    
  if (counts) {
    const levelCounts = counts.reduce((acc, item) => {
      acc[item.jlpt_level] = (acc[item.jlpt_level] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nFinal vocabulary counts in Supabase:');
    ['N5', 'N4', 'N3', 'N2', 'N1'].forEach(level => {
      const count = levelCounts[level] || 0;
      console.log(`  ${level}: ${count} words`);
    });
    
    const total = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
    console.log(`  Total: ${total} words`);
  }
}

importAllVocabulary().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});