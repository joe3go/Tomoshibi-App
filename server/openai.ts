import OpenAI from "openai";
import type { Persona, Scenario, JlptVocab, JlptGrammar } from "../shared/schema";
import {
  buildSystemPrompt as buildDynamicPrompt,
  getTutorById,
  buildUserContext,
  logPromptUsage,
} from "./prompt-builder";
import { createClient } from '@supabase/supabase-js';
import { logDebug, logError, logInfo } from '../utils/logger';
import { sanitizeForOpenAI, truncateToTokenLimit } from '../utils/openai';

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
      messages: [
        { 
          role: "system", 
          content: systemPrompt + "\n\n**CRITICAL FURIGANA REQUIREMENT: You MUST include hiragana readings in parentheses after EVERY SINGLE kanji character without exception. Examples: 今日(きょう), 学校(がっこう), 食べる(たべる), 青井(あおい), 話(はなし), 好き(すき). NO kanji should appear without furigana readings.**" 
        },
        ...limitedHistory,
        { role: "user", content: context.userMessage }
      ],
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
5. **MANDATORY FURIGANA**: Include hiragana readings in parentheses after EVERY SINGLE kanji without exception

**FURIGANA EXAMPLES YOU MUST FOLLOW:**
- 今日(きょう) - today
- 学校(がっこう) - school
- 青井(あおい) - Aoi (name)
- 話(はなし) - talk/story
- 好き(すき) - like
- 私(わたし) - I/me

Topic: ${topic}
Target Vocabulary: ${targetVocab.map(v => `${v.kanji || v.hiragana} (${v.meaning})`).slice(0, 10).join(', ')}
Target Grammar: ${targetGrammar.map(g => g.pattern).slice(0, 5).join(', ')}

${scenario ? `Scenario: ${scenario.title} - ${scenario.description}` : `Focus on discussing: ${topic}`}`;

  // Enhanced group conversation context
    if (isGroupConversation && allPersonas && allPersonas.length > 0) {
      const otherPersonas = allPersonas.filter(p => p.id !== persona.id);
      const personaNames = otherPersonas.map(p => p.name).join(', ');

      basePrompt += `\n\n🎭 GROUP CONVERSATION CONTEXT:
You are ${persona.name} in a group conversation with ${personaNames} and the user.
Topic: ${context.conversationTopic || 'general discussion'}
${groupPromptSuffix || ''}

CRITICAL GROUP RULES:
- You are ONLY ${persona.name} - never respond as other personas
- NEVER ask yourself questions like "What about you, ${persona.name}?"
- When others ask you questions, answer them directly
- Reference other participants naturally: "That's interesting, ${otherPersonas[0]?.name}さん"
- If someone asks "What about you, [other persona]?" - DO NOT respond, let them respond
- Only respond when it's natural for ${persona.name} to speak
- Keep responses conversational and engaging
- Stay aware of who said what in the conversation`;
    }

  // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-8); // Last 8 messages for better context
      const historyText = recentMessages.map(msg => {
        if (msg.sender_type === 'user') {
          return `User: ${msg.content}`;
        } else {
          const senderName = allPersonas?.find(p => p.id === msg.sender_persona_id)?.name || 'AI';
          return `${senderName}: ${msg.content}`;
        }
      }).join('\n');

      basePrompt += `\n\n📝 RECENT CONVERSATION HISTORY:\n${historyText}`;

      // Add specific context about who just spoke
      const lastMessage = recentMessages[recentMessages.length - 1];
      if (lastMessage && lastMessage.sender_type === 'ai' && lastMessage.sender_persona_id !== persona.id) {
        const lastSpeaker = allPersonas?.find(p => p.id === lastMessage.sender_persona_id)?.name;
        if (lastSpeaker) {
          basePrompt += `\n\n⚠️ IMPORTANT: ${lastSpeaker} just spoke. You (${persona.name}) should respond naturally to their message or the conversation flow.`;
        }
      }
    }

  basePrompt += `

RESPONSE GUIDELINES:
- Always respond in character as ${persona.name}
- Keep responses natural and conversational (1-3 sentences)
- Use appropriate Japanese for the user's level
- Be warm, encouraging, and authentic to your personality

FALLBACK SAFETY:
- If confused, say: "すみません、もう一度言ってください！" or "わかりませんでしたが、もう一回話してみましょう。"

**FURIGANA IS MANDATORY**: Every kanji character MUST have hiragana in parentheses immediately after it.

RESPONSE FORMAT: Return valid JSON with:
{
  "response": "Your Japanese response with ALL kanji having furigana like 今日(きょう), 学校(がっこう), 青井(あおい), 話(はなし)",
  "english_translation": "English translation", 
  "feedback": "Brief learning tip or encouragement",
  "vocabUsed": [],
  "grammarUsed": [],
  "suggestions": ["helpful phrase 1", "helpful phrase 2"]
}`;

  return basePrompt;
}