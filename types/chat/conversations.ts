
// Conversation types
export interface Conversation {
  id: string;
  user_id: string;
  persona_id?: string;
  scenario_id?: string;
  template_id?: string;
  mode: 'solo' | 'group';
  title: string;
  status: 'active' | 'completed' | 'paused';
  phase?: 'guided' | 'transitioning' | 'open';
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ConversationTemplate {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  participant_count: number;
  default_personas?: string[];
  group_prompt_suffix?: string;
}

export interface ConversationPrompt {
  id: string;
  template_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  variables?: Record<string, string>;
  order: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  persona_id: string;
  role: 'user' | 'member';
  join_order: number;
  persona_name?: string;
  persona_type?: string;
  avatar_url?: string;
  is_active?: boolean;
}
