-- Insert personas
INSERT INTO personas (name, type, description, system_prompt, personality_traits) VALUES
('Aoi', 'teacher', 'Patient and encouraging male tutor. Uses polite Japanese with detailed explanations. Perfect for structured learning with proper cultural context.', 
'You are Aoi, a patient and formal Japanese male teacher helping students learn JLPT N5 level Japanese. Always use polite forms (です/ます), provide detailed explanations, and give encouraging feedback. Focus on proper grammar, cultural context, and pronunciation guidance. Maintain a professional but warm teaching style.', 
'{"formal": true, "patient": true, "detailed": true, "encouraging": true, "cultural_focus": true}'::jsonb),
('Haruki', 'friend', 'Friendly and relaxed female conversation partner. Uses informal speech patterns and casual expressions. Great for natural conversation practice and building confidence.', 
'You are Haruki, a casual and friendly Japanese female conversation partner. Use informal speech patterns, be encouraging and relaxed. Help students practice natural conversation while keeping to JLPT N5 vocabulary and grammar. Focus on practical communication and building student confidence through casual, supportive interactions.', 
'{"casual": true, "friendly": true, "relaxed": true, "natural": true, "supportive": true}'::jsonb);

-- Insert scenarios
INSERT INTO scenarios (title, description, initial_prompt, conversation_tree, target_vocab_ids, target_grammar_ids) VALUES
('Self-Introduction', 'Learn to introduce yourself in Japanese using proper etiquette and basic personal information.', 
'Let''s practice introducing ourselves! Please tell me your name, where you''re from, and what you do.', 
'{"phases": ["greeting", "name", "origin", "occupation", "closing"]}'::jsonb, '{}', '{}'),
('Ordering Food', 'Practice ordering food at a Japanese restaurant, understanding menu items, and making requests.', 
'Welcome to our restaurant! Let''s practice ordering food. What would you like to eat or drink today?', 
'{"phases": ["greeting", "menu_inquiry", "ordering", "preferences", "payment"]}'::jsonb, '{}', '{}'),
('Shopping', 'Learn shopping phrases, asking for sizes, colors, prices, and making purchases in Japanese stores.', 
'Welcome to our store! Let''s practice shopping. What are you looking for today?', 
'{"phases": ["greeting", "item_inquiry", "size_color", "trying_on", "purchase"]}'::jsonb, '{}', '{}');

-- Insert basic JLPT N5 vocabulary
INSERT INTO jlpt_vocab (kanji, hiragana, romaji, english_meaning, word_type) VALUES
('私', 'わたし', 'watashi', 'I, me', 'pronoun'),
('名前', 'なまえ', 'namae', 'name', 'noun'),
('学生', 'がくせい', 'gakusei', 'student', 'noun'),
('先生', 'せんせい', 'sensei', 'teacher', 'noun'),
('日本', 'にほん', 'nihon', 'Japan', 'noun'),
('アメリカ', 'あめりか', 'amerika', 'America', 'noun'),
('食べる', 'たべる', 'taberu', 'to eat', 'verb'),
('飲む', 'のむ', 'nomu', 'to drink', 'verb'),
('買う', 'かう', 'kau', 'to buy', 'verb'),
('見る', 'みる', 'miru', 'to see, to watch', 'verb'),
('大きい', 'おおきい', 'ookii', 'big, large', 'adjective'),
('小さい', 'ちいさい', 'chiisai', 'small', 'adjective'),
('高い', 'たかい', 'takai', 'expensive, high', 'adjective'),
('安い', 'やすい', 'yasui', 'cheap', 'adjective'),
('美味しい', 'おいしい', 'oishii', 'delicious', 'adjective'),
('水', 'みず', 'mizu', 'water', 'noun'),
('お茶', 'おちゃ', 'ocha', 'tea', 'noun'),
('コーヒー', 'こーひー', 'koohii', 'coffee', 'noun'),
('パン', 'ぱん', 'pan', 'bread', 'noun'),
('魚', 'さかな', 'sakana', 'fish', 'noun');

-- Insert basic JLPT N5 grammar patterns
INSERT INTO jlpt_grammar (pattern, english_explanation, example_japanese, example_english) VALUES
('は', 'Topic marker particle', '私は学生です。', 'I am a student.'),
('です', 'Polite copula (is/am/are)', '日本人です。', 'I am Japanese.'),
('を', 'Direct object marker', 'パンを食べます。', 'I eat bread.'),
('に', 'Direction/time/location particle', '学校に行きます。', 'I go to school.'),
('で', 'Location of action particle', 'レストランで食べます。', 'I eat at a restaurant.'),
('から', 'From (origin/source)', 'アメリカから来ました。', 'I came from America.'),
('まで', 'Until/to (destination)', '駅まで歩きます。', 'I walk to the station.'),
('と', 'And (connecting nouns)', 'パンとお茶', 'bread and tea'),
('が', 'Subject marker particle', '魚が好きです。', 'I like fish.'),
('の', 'Possessive/descriptive particle', '私の名前', 'my name');
