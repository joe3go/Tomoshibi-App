
-- Fix messages table schema to match application expectations
-- Run this in Supabase SQL Editor

-- Drop existing messages table if structure is incompatible
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table with proper schema
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    content TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
    sender_persona_id UUID NULL,
    sender_user_id UUID NULL,
    english_translation TEXT NULL,
    tutor_feedback TEXT NULL,
    suggestions TEXT[] NULL,
    vocab_used TEXT[] NULL,
    grammar_used TEXT[] NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to conversations
ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_conversation 
FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add foreign key constraint to personas (for AI messages)
ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_persona 
FOREIGN KEY (sender_persona_id) REFERENCES public.personas(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_sender_type ON public.messages(sender_type);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for messages
CREATE POLICY "messages_policy" ON public.messages
FOR ALL USING (
    conversation_id IN (
        SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
