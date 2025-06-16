
import fs from 'fs';
import path from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import ws from 'ws';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Ensure the database URL has proper SSL configuration
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Add SSL mode if not present
const finalDatabaseUrl = databaseUrl.includes('?') 
  ? `${databaseUrl}&sslmode=require`
  : `${databaseUrl}?sslmode=require`;

// Database connection with WebSocket support
const pool = new Pool({ 
  connectionString: finalDatabaseUrl,
  ssl: true
});

// Function to parse CSV line with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
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
  
  return result.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
}

// Function to determine word type from tags
function determineWordType(tags) {
  if (!tags) return 'noun';
  
  const tagLower = tags.toLowerCase();
  if (tagLower.includes('verb') || tagLower.includes('v-')) {
    return 'verb';
  } else if (tagLower.includes('adj') || tagLower.includes('い-adj') || tagLower.includes('な-adj')) {
    return 'adjective';
  } else if (tagLower.includes('adv')) {
    return 'adverb';
  } else if (tagLower.includes('particle')) {
    return 'particle';
  } else if (tagLower.includes('expression') || tagLower.includes('exp')) {
    return 'expression';
  } else if (tagLower.includes('number') || tagLower.includes('num')) {
    return 'number';
  }
  return 'noun'; // default
}

// Function to process a JLPT level CSV file
async function processJLPTFile(filename, level) {
  const rootDir = path.join(__dirname, '..');
  
  // Try multiple possible locations for the CSV files
  const possiblePaths = [
    path.join(rootDir, `${level.toLowerCase()}.csv`),
    path.join(rootDir, `${level.toLowerCase()}_1750040266417.csv`),
    path.join(rootDir, `${level.toLowerCase()}_1750040231090.csv`),
    path.join(rootDir, 'attached_assets', `${level.toLowerCase()}_1750040266417.csv`),
    path.join(rootDir, 'attached_assets', `${level.toLowerCase()}_1750040231090.csv`)
  ];

  let filePath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      filePath = testPath;
      console.log(`✅ Found file: ${testPath}`);
      break;
    }
  }

  if (!filePath) {
    console.log(`⚠️  No CSV file found for ${level}, skipping...`);
    return 0;
  }

  console.log(`📄 Processing ${filePath} for level ${level}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log(`⚠️  File ${level} is empty, skipping...`);
    return 0;
  }
  
  // Skip header line if it exists
  let dataLines = lines;
  if (lines.length > 0 && (lines[0].includes('expression') || lines[0].includes('kanji') || lines[0].includes('reading'))) {
    dataLines = lines.slice(1);
    console.log(`📋 Skipped header line: ${lines[0]}`);
  }
  
  if (dataLines.length === 0) {
    console.log(`⚠️  No data lines found in ${level} after header, skipping...`);
    return 0;
  }
  
  console.log(`🔄 Processing ${dataLines.length} data lines for ${level}...`);
  
  const vocabEntries = [];
  let processedCount = 0;
  
  for (const [index, line] of dataLines.entries()) {
    if (!line.trim()) continue;
    
    try {
      const columns = parseCSVLine(line);
      
      if (columns.length >= 3) {
        const expression = columns[0] || '';
        const reading = columns[1] || '';
        const meaning = columns[2] || '';
        const tags = columns[3] || '';
        
        // Skip empty entries
        if (!expression && !reading && !meaning) continue;
        
        // Clean up the data
        const kanji = expression && expression !== reading && expression.match(/[\u4e00-\u9faf]/) ? expression : null;
        const hiragana = reading || expression;
        const englishMeaning = meaning || 'No meaning provided';
        const wordType = determineWordType(tags);
        
        vocabEntries.push({
          kanji,
          hiragana,
          englishMeaning,
          jlptLevel: level,
          wordType
        });
        
        processedCount++;
      }
    } catch (error) {
      console.log(`❌ Error parsing line ${index + 1} in ${level}: ${error.message}`);
    }
  }
  
  if (vocabEntries.length === 0) {
    console.log(`⚠️  No valid vocabulary entries found in ${level}`);
    return 0;
  }
  
  // Insert in batches of 100
  const batchSize = 100;
  let insertedCount = 0;
  
  for (let i = 0; i < vocabEntries.length; i += batchSize) {
    const batch = vocabEntries.slice(i, i + batchSize);
    const values = batch.map(entry => {
      const kanjiVal = entry.kanji ? `'${entry.kanji.replace(/'/g, "''")}'` : 'NULL';
      const hiraganaVal = `'${entry.hiragana.replace(/'/g, "''")}'`;
      const meaningVal = `'${entry.englishMeaning.replace(/'/g, "''")}'`;
      const levelVal = `'${entry.jlptLevel}'`;
      const typeVal = `'${entry.wordType}'`;
      
      return `(${kanjiVal}, ${hiraganaVal}, ${meaningVal}, ${levelVal}, ${typeVal})`;
    }).join(',\n');
    
    const query = `
      INSERT INTO jlpt_vocab (kanji, hiragana, english_meaning, jlpt_level, word_type) 
      VALUES ${values}
      ON CONFLICT DO NOTHING;
    `;
    
    try {
      const result = await pool.query(query);
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} for ${level} (${batch.length} entries)`);
    } catch (error) {
      console.error(`❌ Error inserting batch for ${level}:`, error.message);
    }
  }
  
  console.log(`📊 ${level} Summary: Processed ${processedCount} entries, attempted to insert ${insertedCount}`);
  return processedCount;
}

// Main function to load all vocabulary data
async function loadVocabularyData() {
  try {
    console.log('🚀 Starting vocabulary data import...');
    console.log(`🔗 Connecting to database: ${finalDatabaseUrl.split('@')[1]?.split('?')[0] || 'Unknown'}`);
    
    // Test connection first
    console.log('🔍 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Clear existing vocabulary data
    console.log('\n🗑️  Clearing existing vocabulary data...');
    await pool.query('DELETE FROM jlpt_vocab;');
    console.log('✅ Cleared existing data');
    
    const levels = [
      { file: 'n5.csv', level: 'N5' },
      { file: 'n4.csv', level: 'N4' },
      { file: 'n3.csv', level: 'N3' },
      { file: 'n2.csv', level: 'N2' },
      { file: 'n1.csv', level: 'N1' }
    ];

    let totalProcessed = 0;
    
    for (const { file, level } of levels) {
      const count = await processJLPTFile(file, level);
      totalProcessed += count;
    }

    console.log(`\n✅ Vocabulary import completed!`);
    console.log(`📊 Total entries processed: ${totalProcessed}`);
    
    // Get final counts by level
    const result = await pool.query(`
      SELECT jlpt_level, COUNT(*) as count 
      FROM jlpt_vocab 
      GROUP BY jlpt_level 
      ORDER BY CASE jlpt_level
        WHEN 'N5' THEN 1
        WHEN 'N4' THEN 2
        WHEN 'N3' THEN 3
        WHEN 'N2' THEN 4
        WHEN 'N1' THEN 5
        ELSE 6
      END;
    `);
    
    console.log('\n📈 Final vocabulary counts by level:');
    result.rows.forEach(row => {
      console.log(`   ${row.jlpt_level}: ${row.count} words`);
    });
    
  } catch (error) {
    console.error('❌ Error loading vocabulary data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the import
loadVocabularyData();
