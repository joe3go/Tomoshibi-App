// Import the centralized Supabase client to avoid multiple instances
import { supabase } from '@/lib/supabase/client';

// Conversation management functions
export async function createConversation(
  userId: string,
  personaId: string,
  scenarioId: string | null,
  title: string
) {
  console.log('🎯 createConversation called with:', { 
    userId, 
    personaId, 
    scenarioId, 
    title,
    personaIdType: typeof personaId,
    scenarioIdType: typeof scenarioId
  });

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(personaId)) {
    throw new Error(`Invalid persona ID format: ${personaId}`);
  }

  if (scenarioId && !uuidRegex.test(scenarioId)) {
    throw new Error(`Invalid scenario ID format: ${scenarioId}`);
  }

  const { data, error } = await supabase.rpc('create_conversation', {
    user_id: userId,
    persona_id: personaId,
    scenario_id: scenarioId,
    title: title
  });

  if (error) {
    console.error('❌ RPC create_conversation error:', error);
    throw error;
  }
  
  console.log('✅ RPC create_conversation success:', data);
  return data;
}

export async function addMessage(
  conversationId: number,
  sender: 'user' | 'ai',
  content: string,
  english?: string,
  feedback?: string,
  suggestions?: string[],
  vocabUsed?: number[],
  grammarUsed?: number[]
) {
  const { data, error } = await supabase.rpc('add_message', {
    conversation_id: conversationId,
    sender: sender,
    content: content,
    english: english || null,
    feedback: feedback || null,
    suggestions: suggestions || null,
    vocab_used: vocabUsed || null,
    grammar_used: grammarUsed || null
  });

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: number) {
  const { data, error } = await supabase.rpc('get_conversation_messages', {
    conversation_id: conversationId
  });

  if (error) throw error;
  return data;
}

export async function completeConversation(conversationId: number) {
  const { data, error } = await supabase.rpc('complete_conversation', {
    conversation_id: conversationId
  });

  if (error) throw error;
  return data;
}

export async function getVocabStats(userId: string) {
  const { data, error } = await supabase.rpc('get_vocab_stats', {
    user_id: userId
  });

  if (error) throw error;
  return data;
}

// Get current authenticated user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Auth state change listener
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}