
// Message types
export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  sender_type: 'user' | 'ai';
  content: string;
  english_translation?: string;
  feedback?: string;
  vocab_used?: number[];
  grammar_used?: number[];
  sender_persona_id?: string;
  timestamp?: string;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai';
  content: string;
  english_translation?: string;
  sender_persona_id?: string;
  sender_name?: string;
  persona_id?: string | null;
  created_at: string;
}

export interface MessageFeedback {
  overall_score: number;
  vocab_feedback: string[];
  grammar_feedback: string[];
  suggestions: string[];
}
