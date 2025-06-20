
export interface Persona {
  id: number;
  name: string;
  type: 'tutor' | 'native' | 'teacher' | 'friend';
  avatar_url: string | null;
  description: string;
  personality?: string;
  speaking_style?: string;
  jlpt_level?: string;
  created_at?: string;
}

export interface VocabStats {
  level: string;
  count: number;
}

export interface PersonaWithStats extends Persona {
  conversationCount?: number;
  totalMessages?: number;
}
