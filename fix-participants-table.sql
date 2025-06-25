-- Fix conversation_participants table structure
DROP TABLE IF EXISTS public.conversation_participants CASCADE;

CREATE TABLE public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'ai' CHECK (role IN ('ai', 'user')),
    order_in_convo INTEGER NOT NULL DEFAULT 1,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view participants in their conversations" ON public.conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add participants to their conversations" ON public.conversation_participants
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.conversations 
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_persona_id ON public.conversation_participants(persona_id);

-- Grant permissions
GRANT ALL ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;