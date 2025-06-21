
-- Update conversations table to use UUID for persona_id
-- First, backup existing data if any
CREATE TABLE conversations_backup AS SELECT * FROM conversations;

-- Drop the existing table
DROP TABLE IF EXISTS conversations CASCADE;

-- Recreate with proper UUID columns
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  persona_id UUID NOT NULL,
  scenario_id UUID NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  title TEXT DEFAULT 'New Conversation',
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

-- Update messages table to use UUID conversation_id if needed
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE UUID USING conversation_id::UUID;
