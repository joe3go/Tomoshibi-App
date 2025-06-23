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

const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
});

export interface ConversationContext {
  persona: Persona;
  scenario: Scenario;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  targetVocab: JlptVocab[];
  targetGrammar: JlptGrammar[];
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
    const tutor = await getTutorById(tutorId);
    if (!tutor) {
      throw new Error(`Tutor with ID ${tutorId} not found`);
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    if (!rawContent) {
      console.error("❌ OpenAI response missing content:", response);
      throw new Error("AI response was empty. Please try again.");
    }

    return {
      content: rawContent,
      feedback: undefined,
      vocabUsed: [],
      grammarUsed: [],
      suggestions: [],
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
  return buildDynamicPrompt(
    {
      id: context.persona.id,
      name: context.persona.name,
      type: context.persona.type,
      personality: context.persona.personality,
      speaking_style: context.persona.speaking_style,
    },
    {
      userId: "temp", // override if needed
      username: "temp", // override if needed
      topic: context.scenario.title,
      prefersEnglish: isEnglishMessage(context.userMessage),
      vocab: context.targetVocab,
      grammar: context.targetGrammar,
      history: context.conversationHistory,
    },
  );
}
