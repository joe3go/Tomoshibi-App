// Import the centralized Supabase client to avoid multiple instances
import { supabase } from '@/lib/supabase/client';

// Helper functions for temporary persona storage workaround
function encodePersonaInTitle(title: string, personaId: string): string {
  return `${title}|persona:${personaId}`;
}

function extractPersonaFromTitle(title: string): { cleanTitle: string; personaId: string | null } {
  if (title.includes('|persona:')) {
    const [cleanTitle, personaPart] = title.split('|persona:');
    return { cleanTitle, personaId: personaPart };
  }
  return { cleanTitle: title, personaId: null };
}

// Conversation management functions
export async function createConversation(
  userId: string,
  personaId: string,
  scenarioId: string | null = null,
  title: string = 'New Conversation'
): Promise<string> {
  try {
    console.log('🔄 Creating conversation in Supabase:', { userId, personaId, scenarioId, title });

    // Temporary workaround: Store persona_id in title until schema is fixed
    const titleWithPersona = `${title}|persona:${personaId}`;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        title: titleWithPersona,
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
      .select('name, personality, speaking_style, type')
      .eq('id', personaId)
      .single();

    if (persona) {
      // Create personalized greeting based on tutor personality
      let greeting;
      let englishTranslation;
      
      if (persona.type === 'teacher') {
        greeting = `こんにちは！私は${persona.name}先生です。今日は一緒に日本語を勉強しましょう。何について話したいですか？`;
        englishTranslation = `Hello! I'm ${persona.name}-sensei. Today let's study Japanese together. What would you like to talk about?`;
      } else {
        greeting = `やあ、こんにちは！${persona.name}だよ。今日はどんなことを話そうか？何でも聞いてね！`;
        englishTranslation = `Hey, hello! I'm ${persona.name}. What shall we talk about today? Ask me anything!`;
      }

      console.log('💬 Adding personalized greeting from', persona.name, ':', greeting);
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          role: 'ai',
          content: greeting,
          english: englishTranslation,
          created_at: new Date().toISOString()
        });

      if (messageError) {
        console.error('⚠️ Failed to add initial message:', messageError);
        throw new Error(`Failed to add initial message: ${messageError.message}`);
      } else {
        console.log('✅ Initial greeting message added successfully');
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