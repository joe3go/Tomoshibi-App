-- Performance indexes for vocab_library table
-- These indexes will significantly improve query performance for large vocabulary datasets

-- Index for JLPT level filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocab_library(jlpt_level);

-- Index for word type filtering
CREATE INDEX IF NOT EXISTS idx_vocab_word_type ON vocab_library(word_type);

-- Index for source tracking
CREATE INDEX IF NOT EXISTS idx_vocab_source_id ON vocab_library(source_id);

-- Index for kanji text search
CREATE INDEX IF NOT EXISTS idx_vocab_kanji ON vocab_library(kanji);

-- Index for hiragana text search  
CREATE INDEX IF NOT EXISTS idx_vocab_hiragana ON vocab_library(hiragana);

-- Compound index for common queries (level + word_type)
CREATE INDEX IF NOT EXISTS idx_vocab_level_type ON vocab_library(jlpt_level, word_type);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_vocab_created_at ON vocab_library(created_at);

-- Text search indexes for partial matching
CREATE INDEX IF NOT EXISTS idx_vocab_kanji_gin ON vocab_library USING gin(kanji gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vocab_hiragana_gin ON vocab_library USING gin(hiragana gin_trgm_ops);

-- Enable the pg_trgm extension for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;