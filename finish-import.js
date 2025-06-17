import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://oyawpeylvdqfkhysnjsq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0'
);

function parseCSV(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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

async function finishRemainingLevels() {
  const remainingFiles = [
    { file: 'n3_1750040266417.csv', level: 'N3' },
    { file: 'n2_1750040266417.csv', level: 'N2' },
    { file: 'n1_1750040266417.csv', level: 'N1' }
  ];

  for (const { file, level } of remainingFiles) {
    if (!fs.existsSync(file)) continue;
    
    // Check if level already has data
    const { count } = await supabase
      .from('jlpt_vocab')
      .select('*', { count: 'exact', head: true })
      .eq('jlpt_level', level);
      
    if (count > 100) {
      console.log(`${level} already imported (${count} words)`);
      continue;
    }
    
    console.log(`Completing ${level} import...`);
    
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split('\n').slice(1).filter(line => line.trim());
    
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < Math.min(lines.length, 1000); i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const vocabItems = [];
      
      for (const line of batch) {
        const [kanji, hiragana, english, tags] = parseCSV(line);
        if (hiragana && english) {
          vocabItems.push({
            kanji: kanji || null,
            hiragana: hiragana.trim(),
            english_meaning: english.trim(),
            jlpt_level: level,
            word_type: tags?.includes('verb') ? 'verb' : 
                      tags?.includes('noun') ? 'noun' : 
                      tags?.includes('adj') ? 'adjective' : 'other'
          });
        }
      }
      
      if (vocabItems.length > 0) {
        const { error } = await supabase.from('jlpt_vocab').insert(vocabItems);
        if (!error) {
          imported += vocabItems.length;
          console.log(`${level}: ${imported} words`);
        }
      }
    }
  }
  
  // Final verification
  const { data: final } = await supabase
    .from('jlpt_vocab')
    .select('jlpt_level');
    
  if (final) {
    const counts = final.reduce((acc, item) => {
      acc[item.jlpt_level] = (acc[item.jlpt_level] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nFinal vocabulary database:');
    ['N1', 'N2', 'N3', 'N4', 'N5'].forEach(level => {
      console.log(`${level}: ${counts[level] || 0} words`);
    });
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`Total: ${total} words imported to Supabase`);
  }
}

finishRemainingLevels().catch(console.error);