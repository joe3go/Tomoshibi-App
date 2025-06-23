// Mock data and functions for group conversations
import { ConversationTemplate, ConversationPrompt, ConversationParticipant, GroupConversation, GroupMessage, injectPromptVariables } from '@/../../shared/group-conversation-types';

// Mock conversation templates
export const mockConversationTemplates: ConversationTemplate[] = [
  {
    id: 'anime-club-001',
    name: 'Anime Club',
    description: 'Chat with Keiko and Ren about your favorite anime series',
    topic: 'anime_discussion',
    difficulty: 'beginner',
    participant_count: 2
  },
  {
    id: 'study-group-001', 
    name: 'Japanese Study Group',
    description: 'Practice with Aoi and Satoshi in a study session',
    topic: 'grammar_practice',
    difficulty: 'intermediate',
    participant_count: 2
  },
  {
    id: 'cafe-hangout-001',
    name: 'Cafe Hangout',
    description: 'Casual conversation with Keiko at a Tokyo cafe',
    topic: 'daily_life',
    difficulty: 'beginner',
    participant_count: 1
  }
];

// Mock conversation prompts for each template
export const mockConversationPrompts: ConversationPrompt[] = [
  // Anime Club prompts
  {
    id: 'prompt-anime-001',
    template_id: 'anime-club-001',
    role: 'system',
    content: 'You are in an anime discussion group. The participants are excited anime fans who love to share recommendations and discuss plot details. Keep the conversation casual and enthusiastic.',
    order: 1
  },
  {
    id: 'prompt-anime-002',
    template_id: 'anime-club-001',
    role: 'assistant',
    content: 'こんにちは{user_name}さん！今日はどんなアニメについて話したいですか？最近見た面白いアニメはありますか？',
    variables: { user_name: 'User' },
    order: 2
  },
  
  // Study Group prompts
  {
    id: 'prompt-study-001',
    template_id: 'study-group-001',
    role: 'system',
    content: 'You are in a Japanese study group. Focus on grammar practice and vocabulary building. Be encouraging but educational.',
    order: 1
  },
  {
    id: 'prompt-study-002',
    template_id: 'study-group-001',
    role: 'assistant',
    content: '勉強お疲れ様です、{user_name}さん！今日はどの文法を練習したいですか？',
    variables: { user_name: 'User' },
    order: 2
  },

  // Cafe Hangout prompts
  {
    id: 'prompt-cafe-001',
    template_id: 'cafe-hangout-001',
    role: 'system',
    content: 'You are hanging out at a cozy Tokyo cafe. The atmosphere is relaxed and friendly. Talk about daily life, hobbies, and casual topics.',
    order: 1
  },
  {
    id: 'prompt-cafe-002',
    template_id: 'cafe-hangout-001',
    role: 'assistant',
    content: 'わあ、このカフェ素敵だね！{user_name}さん、何を注文する？私はラテが飲みたいな〜',
    variables: { user_name: 'User' },
    order: 2
  }
];

// Mock function to get participants for a template
export async function getParticipantsForTemplate(templateId: string): Promise<ConversationParticipant[]> {
  const participantMappings: Record<string, string[]> = {
    'anime-club-001': ['8b0f056c-41fb-4c47-baac-6029c64e026a', 'f7e8d9c2-1234-5678-9abc-def012345678'], // Keiko + Ren
    'study-group-001': ['3c9f4d8a-5678-9012-3456-789012345678', '2b8e7f3d-4567-8901-2345-678901234567'], // Aoi + Satoshi  
    'cafe-hangout-001': ['8b0f056c-41fb-4c47-baac-6029c64e026a'] // Just Keiko
  };

  const personaIds = participantMappings[templateId] || [];
  return personaIds.map((personaId, index) => ({
    id: `participant-${templateId}-${index}`,
    conversation_id: '', // Will be filled when conversation is created
    persona_id: personaId,
    role: 'member' as const,
    join_order: index + 1
  }));
}

// Mock function to get prompts for a template
export async function getPromptsForTemplate(templateId: string): Promise<ConversationPrompt[]> {
  return mockConversationPrompts.filter(prompt => prompt.template_id === templateId);
}

// Mock function to get all templates
export async function getConversationTemplates(): Promise<ConversationTemplate[]> {
  return mockConversationTemplates;
}

// Function to create group conversation with template
export async function createGroupConversationFromTemplate(
  userId: string,
  templateId: string,
  userDisplayName: string = 'User'
): Promise<string> {
  const template = mockConversationTemplates.find(t => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Generate conversation ID
  const conversationId = `group-${templateId}-${Date.now()}`;
  
  // Get participants for this template
  const participants = await getParticipantsForTemplate(templateId);
  
  // Store group conversation data (in a real app, this would go to database)
  const groupConversation = {
    id: conversationId,
    user_id: userId,
    template_id: templateId,
    mode: 'group' as const,
    title: template.name,
    status: 'active' as const,
    created_at: new Date().toISOString(),
    participants: participants.map(p => ({ ...p, conversation_id: conversationId }))
  };

  // Store in localStorage for demo purposes
  const existingGroupChats = JSON.parse(localStorage.getItem('groupConversations') || '[]');
  existingGroupChats.push(groupConversation);
  localStorage.setItem('groupConversations', JSON.stringify(existingGroupChats));

  // Get initial prompts and inject variables
  const prompts = await getPromptsForTemplate(templateId);
  const variables = { user_name: userDisplayName };
  
  // Create initial messages from prompts
  const initialMessages = prompts
    .filter(p => p.role === 'assistant')
    .map(prompt => ({
      id: `msg-${Date.now()}-${Math.random()}`,
      conversation_id: conversationId,
      role: 'assistant',
      content: injectPromptVariables(prompt.content, { ...prompt.variables, ...variables }),
      created_at: new Date().toISOString(),
      persona_id: participants[0]?.persona_id || null
    }));

  // Store initial messages
  localStorage.setItem(`groupMessages-${conversationId}`, JSON.stringify(initialMessages));

  return conversationId;
}

// Function to get a group conversation by ID
export async function getGroupConversation(conversationId: string): Promise<GroupConversation | null> {
  const existingGroupChats = JSON.parse(localStorage.getItem('groupConversations') || '[]');
  const conversation = existingGroupChats.find((c: any) => c.id === conversationId);
  
  if (!conversation) return null;

  // Get messages for this conversation
  const messages = JSON.parse(localStorage.getItem(`groupMessages-${conversationId}`) || '[]');
  
  // Get template name
  const template = mockConversationTemplates.find(t => t.id === conversation.template_id);
  
  return {
    ...conversation,
    template_name: template?.name || 'Unknown Template',
    messages: messages
  };
}

// Function to add a message to a group conversation
export async function addMessageToGroupConversation(conversationId: string, message: GroupMessage): Promise<void> {
  const existingMessages = JSON.parse(localStorage.getItem(`groupMessages-${conversationId}`) || '[]');
  existingMessages.push(message);
  localStorage.setItem(`groupMessages-${conversationId}`, JSON.stringify(existingMessages));
}