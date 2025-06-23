-- RPC Function: create_message_with_tracking
-- Creates a message and tracks vocabulary/grammar usage in a single transaction

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
                INSERT INTO grammar_tracker (user_id, grammar_id, frequency, last_seen_at)
                VALUES (_user_id, _grammar_id, 1, NOW())
                ON CONFLICT (user_id, grammar_id)
                DO UPDATE SET
                    frequency = grammar_tracker.frequency + 1,
                    last_seen_at = NOW();
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
        m.sender_persona_id,
        m.created_at
    FROM messages m
    WHERE m.id = _message_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_message_with_tracking TO authenticated;

-- Fix vocab_tracker to support all JLPT vocabulary
-- Ensure the foreign key constraint allows all jlpt_vocab entries

-- Check if the FK constraint exists and is properly configured
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vocab_tracker_word_id_fkey' 
        AND table_name = 'vocab_tracker'
    ) THEN
        ALTER TABLE vocab_tracker DROP CONSTRAINT vocab_tracker_word_id_fkey;
    END IF;
    
    -- Add the proper foreign key constraint
    ALTER TABLE vocab_tracker 
    ADD CONSTRAINT vocab_tracker_word_id_fkey 
    FOREIGN KEY (word_id) REFERENCES vocab_library(id) ON DELETE CASCADE;
END $$;

-- Ensure vocab_tracker has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_user_word ON vocab_tracker(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_user_id ON vocab_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_word_id ON vocab_tracker(word_id);
CREATE INDEX IF NOT EXISTS idx_vocab_tracker_last_seen ON vocab_tracker(last_seen_at);

-- Ensure grammar_tracker has proper indexes too
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_user_grammar ON grammar_tracker(user_id, grammar_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_user_id ON grammar_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_grammar_id ON grammar_tracker(grammar_id);
CREATE INDEX IF NOT EXISTS idx_grammar_tracker_last_seen ON grammar_tracker(last_seen_at);

-- Verify that vocab_tracker can accept any word_id from jlpt_vocab
-- This query should return 0 if all constraints are properly set
-- SELECT COUNT(*) FROM jlpt_vocab jv 
-- LEFT JOIN vocab_tracker vt ON jv.id = vt.word_id 
-- WHERE vt.word_id IS NULL AND jv.id NOT IN (
--     SELECT DISTINCT word_id FROM vocab_tracker WHERE word_id IS NOT NULL
-- );