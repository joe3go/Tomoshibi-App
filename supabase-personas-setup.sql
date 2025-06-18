
-- Personas table setup for Tomoshibi tutors
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('teacher', 'friend')),
  description TEXT,
  jlpt_level TEXT DEFAULT 'N5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default personas
INSERT INTO personas (name, type, description, jlpt_level) VALUES
('Aoi', 'teacher', 'A formal Japanese teacher who focuses on proper grammar, cultural context, and structured learning. Perfect for building strong foundations in Japanese.', 'N5'),
('Haruki', 'friend', 'A friendly Japanese tutor who emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence in speaking.', 'N5')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (optional)
-- ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (since these are public tutors)
-- CREATE POLICY "Allow public read access to personas" ON personas
--   FOR SELECT USING (true);
