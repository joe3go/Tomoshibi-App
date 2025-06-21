// Import the centralized Supabase client to avoid multiple instances
import { supabase } from '@/lib/supabase/client';

// Conversation management functions
export async function createConversation(
  userId: string,
  personaId: string,
  scenarioId: string | null = null,
  title: string = 'New Conversation'
): Promise<string> {
  try {
    console.log('🔄 Creating conversation in Supabase:', { userId, personaId, scenarioId, title });

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        persona_id: personaId,
        scenario_id: scenarioId,
        title,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Supabase conversation creation error:', error);
      throw error;
    }

    console.log('✅ Conversation created with ID:', data.id);

    // Add initial greeting from persona
    const { data: persona } = await supabase
      .from('personas')
      .select('name, system_prompt_hint')
      .eq('id', personaId)
      .single();

    if (persona) {
      const greeting = `こんにちは！私は${persona.name}です。今日は何について話しましょうか？`;

      console.log('💬 Adding initial greeting:', greeting);
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender: 'ai',
          content: greeting,
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('⚠️ Failed to add initial message:', messageError);
      }
    }

    return data.id;
  } catch (error) {
    console.error('❌ Failed to create conversation:', error);
    throw error;
  }
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