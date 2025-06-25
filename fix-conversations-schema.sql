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
CREATE INDEX idx_conversations_persona_id ON public.conversations(persona_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at);

-- Grant permissions
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

-- Update existing conversations to set persona_id where possible
-- For solo conversations, we can extract persona from title
UPDATE public.conversations 
SET persona_id = (
  CASE 
    WHEN title LIKE '%Keiko%' THEN (SELECT id FROM personas WHERE name = 'Keiko' LIMIT 1)
    WHEN title LIKE '%Aoi%' THEN (SELECT id FROM personas WHERE name = 'Aoi' LIMIT 1)  
    WHEN title LIKE '%Haruki%' THEN (SELECT id FROM personas WHERE name = 'Haruki' LIMIT 1)
    WHEN title LIKE '%Satoshi%' THEN (SELECT id FROM personas WHERE name = 'Satoshi' LIMIT 1)
    WHEN title LIKE '%Ren%' THEN (SELECT id FROM personas WHERE name = 'Ren' LIMIT 1)
    WHEN title LIKE '%Yuki%' THEN (SELECT id FROM personas WHERE name = 'Yuki' LIMIT 1)
    ELSE NULL
  END
)
WHERE persona_id IS NULL AND title IS NOT NULL;

-- For group conversations, persona_id can remain NULL since they use conversation_participants