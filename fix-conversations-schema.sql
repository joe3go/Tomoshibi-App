-- Fix conversations table schema with proper UUID support
DROP TABLE IF EXISTS public.conversations CASCADE;

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    scenario_id UUID,
    title TEXT,
    phase TEXT DEFAULT 'greeting',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add persona_id column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id);

-- Add foreign key constraints
ALTER TABLE public.conversations 
ADD CONSTRAINT fk_conversations_persona 
FOREIGN KEY (persona_id) REFERENCES public.personas(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations" ON public.conversations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_persona_id ON conversations(persona_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

-- Update existing conversations without persona_id by extracting from title
UPDATE conversations 
SET persona_id = (
  SELECT p.id 
  FROM personas p 
  WHERE conversations.title ILIKE '%' || p.name || '%'
  LIMIT 1
)
WHERE persona_id IS NULL AND mode = 'solo';

-- Verify the update
SELECT 
  id, 
  title, 
  mode, 
  persona_id, 
  (SELECT name FROM personas WHERE id = conversations.persona_id) as persona_name
FROM conversations 
WHERE persona_id IS NOT NULL
LIMIT 10;