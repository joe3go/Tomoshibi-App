-- Fix conversations table to support UUID user_id
-- This script updates the conversations table structure to work with Supabase Auth UUIDs

-- Drop existing conversations table if it exists
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table with proper UUID user_id
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  persona_id INTEGER NOT NULL,
  scenario_id INTEGER NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user access
CREATE POLICY "Users can access their own conversations" ON conversations
  FOR ALL USING (user_id = auth.uid());

-- Drop existing messages table if it exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with proper UUID user_id
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  content_japanese TEXT NULL,
  content_english TEXT NULL,
  furigana_data JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for messages
CREATE POLICY "Users can access messages from their conversations" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Insert some test data (optional)
INSERT INTO conversations (user_id, persona_id, scenario_id, status) VALUES
  ('4c54ce90-b1cc-421d-a6cc-a169f83c06fd', 6, NULL, 'active'),
  ('4c54ce90-b1cc-421d-a6cc-a169f83c06fd', 7, NULL, 'completed');

-- Grant necessary permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON conversations_id_seq TO authenticated;
GRANT ALL ON messages_id_seq TO authenticated;