// Re-export group conversation types from centralized location
export type {
  ConversationTemplate,
  ConversationPrompt,
  ConversationParticipant,
  GroupConversation,
  GroupMessage,
  TypingIndicator
} from "../types";

// Re-export utility function
export { injectPromptVariables } from "../types";

// Re-export from centralized types
export * from '../types/chat';