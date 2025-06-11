-- Users table with simple auth
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    preferred_kanji_display VARCHAR(20) DEFAULT 'furigana',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personas for different teaching styles
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    jlpt_level VARCHAR(10) DEFAULT 'N5',
    description TEXT,
    system_prompt TEXT NOT NULL,
    personality_traits JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JLPT N5 vocabulary reference
CREATE TABLE jlpt_vocab (
    id SERIAL PRIMARY KEY,
    kanji VARCHAR(50),
    hiragana VARCHAR(100) NOT NULL,
    romaji VARCHAR(100),
    english_meaning TEXT NOT NULL,
    jlpt_level VARCHAR(10) DEFAULT 'N5',
    word_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- JLPT N5 grammar patterns
CREATE TABLE jlpt_grammar (
    id SERIAL PRIMARY KEY,
    pattern VARCHAR(100) NOT NULL,
    english_explanation TEXT NOT NULL,
    example_japanese TEXT,
    example_english TEXT,
    jlpt_level VARCHAR(10) DEFAULT 'N5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation scenarios
CREATE TABLE scenarios (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    jlpt_level VARCHAR(10) DEFAULT 'N5',
    initial_prompt TEXT NOT NULL,
    conversation_tree JSONB,
    target_vocab_ids INTEGER[],
    target_grammar_ids INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User conversations
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    persona_id INTEGER REFERENCES personas(id),
    scenario_id INTEGER REFERENCES scenarios(id),
    phase VARCHAR(20) DEFAULT 'guided',
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Individual messages in conversations
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    sender VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    feedback TEXT,
    vocab_used INTEGER[],
    grammar_used INTEGER[],
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking (fixed with proper unique constraint)
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    jlpt_level VARCHAR(10) DEFAULT 'N5',
    vocab_encountered INTEGER[] DEFAULT '{}',
    vocab_mastered INTEGER[] DEFAULT '{}',
    grammar_encountered INTEGER[] DEFAULT '{}',
    grammar_mastered INTEGER[] DEFAULT '{}',
    total_conversations INTEGER DEFAULT 0,
    total_messages_sent INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);