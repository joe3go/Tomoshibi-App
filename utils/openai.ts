
/**
 * OpenAI API utilities and helpers
 */
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const createSystemMessage = (content: string): ChatCompletionMessageParam => ({
  role: 'system',
  content
});

export const createUserMessage = (content: string): ChatCompletionMessageParam => ({
  role: 'user',
  content
});

export const createAssistantMessage = (content: string): ChatCompletionMessageParam => ({
  role: 'assistant',
  content
});

export const buildConversationHistory = (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): ChatCompletionMessageParam[] => {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

export const truncateToTokenLimit = (text: string, maxTokens: number = 4000): string => {
  // Rough estimate: 1 token ≈ 4 characters for English, 1-2 for Japanese
  const estimatedTokens = text.length / 3;
  if (estimatedTokens <= maxTokens) return text;
  
  const maxChars = maxTokens * 3;
  return text.substring(0, maxChars) + '...';
};

export const formatPromptWithContext = (
  basePrompt: string,
  context: Record<string, any>
): string => {
  return Object.entries(context).reduce((prompt, [key, value]) => {
    return prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }, basePrompt);
};

export const sanitizeForOpenAI = (content: string): string => {
  return content
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
};
