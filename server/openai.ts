import OpenAI from "openai";
import type { Persona, Scenario, JlptVocab, JlptGrammar } from "@shared/schema";
import {
  buildSystemPrompt as buildDynamicPrompt,
  getTutorById,
  buildUserContext,
  logPromptUsage,
} from "./prompt-builder";

// UUID validation helper
function isValidUUID(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "default_key",
});

export interface ConversationContext {
  persona: Persona;
  scenario?: Scenario;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  targetVocab: JlptVocab[];
  targetGrammar: JlptGrammar[];
  groupPromptSuffix?: string;
  isGroupConversation?: boolean;
  allPersonas?: Persona[];
  conversationTopic?: string;
}

export interface AIResponse {
  content: string;
  english_translation?: string;
  feedback?: string;
  vocabUsed: string[];
  grammarUsed: string[];
  suggestions: string[];
}

export async function generateSecureAIResponse(
  tutorId: string,
  userId: string,
  username: string,
  userMessage: string,
  topic: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
  prefersEnglish: boolean = false
): Promise<AIResponse> {
  try {
    const { validateTutorId } = await import("../shared/validation");

    const validTutorId = validateTutorId(tutorId);
    const tutor = await getTutorById(validTutorId);
    if (!tutor) {
      throw new Error(`Tutor with ID ${validTutorId} not found`);
    }

    const userContext = await buildUserContext(userId, username, topic, prefersEnglish);
    const systemPrompt = buildDynamicPrompt(tutor, userContext);
    logPromptUsage(tutorId, userId, topic);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    console.log("🔄 OpenAI Request Debug:", {
      model: "gpt-4o",
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      hasJsonInPrompt: systemPrompt.toLowerCase().includes('json'),
      lastUserMessage: userMessage.substring(0, 50)
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    try {
      const json = JSON.parse(raw.replace(/```json\s*|\s*```/g, "").trim());
      return {
        content: json.response || "もう一度お願いします。",
        english_translation: json.english_translation || "Please say it again.",
        feedback: json.feedback || null,
        vocabUsed: Array.isArray(json.vocabUsed)
          ? json.vocabUsed.filter((id: any) => typeof id === "string" && isValidUUID(id))
          : [],
        grammarUsed: Array.isArray(json.grammarUsed)
          ? json.grammarUsed.filter((id: any) => typeof id === "string" && isValidUUID(id))
          : [],
        suggestions: Array.isArray(json.suggestions)
          ? json.suggestions
          : typeof json.suggestions === "string"
          ? [json.suggestions]
          : [],
      };
    } catch (err) {
      console.error("Failed to parse AI JSON:", err, raw);
      return {
        content: "すみません、もう一度言ってください。",
        english_translation: "Sorry, please say that again.",
        feedback: null,
        vocabUsed: [],
        grammarUsed: [],
        suggestions: ["Try rephrasing", "Use simpler Japanese"],
      };
    }
  } catch (error: any) {
    console.error("❌ OpenAI error:", error?.response?.data || error);

    if (error?.response?.status === 429) {
      throw new Error("The AI is currently overloaded. Please try again shortly.");
    }

    throw new Error("The AI failed to respond properly. Please try again.");
  }
}

export async function generateAIResponse(context: ConversationContext): Promise<AIResponse> {
  try {
    const systemPrompt = buildSystemPrompt(context);
    const limitedHistory = context.conversationHistory.slice(-12);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...limitedHistory,
      { role: "user" as const, content: context.userMessage },
    ];

    console.log('🔄 OpenAI Request Debug:', {
      model: 'gpt-4o',
      messageCount: messages.length,
      systemPromptLength: systemPrompt.length,
      hasJsonInPrompt: systemPrompt.includes('JSON'),
      lastUserMessage: context.userMessage,
      topic: context.conversationTopic,
      isGroup: context.isGroupConversation
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    try {
      const json = JSON.parse(raw);
      return {
        content: json.response || "もう一度お願いします。",
        english_translation: json.english_translation || "",
        feedback: json.feedback || "",
        vocabUsed: Array.isArray(json.vocabUsed) ? json.vocabUsed : [],
        grammarUsed: Array.isArray(json.grammarUsed) ? json.grammarUsed : [],
        suggestions: Array.isArray(json.suggestions) ? json.suggestions : [],
      };
    } catch (err) {
      console.error("Failed to parse JSON response:", err);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error?.response?.data || error);
    throw new Error("Failed to generate AI response");
  }
}



export async function generateScenarioIntroduction(
  persona: Persona,
  scenario: Scenario,
): Promise<string> {
  const systemPrompt = `You are ${persona.name}, starting a new conversation scenario: ${scenario.title}.

Provide a warm, encouraging introduction in Japanese (with English translation) that:
1. Greets the student appropriately for your persona
2. Introduces the scenario topic
3. Gives the first prompt to get the conversation started
4. Uses JLPT N5 level Japanese only
5. IMPORTANT: Include furigana for all kanji using parentheses format: 漢字(かんじ)

Keep it natural and encouraging. Response should be in plain text, not JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error("❌ OpenAI introduction response missing content:", response);
      return "⚠️ AI failed to start the conversation. Please reload or try again.";
    }

    return rawContent;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "⚠️ AI failed to start the conversation. Please reload or try again.";
  }
}

function isEnglishMessage(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z\s.,!?'"]/g)?.length || 0;
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)?.length || 0;
  return englishChars > japaneseChars * 1.5;
}

function buildSystemPrompt(context: ConversationContext): string {
  const topic = context.conversationTopic || 'general conversation';
  const { persona, scenario, targetVocab, targetGrammar, groupPromptSuffix, isGroupConversation, allPersonas, userMessage, conversationHistory } = context;
  
  let basePrompt = `You are ${persona.name}, a Japanese language tutor with the following characteristics:
- Personality: ${persona.personality}
- Speaking Style: ${persona.speaking_style}
- Background: ${persona.background || 'Experienced Japanese language instructor'}

You are helping a Japanese language learner practice conversation. Your goal is to:
1. Respond naturally in Japanese using vocabulary and grammar appropriate for ${persona.level || 'the user\'s current level'}
2. Be encouraging and supportive  
3. Use vocabulary from the target list when possible
4. Keep responses conversational and engaging

Topic: ${topic}
Target Vocabulary: ${targetVocab.map(v => `${v.kanji || v.hiragana} (${v.meaning})`).slice(0, 10).join(', ')}
Target Grammar: ${targetGrammar.map(g => g.pattern).slice(0, 5).join(', ')}

${scenario ? `Scenario: ${scenario.title} - ${scenario.description}` : `Focus on discussing: ${topic}`}`;

  // Enhanced group conversation context
  if (isGroupConversation && allPersonas) {
    const otherPersonas = allPersonas.filter(p => p.id !== persona.id);
    const lastThreeAIMessages = conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-3)
      .map(msg => msg.content)
      .join(' | ');

    basePrompt += `

🎭 ENHANCED GROUP CONVERSATION CONTEXT:
- You are participating in a group conversation about: ${topic}
- Other AI participants: ${otherPersonas.map(p => p.name).join(', ')}
- ${groupPromptSuffix || ''}

🎯 SPECIAL INSTRUCTIONS:
${userMessage === 'start-introduction' ? `
- This is the START of the conversation. Introduce yourself warmly and reference the other participants.
- Mention what you're excited to discuss about "${topic}".
- Keep it brief (1-2 sentences) and natural.
- Example: "こんにちは！私は${persona.name}です。${otherPersonas[0]?.name || 'みんな'}と一緒に${topic}について話すのを楽しみにしています！"` : `
- React to what others have said. Reference previous messages when relevant.
- Use other participants' names naturally: "そうですね、${otherPersonas[0]?.name || 'ケイコ'}さん！"
- If another AI asks you something directly, respond to them.
- Occasionally agree/disagree or add follow-ups: "どう思いますか、${otherPersonas[1]?.name || 'ハルキ'}？"
- If the user seems confused, gently help them.
- Praise user effort often: "いいですね、ジョーさん！"
- If conversation gets quiet, ask an engaging question.
- Stay in character as ${persona.name} - be authentic to your personality.`}

Recent AI conversation: ${lastThreeAIMessages || 'None yet'}

🎪 GROUP DYNAMICS:
- Be natural and spontaneous
- Show emotions that fit your character
- Sometimes interrupt or add quick reactions
- Keep the energy positive and encouraging`;
    
    basePrompt += `\n\nOther AI participants in this conversation: ${otherPersonas.map(p => `${p.name} (${p.personality || p.description || 'AI participant'})`).join(', ')}`;
    basePrompt += `\nYou are responding as ${persona.name}. Keep your response natural and in character. Focus on helping the human learner while maintaining the group conversation atmosphere.`;
  }

  basePrompt += `

RESPONSE GUIDELINES:
- Always respond in character as ${persona.name}
- Keep responses natural and conversational (1-3 sentences)
- Use appropriate Japanese for the user's level
- Be warm, encouraging, and authentic to your personality

FALLBACK SAFETY:
- If confused, say: "すみません、もう一度言ってください！" or "わかりませんでしたが、もう一回話してみましょう。"

RESPONSE FORMAT: Return valid JSON with:
{
  "response": "Your Japanese response here",
  "english_translation": "English translation", 
  "feedback": "Brief learning tip or encouragement",
  "vocabUsed": [],
  "grammarUsed": [],
  "suggestions": ["helpful phrase 1", "helpful phrase 2"]
}`;

  return basePrompt;
}