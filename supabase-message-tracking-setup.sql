-- Execute this SQL in your Supabase SQL Editor
-- This creates comprehensive message tracking and fixes vocabulary limitations

-- 1. Create the main RPC function for message tracking
CREATE OR REPLACE FUNCTION create_message_with_tracking(
    _conversation_id UUID,
    _sender_type TEXT,
    _content TEXT,
    _vocab_used UUID[] DEFAULT NULL,
    _grammar_used UUID[] DEFAULT NULL,
    _english_translation TEXT DEFAULT NULL,
    _tutor_feedback TEXT DEFAULT NULL,
    _suggestions TEXT[] DEFAULT NULL,
    _sender_persona_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    sender_type TEXT,
    content TEXT,
    vocab_used UUID[],
    grammar_used UUID[],
    english_translation TEXT,
    tutor_feedback TEXT,
    suggestions TEXT[],
    sender_persona_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user_id UUID;
    _message_id UUID;
    _vocab_id UUID;
    _grammar_id UUID;
BEGIN
    -- Get user_id from conversation
    SELECT user_id INTO _user_id
    FROM conversations
    WHERE conversations.id = _conversation_id;
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Conversation not found or invalid conversation_id: %', _conversation_id;
    END IF;
    
    -- Insert the message
    INSERT INTO messages (
        conversation_id,
        sender_type,
        content,
        vocab_used,
        grammar_used,
        english_translation,
        tutor_feedback,
        suggestions,
        sender_persona_id,
        created_at
    )
    VALUES (
        _conversation_id,
        _sender_type,
        _content,
        _vocab_used,
        _grammar_used,
        _english_translation,
        _tutor_feedback,
        _suggestions,
        _sender_persona_id,
        NOW()
    )
    RETURNING messages.id INTO _message_id;
    
    -- Process vocabulary usage tracking
    IF _vocab_used IS NOT NULL AND array_length(_vocab_used, 1) > 0 THEN
        FOREACH _vocab_id IN ARRAY _vocab_used
        LOOP
            -- Verify the vocab word exists in vocab_library
            IF EXISTS (SELECT 1 FROM vocab_library WHERE vocab_library.id = _vocab_id) THEN
                -- Upsert vocab tracking entry
                INSERT INTO vocab_tracker (user_id, word_id, user_usage_count, last_seen_at)
                VALUES (_user_id, _vocab_id, 1, NOW())
                ON CONFLICT (user_id, word_id)
                DO UPDATE SET
                    user_usage_count = vocab_tracker.user_usage_count + 1,
                    last_seen_at = NOW();
            END IF;
        END LOOP;
    END IF;
    
    -- Process grammar usage tracking
    IF _grammar_used IS NOT NULL AND array_length(_grammar_used, 1) > 0 THEN
        FOREACH _grammar_id IN ARRAY _grammar_used
        LOOP
            -- Verify the grammar pattern exists in jlpt_grammar
            IF EXISTS (SELECT 1 FROM jlpt_grammar WHERE jlpt_grammar.id = _grammar_id) THEN
                -- Upsert grammar tracking entry
                INSERT INTO grammar_tracker (user_id, grammar_id, frequency, last_used_at)
                VALUES (_user_id, _grammar_id, 1, NOW())
                ON CONFLICT (user_id, grammar_id)
                DO UPDATE SET
                    frequency = grammar_tracker.frequency + 1,
                    last_used_at = NOW();
            END IF;
        END LOOP;
    END IF;
    
    -- Return the inserted message
    RETURN QUERY
    SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.vocab_used,
        m.grammar_used,
        m.english_translation,
        m.tutor_feedback,
        m.suggestions,
        m.created_at
    FROM messages m
    WHERE m.id = _message_id;
END;
$$;

-- 2. Fix vocab_tracker constraints and indexes
-- Ensure vocab_tracker can handle all JLPT vocabulary entries

-- Create vocab_tracker table if it doesn't exist
CREATE TABLE IF NOT EXISTS vocab_tracker (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    word_id INTEGER NOT NULL,
    user_usage_count INTEGER DEFAULT 0,
    ai_encounter_count INTEGER DEFAULT 0,
    frequency INTEGER DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    memory_strength DECIMAL(3,2) DEFAULT 0.00,
    next_review_at TIMESTAMPTZ,
    source TEXT DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Create grammar_tracker table if it doesn't exist
CREATE TABLE IF NOT EXISTS grammar_tracker (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    grammar_id INTEGER NOT NULL,
    frequency INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, grammar_id)
);

-- Drop and recreate foreign key constraints to ensure they support all vocab
ALTER TABLE vocab_tracker DROP CONSTRAINT IF EXISTS vocab_tracker_word_id_fkey;
ALTER TABLE vocab_tracker ADD CONSTRAINT vocab_tracker_word_id_fkey 
    FOREIGN KEY (word_id) REFERENCES jlpt_vocab(id) ON DELETE CASCADE;

ALTER TABLE grammar_tracker DROP CONSTRAINT IF EXISTS grammar_tracker_grammar_id_fkey;
ALTER TABLE grammar_tracker ADD CONSTRAINT grammar_tracker_grammar_id_fkey 
    FOREIGN KEY (grammar_id) REFERENCES jlpt_grammar(id) ON DELETE CASCADE;

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_user_word ON vocab_tracker(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_user_id ON vocab_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_word_id ON vocab_tracker(word_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_last_seen ON vocab_tracker(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_grammar_tracker_user_grammar ON grammar_tracker(user_id, grammar_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_user_id ON grammar_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_grammar_id ON grammar_tracker(grammar_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_last_used ON grammar_tracker(last_used_at);

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION create_message_with_tracking TO authenticated;
GRANT ALL ON TABLE vocab_tracker TO authenticated;
GRANT ALL ON TABLE grammar_tracker TO authenticated;

-- 5. Test the function (optional - remove if not needed)
-- SELECT * FROM create_message_with_tracking(
--     1, 
--     'user', 
--     'こんにちは', 
--     ARRAY[1, 2, 3], 
--     ARRAY[1], 
--     'Hello', 
--     'Good pronunciation', 
--     ARRAY['Try using more polite form']
-- );