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

async function importVocab() {
  console.log('Starting vocabulary import to Supabase...');
  
  // Import N5 sample first
  if (fs.existsSync('n5_1750040231090.csv')) {
    const data = fs.readFileSync('n5_1750040231090.csv', 'utf-8');
    const lines = data.split('\n').slice(1, 11); // First 10 entries
    
    const vocabItems = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const [kanji, hiragana, english, tags] = parseCSV(line);
      
      if (hiragana && english) {
        vocabItems.push({
          kanji: kanji || null,
          hiragana,
          english_meaning: english,
          jlpt_level: 'N5',
          word_type: 'noun'
        });
      }
    }
    
    const { data: result, error } = await supabase
      .from('jlpt_vocab')
      .insert(vocabItems);
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log(`Successfully imported ${vocabItems.length} N5 vocabulary entries`);
    }
  }
  
  // Test user_vocab table
  const { data: userVocab, error: userError } = await supabase
    .from('user_vocab')
    .insert([{
      word: 'こんにちは',
      reading: 'こんにちは',
      meaning: 'hello',
      source: 'migration'
    }]);
    
  if (userError) {
    console.log('User vocab error:', userError.message);
  } else {
    console.log('User vocab test successful');
  }
  
  console.log('Migration completed');
}

importVocab().catch(console.error);