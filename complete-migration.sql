-- Complete database migration to Supabase
-- This creates all necessary tables and data for Tomoshibi

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  personality TEXT,
  speaking_style TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50),
  estimated_duration INTEGER,
  goals TEXT[],
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  persona_id INTEGER REFERENCES personas(id),
  scenario_id INTEGER REFERENCES scenarios(id),
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jlpt_vocab table
CREATE TABLE IF NOT EXISTS jlpt_vocab (
  id SERIAL PRIMARY KEY,
  kanji VARCHAR(255),
  hiragana VARCHAR(255) NOT NULL,
  english_meaning TEXT NOT NULL,
  jlpt_level VARCHAR(10) NOT NULL,
  word_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jlpt_grammar table
CREATE TABLE IF NOT EXISTS jlpt_grammar (
  id SERIAL PRIMARY KEY,
  pattern VARCHAR(255) NOT NULL,
  jlpt_level VARCHAR(10) NOT NULL,
  english_explanation TEXT NOT NULL,
  example_japanese TEXT,
  example_english TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  jlpt_level VARCHAR(10),
  vocab_encountered INTEGER[],
  vocab_mastered INTEGER[],
  grammar_encountered INTEGER[],
  grammar_mastered INTEGER[],
  total_conversations INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vocab_tracker table
CREATE TABLE IF NOT EXISTS vocab_tracker (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES jlpt_vocab(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  user_usage_count INTEGER DEFAULT 0,
  ai_encounter_count INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  memory_strength REAL DEFAULT 0.5,
  next_review_at TIMESTAMP WITH TIME ZONE,
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- Insert default personas
INSERT INTO personas (name, description, personality, speaking_style, avatar_url) VALUES
('Aoi', 'A formal Japanese teacher who uses polite language and focuses on proper grammar structure.', 'Professional, patient, encouraging', 'Formal Japanese with keigo (polite language)', '/avatars/aoi.png'),
('Haruki', 'A casual friend who speaks in informal Japanese and helps with everyday conversation.', 'Friendly, relaxed, supportive', 'Casual Japanese with colloquialisms', '/avatars/haruki.png')
ON CONFLICT DO NOTHING;

-- Insert sample scenarios
INSERT INTO scenarios (title, description, category, difficulty_level, estimated_duration, goals, context) VALUES
('Self Introduction', 'Practice introducing yourself in Japanese', 'Social', 'Beginner', 10, ARRAY['State your name', 'Say your occupation', 'Express your hobby'], 'You are meeting someone for the first time'),
('Ordering at a Cafe', 'Learn to order food and drinks in Japanese', 'Daily Life', 'Beginner', 15, ARRAY['Greet the staff', 'Order a drink', 'Ask for the bill'], 'You are at a local Japanese cafe'),
('Weather Small Talk', 'Discuss weather and seasons in Japanese', 'Social', 'Beginner', 12, ARRAY['Comment on today''s weather', 'Ask about seasonal preferences', 'Make weather-related plans'], 'Making casual conversation about the weather')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_user_id ON vocab_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_jlpt_vocab_level ON jlpt_vocab(jlpt_level);