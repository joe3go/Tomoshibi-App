// Group conversation types for the enhanced chat system

export interface ConversationTemplate {
  id: string;
  name: string; // e.g. "Anime Club"
  description: string; // e.g. "Chat with Ren and Keiko about anime"
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  participant_count: number;
}

export interface ConversationPrompt {
  id: string;
  template_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string; // e.g. "こんにちは、{user_name}さん！"
  variables?: Record<string, string>; // optional tokens to replace
  order: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  persona_id: string;
  role: 'user' | 'member'; // user is the human, member is AI
  join_order: number;
  persona_name?: string;
  persona_type?: string;
  avatar_url?: string;
}

export interface GroupConversation {
  id: string;
  user_id: string;
  template_id: string;
  mode: 'solo' | 'group';
  title: string;
  status: 'active' | 'completed';
  created_at: string;
  participants: ConversationParticipant[];
}

export interface TypingIndicator {
  persona_id: string;
  persona_name: string;
  is_typing: boolean;
  started_at: number;
}

// Utility function to inject variables into prompt content
export function injectPromptVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
}