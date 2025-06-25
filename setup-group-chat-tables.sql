-- Create conversation_templates table for group chat templates
CREATE TABLE IF NOT EXISTS public.conversation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo', 'group')),
    default_personas UUID[] NOT NULL DEFAULT '{}',
    group_prompt_suffix TEXT,
    difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    topic TEXT,
    participant_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation_participants table for group conversations
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'ai' CHECK (role IN ('ai', 'user')),
    order_in_convo INTEGER NOT NULL DEFAULT 1,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add mode column to conversations table if it doesn't exist
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'solo' CHECK (mode IN ('solo', 'group'));

-- Enable RLS on new tables
ALTER TABLE public.conversation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversation_templates (public read access)
CREATE POLICY "Anyone can view conversation templates" ON public.conversation_templates
    FOR SELECT USING (true);

-- Create RLS policies for conversation_participants
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_templates_mode ON public.conversation_templates(mode);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_persona_id ON public.conversation_participants(persona_id);
CREATE INDEX IF NOT EXISTS idx_conversations_mode ON public.conversations(mode);

-- Grant permissions
GRANT ALL ON public.conversation_templates TO authenticated;
GRANT ALL ON public.conversation_templates TO service_role;
GRANT ALL ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;

-- Insert default group conversation templates
INSERT INTO public.conversation_templates (title, description, mode, default_personas, group_prompt_suffix, difficulty, topic, participant_count) VALUES
(
    'Anime Club Discussion',
    'Chat with Keiko and Aoi about your favorite anime series and characters',
    'group',
    ARRAY['8b0f056c-41fb-4c47-baac-6029c64e026a'::UUID, '3c9f4d8a-5678-9012-3456-789012345678'::UUID],
    'This is a group conversation about anime. Each AI should maintain their unique personality while participating naturally in the discussion. Keiko should be enthusiastic about anime, while Aoi should be more formal but engaged. Take turns responding and reference each other''s comments when appropriate.',
    'beginner',
    'anime_discussion',
    2
),
(
    'Japanese Study Group',
    'Practice with Aoi and Satoshi in a structured study session',
    'group',
    ARRAY['3c9f4d8a-5678-9012-3456-789012345678'::UUID, '2b8e7f3d-4567-8901-2345-678901234567'::UUID],
    'This is a study group session. Aoi should lead with structured explanations while Satoshi provides practical examples. Focus on helping the user learn through interactive dialogue. Take turns teaching and allow natural back-and-forth between all participants.',
    'intermediate',
    'grammar_practice',
    2
),
(
    'Cafe Hangout',
    'Casual conversation with Keiko and Haruki at a Tokyo cafe',
    'group',
    ARRAY['8b0f056c-41fb-4c47-baac-6029c64e026a'::UUID, 'f7e8d9c2-1234-5678-9abc-def012345678'::UUID],
    'This is a casual cafe conversation. Keiko should be shy but excited, while Haruki should be relaxed and friendly. Create a natural cafe atmosphere with organic conversation flow. Mention cafe elements like drinks, food, and atmosphere when appropriate.',
    'beginner',
    'daily_life',
    2
)
ON CONFLICT DO NOTHING;