-- Supabase table setup for Tomoshibi vocabulary and progress tracking
-- Run this SQL in your Supabase SQL Editor

-- Create user_vocab table for personal vocabulary collection
CREATE TABLE IF NOT EXISTS user_vocab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,
  meaning TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_scenario_progress table for scenario completion tracking
CREATE TABLE IF NOT EXISTS user_scenario_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scenario_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_vocab_user_id ON user_vocab(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_created_at ON user_vocab(created_at);
CREATE INDEX IF NOT EXISTS idx_user_scenario_progress_user_id ON user_scenario_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scenario_progress_scenario_id ON user_scenario_progress(scenario_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scenario_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_vocab
CREATE POLICY "Users can only see their own vocabulary" ON user_vocab
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary" ON user_vocab
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary" ON user_vocab
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary" ON user_vocab
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_scenario_progress
CREATE POLICY "Users can only see their own progress" ON user_scenario_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_scenario_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_scenario_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON user_scenario_progress
  FOR DELETE USING (auth.uid() = user_id);