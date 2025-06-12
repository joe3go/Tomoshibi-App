
-- Add unique constraint to vocab_tracker table
ALTER TABLE vocab_tracker ADD CONSTRAINT vocab_tracker_user_word_unique UNIQUE (user_id, word_id);
