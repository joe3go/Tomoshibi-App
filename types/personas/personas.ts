// Persona types
export interface Persona {
  id: string;
  name: string;
  type: 'tutor' | 'native' | 'teacher' | 'friend';
  avatar_url: string | null;
  description: string;
  personality?: string;
  speaking_style?: string;
  jlpt_level?: string;
  system_prompt?: string;
  personality_traits?: Record<string, any>;
  created_at?: string;
}

export interface GroupPersona {
  id: string;
  name: string;
  avatar_url: string;
  personality: string;
  speaking_style: string;
}

export interface VocabStats {
  level: string;
  count: number;
}

export interface PersonaWithStats extends Persona {
  conversationCount?: number;
  totalMessages?: number;
}