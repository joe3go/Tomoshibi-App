
export interface GroupPersona {
  id: string;
  name: string;
  avatar_url: string;
  personality: string;
  speaking_style: string;
}

export interface GroupMessage {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai';
  content: string;
  english_translation?: string;
  sender_persona_id?: string;
  created_at: string;
}

export interface GroupChatState {
  lastResponseTimestamp: number;
  consecutiveResponses: number;
}

export interface GroupConversation {
  id: string;
  title: string;
  participant_ids: string[];
  template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupConversationTemplate {
  id: string;
  title: string;
  description: string;
  default_personas: string[];
  group_prompt_suffix?: string;
  created_at: string;
}

export interface TypingIndicatorType {
  persona_name: string;
  persona_id: string;
}
