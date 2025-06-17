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

async function importLevel(file, level) {
  if (!fs.existsSync(file)) {
    console.log(`File ${file} not found`);
    return 0;
  }

  console.log(`Starting ${level} import...`);
  
  const data = fs.readFileSync(file, 'utf-8');
  const lines = data.split('\n').filter(line => line.trim());
  const vocabLines = lines.slice(1);
  
  const batchSize = 50;
  let imported = 0;
  
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
      const { error } = await supabase
        .from('jlpt_vocab')
        .insert(vocabItems);
      
      if (!error) {
        imported += vocabItems.length;
        console.log(`${level}: ${imported} words imported`);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`${level} complete: ${imported} words`);
  return imported;
}

async function fastImport() {
  const levels = [
    { file: 'n4_1750040266417.csv', level: 'N4' },
    { file: 'n3_1750040266417.csv', level: 'N3' },
    { file: 'n2_1750040266417.csv', level: 'N2' },
    { file: 'n1_1750040266417.csv', level: 'N1' }
  ];

  let total = 0;
  
  for (const { file, level } of levels) {
    const count = await importLevel(file, level);
    total += count;
  }
  
  console.log(`Fast import completed: ${total} total words`);
  
  // Final count check
  const { data: final } = await supabase
    .from('jlpt_vocab')
    .select('jlpt_level');
    
  if (final) {
    const counts = final.reduce((acc, item) => {
      acc[item.jlpt_level] = (acc[item.jlpt_level] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nDatabase totals:');
    Object.entries(counts).forEach(([level, count]) => {
      console.log(`${level}: ${count} words`);
    });
  }
}

fastImport().catch(console.error);