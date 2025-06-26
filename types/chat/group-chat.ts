
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

export interface TypingIndicatorType {
  persona_name: string;
  persona_id: string;
}
