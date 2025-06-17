export interface UserVocab {
  id: string;
  user_id: string;
  word: string;
  reading: string;
  meaning: string;
  source: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  scenario_id: string;
  completed: boolean;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
}