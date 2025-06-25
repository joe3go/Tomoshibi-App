// openai.ts (updated with system prompt logic)

import OpenAI from "openai";
import type { Persona, Scenario, JlptVocab, JlptGrammar } from "@shared/schema";
import {
  buildSystemPrompt as buildDynamicPrompt,
  getTutorById,
  buildUserContext,
  logPromptUsage,
  type Tutor,
  type UserContext,
} from "./prompt-builder";

// UUID validation helper
function isValidUUID(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
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
  vocabUsed: number[];
  grammarUsed: number[];
  suggestions: string[];
}

export async function generateSecureAIResponse(
  tutorId: string,
  userId: string,
  username: string,
  userMessage: string,
  topic: string,
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = [],
  prefersEnglish: boolean = false,
): Promise<AIResponse> {
  try {
    // Import validation functions
    const { validateTutorId } = await import("../shared/validation");

    // Validate tutorId format before proceeding
    const validTutorId = validateTutorId(tutorId);

    const tutor = await getTutorById(validTutorId);
    if (!tutor) {
      throw new Error(`Tutor with ID ${validTutorId} not found`);
    }

    const userContext = await buildUserContext(
      userId,
      username,
      topic,
      prefersEnglish,
    );
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
      max_tokens: 300,
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const rawContent = response?.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("No response received from AI");
    }

    console.log("🗣️ Raw AI Response:", rawContent.substring(0, 200) + "...");

    // Parse the JSON response with better error handling
    let parsedResponse;
    try {
      // Clean the response first - remove any markdown formatting
      const cleanedContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      parsedResponse = JSON.parse(cleanedContent);
      console.log("✅ Successfully parsed OpenAI JSON response");
    } catch (e) {
      console.error("❌ Failed to parse OpenAI JSON:", e.message);
      console.error("❌ Raw content that failed:", rawContent);
      
      // Try to extract content manually if JSON parsing fails
      const fallbackContent = rawContent.includes("こんにちは") || rawContent.includes("すみません") 
        ? rawContent.substring(0, 100) 
        : "すみません、もう一度言ってください。";
      
      return {
        content: fallbackContent,
        english_translation: "I'm sorry, could you please say that again?",
        feedback: "Please try rephrasing your message",
        vocabUsed: [],
        grammarUsed: [],
        suggestions: ["Try using simpler Japanese", "Ask me about basic topics"],
      };
    }

    // Validate and return structured response
    return {
      content: parsedResponse.response || parsedResponse.content || "すみません、もう一度言ってください。",
      english_translation: parsedResponse.english_translation || parsedResponse.english || "I'm sorry, could you please say that again?",
      feedback: parsedResponse.feedback || null,
      vocabUsed: Array.isArray(parsedResponse.vocabUsed) ? 
        parsedResponse.vocabUsed.filter((id: any) => typeof id === 'string' && isValidUUID(id)) : [],
      grammarUsed: Array.isArray(parsedResponse.grammarUsed) ? 
        parsedResponse.grammarUsed.filter((id: any) => typeof id === 'string' && isValidUUID(id)) : [],
      suggestions: Array.isArray(parsedResponse.suggestions) ? parsedResponse.suggestions : 
                  (typeof parsedResponse.suggestions === 'string') ? [parsedResponse.suggestions] : [],
    };
  } catch (error: any) {
    console.error("❌ OpenAI error:", error?.response?.data || error);

    if (error?.response?.status === 429) {
      throw new Error(
        "The AI is currently overloaded. Please try again shortly.",
      );
    }

    throw new Error("The AI failed to respond properly. Please try again.");
  }
}

export async function generateAIResponse(
  context: ConversationContext,
): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(context);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...context.conversationHistory,
    { role: "user" as const, content: context.userMessage },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error("❌ OpenAI response missing content:", response);
      throw new Error("AI response was empty. Please try again.");
    }

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (e) {
      console.error("❌ Failed to parse OpenAI response JSON:", rawContent);
      throw new Error("Failed to parse AI response JSON");
    }

    return {
      content: result.response || "すみません、もう一度言ってください。",
      english_translation: result.english_translation,
      feedback: result.feedback,
      vocabUsed: Array.isArray(result.vocabUsed)
        ? result.vocabUsed.filter((id: any) => typeof id === "number")
        : [],
      grammarUsed: Array.isArray(result.grammarUsed)
        ? result.grammarUsed.filter((id: any) => typeof id === "number")
        : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
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
      console.error(
        "❌ OpenAI introduction response missing content:",
        response,
      );
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
  const japaneseChars =
    text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)?.length || 0;
  return englishChars > japaneseChars * 1.5;
}

function buildSystemPrompt(context: ConversationContext): string {
  const topic = context.conversationTopic || 'general conversation';
  const { persona, scenario, targetVocab, targetGrammar, groupPromptSuffix, isGroupConversation, allPersonas } = context;
  
  let basePrompt = `You are ${persona.name}, ${persona.description}. ${persona.personality}

Speaking Style: ${persona.speaking_style}

You are helping a Japanese language learner practice conversation. Your goal is to:
1. Respond naturally in Japanese using vocabulary and grammar appropriate for JLPT ${scenario?.jlpt_level || 'N5'} level
2. Be encouraging and supportive
3. Use vocabulary from the target list when possible
4. Keep responses conversational and engaging

Target Vocabulary: ${targetVocab.map(v => `${v.kanji || v.hiragana} (${v.meaning})`).slice(0, 10).join(', ')}
Target Grammar: ${targetGrammar.map(g => g.pattern).slice(0, 5).join(', ')}

${scenario ? `Scenario: ${scenario.title} - ${scenario.description}` : 'Have a natural conversation in Japanese.'}`;

  // Add group conversation context if applicable
  if (isGroupConversation) {
    if (groupPromptSuffix) {
      basePrompt += `\n\nGroup Conversation Context: ${groupPromptSuffix}`;
    }
    
    if (allPersonas && allPersonas.length > 1) {
      const otherPersonas = allPersonas.filter(p => p.id !== persona.id);
      basePrompt += `\n\nOther AI participants in this conversation: ${otherPersonas.map(p => `${p.name} (${p.description})`).join(', ')}`;
      basePrompt += `\nYou are responding as ${persona.name}. Keep your response natural and in character. Focus on helping the human learner while maintaining the group conversation atmosphere.`;
    }
  }

  basePrompt += `\n\nImportant: Always respond in character as ${persona.name}. Keep responses natural and conversational.
  
RESPONSE FORMAT: Return valid JSON with: {"response": "Japanese text", "english_translation": "English", "feedback": "Learning tip", "vocabUsed": [], "grammarUsed": [], "suggestions": ["phrase1", "phrase2"]}`;

  return basePrompt;
}