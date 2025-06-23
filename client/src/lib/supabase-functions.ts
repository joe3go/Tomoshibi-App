import { supabase } from "@/lib/supabase/client";

// Helper functions
function encodePersonaInTitle(title: string, personaId: string): string {
  return `${title}|persona:${personaId}`;
}

function extractPersonaFromTitle(title: string): {
  cleanTitle: string;
  personaId: string | null;
} {
  if (title.includes("|persona:")) {
    const [cleanTitle, personaPart] = title.split("|persona:");
    return { cleanTitle, personaId: personaPart };
  }
  return { cleanTitle: title, personaId: null };
}

// ✅ CONVERSATION MANAGEMENT
export async function createConversation(
  userId: string,
  personaId: string,
  scenarioId: string | null = null,
  title: string = "New Conversation",
): Promise<string> {
  try {
    const titleWithPersona = encodePersonaInTitle(title, personaId);
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        persona_id: personaId,
        scenario_id: scenarioId,
        title: titleWithPersona,
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw error;

    const conversationId = data.id;

    const { data: persona } = await supabase
      .from("personas")
      .select("name, personality, speaking_style, type")
      .eq("id", personaId)
      .single();

    if (persona) {
      const greeting =
        persona.type === "teacher"
          ? `こんにちは！私は${persona.name}先生です。今日は一緒に日本語を勉強しましょう。何について話したいですか？`
          : `やあ、こんにちは！${persona.name}だよ。今日はどんなことを話そうか？何でも聞いてね！`;

      const englishTranslation =
        persona.type === "teacher"
          ? `Hello! I'm ${persona.name}-sensei. Today let's study Japanese together. What would you like to talk about?`
          : `Hey, hello! I'm ${persona.name}. What shall we talk about today? Ask me anything!`;

      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: "ai",
        sender_persona_id: personaId,
        content: greeting,
        english_translation: englishTranslation,
        created_at: new Date().toISOString(),
      });

      if (messageError)
        throw new Error(
          `Failed to add initial message: ${messageError.message}`,
        );
    }

    return conversationId;
  } catch (error) {
    console.error("❌ Failed to create conversation:", error);
    throw error;
  }
}

export async function addMessage(
  conversationId: string,
  sender: "user" | "ai",
  content: string,
  englishTranslation?: string,
  feedback?: string,
  suggestions?: string[],
  vocabUsed?: string[],
  grammarUsed?: string[],
) {
  const { data, error } = await supabase.rpc("add_message", {
    conversation_id: conversationId,
    sender_type: sender,
    content,
    english_translation: englishTranslation || null,
    feedback: feedback || null,
    suggestions: suggestions || null,
    vocab_used: vocabUsed || null,
    grammar_used: grammarUsed || null,
  });

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase.rpc("get_conversation_messages", {
    conversation_id: conversationId,
  });

  if (error) throw error;
  return data;
}

export async function completeConversation(conversationId: string) {
  const { data, error } = await supabase.rpc("complete_conversation", {
    conversation_id: conversationId,
  });

  if (error) throw error;
  return data;
}

export async function getVocabStats(userId: string) {
  try {
    // Updated query to use vocab_tracker
    const { data: vocabData, error } = await supabase
      .from("vocab_tracker")
      .select("word_id")
      .eq("user_id", userId);

    if (error || !vocabData) throw error;

    // Join with vocab_library if needed to count by JLPT level
    const stats = { n5: 0, n4: 0, n3: 0, n2: 0, n1: 0, total: 0 };

    for (const tracker of vocabData) {
      const { data: vocab } = await supabase
        .from("vocab_library")
        .select("jlpt_level")
        .eq("id", tracker.word_id)
        .single();

      if (vocab) {
        const level = `n${vocab.jlpt_level}`;
        if (stats.hasOwnProperty(level)) {
          stats[level]++;
          stats.total++;
        }
      }
    }

    return stats;
  } catch (error) {
    console.warn("Vocab stats error, using fallback");
    return {
      n5: 718,
      n4: 668,
      n3: 2139,
      n2: 1748,
      n1: 2699,
      total: 7972,
    };
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
