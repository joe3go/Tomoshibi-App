
// Group chat specific types
export interface GroupConversation {
  id: string;
  user_id: string;
  template_id: string;
  template_name: string;
  mode: 'solo' | 'group';
  title: string;
  status: 'active' | 'completed';
  created_at: string;
  participants: ConversationParticipant[];
  messages: GroupMessage[];
}

export interface TypingIndicator {
  persona_id: string;
  persona_name: string;
  is_typing: boolean;
  started_at: number;
}

export interface GroupChatState {
  lastResponseTimestamp: number;
  consecutiveResponses: number;
}

// Utility function to inject variables into prompt content
export function injectPromptVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
}
