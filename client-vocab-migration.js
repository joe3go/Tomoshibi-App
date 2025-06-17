// Client-side vocabulary migration using Supabase client
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://oyawpeylvdqfkhysnjsq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV with proper quote handling
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

async function migrateVocabulary() {
  const files = [
    { file: 'n5_1750040231090.csv', level: 'N5' },
    { file: 'n4_1750040266417.csv', level: 'N4' },
    { file: 'n3_1750040266417.csv', level: 'N3' },
    { file: 'n2_1750040266417.csv', level: 'N2' },
    { file: 'n1_1750040266417.csv', level: 'N1' }
  ];

  let totalMigrated = 0;

  for (const { file, level } of files) {
    if (!fs.existsSync(file)) {
      console.log(`Skipping ${file} - not found`);
      continue;
    }

    console.log(`Processing ${level} vocabulary from ${file}...`);
    
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    const vocabLines = lines.slice(1); // Skip header
    
    const batchSize = 50;
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
          hiragana: hiragana,
          english_meaning: englishMeaning,
          jlpt_level: level,
          word_type: determineWordType(tags)
        });
      }
      
      if (vocabItems.length > 0) {
        const { data, error } = await supabase
          .from('jlpt_vocab')
          .upsert(vocabItems, { onConflict: 'hiragana,jlpt_level' });
        
        if (error) {
          console.error(`Error inserting ${level} batch:`, error.message);
        } else {
          totalMigrated += vocabItems.length;
          console.log(`✓ Migrated batch for ${level}: ${vocabItems.length} words`);
        }
      }
    }
  }
  
  console.log(`Migration completed! Total vocabulary entries: ${totalMigrated}`);
  
  // Verify migration
  const { data: counts } = await supabase
    .from('jlpt_vocab')
    .select('jlpt_level')
    .then(result => {
      if (result.data) {
        const levelCounts = result.data.reduce((acc, item) => {
          acc[item.jlpt_level] = (acc[item.jlpt_level] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\nVocabulary by level in Supabase:');
        Object.entries(levelCounts).forEach(([level, count]) => {
          console.log(`  ${level}: ${count} words`);
        });
      }
      return result;
    });
}

migrateVocabulary().catch(console.error);