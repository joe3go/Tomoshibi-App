import { supabase } from "@/lib/supabase/client";

export interface MessageWithTracking {
  conversation_id: number;
  sender_type: 'user' | 'ai';
  content: string;
  vocab_used?: number[];
  grammar_used?: number[];
  english_translation?: string;
  tutor_feedback?: string;
  suggestions?: string[];
}

export interface TrackedMessage {
  id: number;
  conversation_id: number;
  sender_type: string;
  content: string;
  vocab_used: number[];
  grammar_used: number[];
  english_translation: string;
  tutor_feedback: string;
  suggestions: string[];
  created_at: string;
}

/**
 * Creates a message with comprehensive vocabulary and grammar tracking
 * Uses the create_message_with_tracking RPC function for atomic operations
 */
export async function createMessageWithTracking(
  messageData: MessageWithTracking
): Promise<TrackedMessage> {
  const { data, error } = await supabase.rpc('create_message_with_tracking', {
    _conversation_id: messageData.conversation_id,
    _sender_type: messageData.sender_type,
    _content: messageData.content,
    _vocab_used: messageData.vocab_used || null,
    _grammar_used: messageData.grammar_used || null,
    _english_translation: messageData.english_translation || null,
    _tutor_feedback: messageData.tutor_feedback || null,
    _suggestions: messageData.suggestions || null
  });

  if (error) {
    console.error('Error creating message with tracking:', error);
    throw new Error(`Failed to create message: ${error.message}`);
  }

  // The RPC returns an array with one result
  return data[0] as TrackedMessage;
}

/**
 * Extracts potential vocabulary IDs from Japanese text
 * This is a simplified version - in production you'd use morphological analysis
 */
export function extractPotentialVocabIds(text: string, jlptVocab: any[]): number[] {
  const vocabIds: number[] = [];
  
  // Extract Japanese words (hiragana, katakana, kanji)
  const japaneseWords = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/g) || [];
  
  for (const word of japaneseWords) {
    // Find matching vocabulary entries
    const matches = jlptVocab.filter(vocab => 
      vocab.kanji === word || 
      vocab.hiragana === word ||
      (vocab.kanji && word.includes(vocab.kanji)) ||
      (vocab.hiragana && word.includes(vocab.hiragana))
    );
    
    matches.forEach(match => {
      if (!vocabIds.includes(match.id)) {
        vocabIds.push(match.id);
      }
    });
  }
  
  return vocabIds;
}

/**
 * Gets vocabulary statistics for a user
 */
export async function getUserVocabStats(userId: string) {
  const { data, error } = await supabase
    .from('vocab_tracker')
    .select(`
      word_id,
      user_usage_count,
      ai_encounter_count,
      frequency,
      last_seen_at,
      jlpt_vocab!inner(
        id,
        kanji,
        hiragana,
        english_meaning,
        jlpt_level
      )
    `)
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false });

  if (error) {
    console.error('Error fetching vocab stats:', error);
    return [];
  }

  return data;
}

/**
 * Gets grammar usage statistics for a user
 */
export async function getUserGrammarStats(userId: string) {
  const { data, error } = await supabase
    .from('grammar_tracker')
    .select(`
      grammar_id,
      frequency,
      last_used_at,
      jlpt_grammar!inner(
        id,
        pattern,
        meaning,
        level,
        examples
      )
    `)
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  if (error) {
    console.error('Error fetching grammar stats:', error);
    return [];
  }

  return data;
}