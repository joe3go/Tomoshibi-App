
// Vocabulary types
export interface UserVocab {
  id: string;
  user_id: string;
  word: string;
  reading: string;
  meaning: string;
  source: string;
  created_at: string;
}

export interface JlptVocab {
  id: string;
  kanji?: string;
  hiragana: string;
  romaji?: string;
  english_meaning: string;
  jlpt_level: string;
  word_type?: string;
  created_at?: string;
}

export interface VocabTracker {
  id: string;
  user_id: string;
  word_id: string;
  frequency: number;
  user_usage_count: number;
  ai_encounter_count: number;
  last_seen_at?: string;
  memory_strength: number;
  next_review_at?: string;
  source: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  word_form_used: string;
  word_normalized: string;
  source: string;
  confidence: string;
  part_of_speech?: string;
  created_at: string;
}

export interface WordDefinition {
  word: string;
  reading?: string;
  meanings: string[];
  partOfSpeech?: string;
  jlptLevel?: string;
}
