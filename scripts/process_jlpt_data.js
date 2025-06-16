
const fs = require('fs');
const path = require('path');

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Function to parse CSV line
function parseCSVLine(line) {
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

// Function to process a JLPT level CSV file
function processJLPTFile(filename, level) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filename} not found, skipping...`);
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  let sqlStatements = '';
  
  dataLines.forEach((line, index) => {
    if (!line.trim()) return;
    
    try {
      const columns = parseCSVLine(line);
      
      if (columns.length >= 2) {
        // Expected format: expression,reading,meaning,part_of_speech
        const expression = columns[0] || '';
        const reading = columns[1] || '';
        const meaning = columns[2] || '';
        const partOfSpeech = columns[3] || '';
        
        // Clean up the data
        const kanji = expression && expression !== reading ? expression : null;
        const hiragana = reading || expression;
        const englishMeaning = meaning || 'No meaning provided';
        
        // Determine word type from part of speech
        let wordType = 'noun'; // default
        if (partOfSpeech) {
          const pos = partOfSpeech.toLowerCase();
          if (pos.includes('verb') || pos.includes('v-')) {
            wordType = 'verb';
          } else if (pos.includes('adj') || pos.includes('い-adj') || pos.includes('な-adj')) {
            wordType = 'adjective';
          } else if (pos.includes('adv')) {
            wordType = 'adverb';
          } else if (pos.includes('particle')) {
            wordType = 'particle';
          } else if (pos.includes('expression') || pos.includes('exp')) {
            wordType = 'expression';
          } else if (pos.includes('number') || pos.includes('num')) {
            wordType = 'number';
          }
        }
        
        sqlStatements += `(${escapeSql(kanji)}, ${escapeSql(hiragana)}, ${escapeSql(englishMeaning)}, '${level}', '${wordType}'),\n`;
      }
    } catch (error) {
      console.log(`Error parsing line ${index + 1} in ${filename}: ${error.message}`);
    }
  });
  
  return sqlStatements;
}

// Generate the complete migration
function generateMigration() {
  console.log('Processing JLPT vocabulary files...');
  
  let migration = `-- Clear existing vocabulary data
DELETE FROM jlpt_vocab;

-- Insert comprehensive JLPT vocabulary from elzup/jlpt-word-list
INSERT INTO jlpt_vocab (kanji, hiragana, english_meaning, jlpt_level, word_type) VALUES
`;

  const levels = [
    { file: 'n5.csv', level: 'N5' },
    { file: 'n4.csv', level: 'N4' },
    { file: 'n3.csv', level: 'N3' },
    { file: 'n2.csv', level: 'N2' },
    { file: 'n1.csv', level: 'N1' }
  ];

  let allSqlStatements = '';
  
  levels.forEach(({ file, level }) => {
    console.log(`Processing ${file}...`);
    const statements = processJLPTFile(file, level);
    allSqlStatements += statements;
  });

  // Remove the last comma and newline
  if (allSqlStatements.endsWith(',\n')) {
    allSqlStatements = allSqlStatements.slice(0, -2) + ';\n';
  }

  migration += allSqlStatements;

  // Add some basic grammar patterns
  migration += `
-- Insert basic grammar patterns
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
`;

  return migration;
}

// Write the migration file
const migration = generateMigration();
const migrationPath = path.join(__dirname, '..', 'migrations', '003_comprehensive_jlpt_data.sql');
fs.writeFileSync(migrationPath, migration);

console.log(`Migration written to ${migrationPath}`);
console.log('Run the migration to update your database with comprehensive JLPT vocabulary!');
