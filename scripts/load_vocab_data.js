
const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Function to escape SQL strings
function escapeSql(str) {
  if (!str || str === 'NULL') return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

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
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filename} not found, skipping...`);
    return 0;
  }

  console.log(`Processing ${filename} for level ${level}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header line if it exists
  let dataLines = lines;
  if (lines.length > 0 && (lines[0].includes('expression') || lines[0].includes('kanji'))) {
    dataLines = lines.slice(1);
  }
  
  const vocabEntries = [];
  let processedCount = 0;
  
  dataLines.forEach((line, index) => {
    if (!line.trim()) return;
    
    try {
      const columns = parseCSVLine(line);
      
      if (columns.length >= 3) {
        const expression = columns[0] || '';
        const reading = columns[1] || '';
        const meaning = columns[2] || '';
        const tags = columns[3] || '';
        
        // Skip empty entries
        if (!expression && !reading) return;
        
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
      console.log(`Error parsing line ${index + 1} in ${filename}: ${error.message}`);
    }
  });
  
  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < vocabEntries.length; i += batchSize) {
    const batch = vocabEntries.slice(i, i + batchSize);
    const values = batch.map(entry => 
      `(${escapeSql(entry.kanji)}, ${escapeSql(entry.hiragana)}, ${escapeSql(entry.englishMeaning)}, '${entry.jlptLevel}', '${entry.wordType}')`
    ).join(',\n');
    
    const query = `
      INSERT INTO jlpt_vocab (kanji, hiragana, english_meaning, jlpt_level, word_type) 
      VALUES ${values}
      ON CONFLICT DO NOTHING;
    `;
    
    try {
      await pool.query(query);
      console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} for ${level} (${batch.length} entries)`);
    } catch (error) {
      console.error(`Error inserting batch for ${level}:`, error.message);
    }
  }
  
  console.log(`Processed ${processedCount} entries from ${filename}`);
  return processedCount;
}

// Main function to load all vocabulary data
async function loadVocabularyData() {
  try {
    console.log('Starting vocabulary data import...');
    
    // Clear existing vocabulary data
    console.log('Clearing existing vocabulary data...');
    await pool.query('DELETE FROM jlpt_vocab;');
    
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

    // Insert basic grammar patterns
    console.log('Adding basic grammar patterns...');
    await pool.query(`
      DELETE FROM jlpt_grammar;
      
      INSERT INTO jlpt_grammar (pattern, meaning, jlpt_level, example_sentence, example_translation) VALUES
      ('だ/である', 'To be (assertion)', 'N5', '私は学生だ。', 'I am a student.'),
      ('です/ます', 'Polite form', 'N5', '私は学生です。', 'I am a student.'),
      ('か', 'Question particle', 'N5', 'あなたは学生ですか。', 'Are you a student?'),
      ('が', 'Subject particle', 'N5', '私が学生です。', 'I am the student.'),
      ('を', 'Object particle', 'N5', 'りんごを食べます。', 'I eat an apple.'),
      ('に', 'Direction/Time particle', 'N5', '学校に行きます。', 'I go to school.'),
      ('で', 'Location/Method particle', 'N5', '図書館で勉強します。', 'I study at the library.'),
      ('と', 'And/With particle', 'N5', '友達と映画を見ます。', 'I watch a movie with friends.'),
      ('の', 'Possessive particle', 'N5', '私の本です。', 'It is my book.'),
      ('は', 'Topic particle', 'N5', '私は日本人です。', 'I am Japanese.');
    `);

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
  } finally {
    await pool.end();
  }
}

// Run the import
loadVocabularyData();
