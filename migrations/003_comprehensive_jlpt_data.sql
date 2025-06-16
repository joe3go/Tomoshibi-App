-- Clear existing vocabulary data
DELETE FROM jlpt_vocab;

-- Insert comprehensive JLPT vocabulary
INSERT INTO jlpt_vocab (kanji, hiragana, english_meaning, jlpt_level, word_type) VALUES
('水', 'みず', 'water', 'N5', 'noun'),
('本', 'ほん', 'book', 'N5', 'noun'),
('学校', 'がっこう', 'school', 'N5', 'noun');

-- Clear existing grammar data
DELETE FROM jlpt_grammar;

-- Insert basic grammar patterns
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
