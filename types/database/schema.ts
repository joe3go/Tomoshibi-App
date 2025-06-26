
// Database schema types - consolidated from shared/schema.ts
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  display_name?: string;
  profile_image_url?: string;
  preferred_kanji_display?: string;
  sound_notifications?: boolean;
  desktop_notifications?: boolean;
  created_at?: string;
}

export interface DatabasePersona {
  id: string;
  name: string;
  type: string;
  jlpt_level?: string;
  description?: string;
  system_prompt: string;
  personality_traits?: any;
  avatar_url?: string;
  personality?: string;
  speaking_style?: string;
  created_at?: string;
}

export interface DatabaseConversation {
  id: string;
  user_id: string;
  persona_id?: string;
  scenario_id?: string;
  template_id?: string;
  mode?: string;
  title?: string;
  phase?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  sender: string;
  sender_type: string;
  content: string;
  english_translation?: string;
  feedback?: string;
  vocab_used?: number[];
  grammar_used?: number[];
  sender_persona_id?: string;
  timestamp?: string;
  created_at?: string;
}

// Insert schemas for database operations
export interface InsertUser extends Omit<User, 'id' | 'created_at'> {
  password?: string;
}

export interface InsertPersona extends Omit<DatabasePersona, 'id' | 'created_at'> {}

export interface InsertConversation extends Omit<DatabaseConversation, 'id' | 'started_at' | 'completed_at'> {}

export interface InsertMessage extends Omit<DatabaseMessage, 'id' | 'timestamp' | 'created_at'> {}
