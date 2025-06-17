import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Supabase connection
const supabasePool = new Pool({
  connectionString: "postgresql://postgres:85j1KMUjJ0cFi4Gn@db.oyawpeylvdqfkhysnjsq.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

// Function to parse CSV line with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
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

// Function to determine word type from tags
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

// Process JLPT vocabulary files
async function processVocabFiles() {
  const files = [
    { file: 'n5_1750040231090.csv', level: 'N5' },
    { file: 'n4_1750040266417.csv', level: 'N4' },
    { file: 'n3_1750040266417.csv', level: 'N3' },
    { file: 'n2_1750040266417.csv', level: 'N2' },
    { file: 'n1_1750040266417.csv', level: 'N1' }
  ];

  let totalInserted = 0;

  for (const { file, level } of files) {
    if (!fs.existsSync(file)) {
      console.log(`Skipping ${file} - file not found`);
      continue;
    }

    console.log(`Processing ${file} for level ${level}...`);
    
    const data = fs.readFileSync(file, 'utf-8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // Skip header line
    const vocabLines = lines.slice(1);
    
    let batchInserts = [];
    
    for (const line of vocabLines) {
      const columns = parseCSVLine(line);
      
      if (columns.length < 3) continue;
      
      const [kanji, hiragana, englishMeaning, tags] = columns;
      
      if (!hiragana || !englishMeaning) continue;
      
      const wordType = determineWordType(tags);
      
      batchInserts.push({
        kanji: kanji || null,
        hiragana: hiragana,
        english_meaning: englishMeaning,
        jlpt_level: level,
        word_type: wordType
      });
      
      // Insert in batches of 100
      if (batchInserts.length >= 100) {
        await insertBatch(batchInserts);
        totalInserted += batchInserts.length;
        batchInserts = [];
      }
    }
    
    // Insert remaining items
    if (batchInserts.length > 0) {
      await insertBatch(batchInserts);
      totalInserted += batchInserts.length;
    }
    
    console.log(`Completed ${file} - ${level}`);
  }
  
  console.log(`Migration completed! Total vocabulary entries: ${totalInserted}`);
}

async function insertBatch(vocabItems) {
  const client = await supabasePool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const item of vocabItems) {
      await client.query(`
        INSERT INTO jlpt_vocab (kanji, hiragana, english_meaning, jlpt_level, word_type)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (hiragana, jlpt_level) DO NOTHING
      `, [item.kanji, item.hiragana, item.english_meaning, item.jlpt_level, item.word_type]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch insert error:', error);
  } finally {
    client.release();
  }
}

// Run the migration
processVocabFiles()
  .then(() => {
    console.log('Vocabulary data migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });