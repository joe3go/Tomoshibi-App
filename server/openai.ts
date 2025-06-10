import OpenAI from "openai";
import type { Persona, Scenario, JlptVocab, JlptGrammar } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

export interface ConversationContext {
  persona: Persona;
  scenario: Scenario;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
  targetVocab: JlptVocab[];
  targetGrammar: JlptGrammar[];
}

export interface AIResponse {
  content: string;
  feedback?: string;
  vocabUsed: number[];
  grammarUsed: number[];
  suggestions: string[];
}

export async function generateAIResponse(context: ConversationContext): Promise<AIResponse> {
  const systemPrompt = buildSystemPrompt(context);
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...context.conversationHistory,
    { role: 'user' as const, content: context.userMessage }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      content: result.response || "すみません、もう一度言ってください。",
      feedback: result.feedback,
      vocabUsed: result.vocabUsed || [],
      grammarUsed: result.grammarUsed || [],
      suggestions: result.suggestions || [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

function buildSystemPrompt(context: ConversationContext): string {
  const { persona, scenario, targetVocab, targetGrammar } = context;
  
  const vocabList = targetVocab.map(v => 
    `${v.kanji || v.hiragana} (${v.hiragana}) - ${v.englishMeaning}`
  ).join(', ');
  
  const grammarList = targetGrammar.map(g => 
    `${g.pattern} - ${g.englishExplanation}`
  ).join(', ');

  return `You are ${persona.name}, a ${persona.type} helping someone learn Japanese at JLPT N5 level.

PERSONA TRAITS: ${JSON.stringify(persona.personalityTraits)}
SCENARIO: ${scenario.title} - ${scenario.description}
SPEECH STYLE: ${persona.type === 'teacher' ? 'Polite, formal Japanese (です/ます form)' : 'Casual, friendly Japanese'}

TARGET VOCABULARY: ${vocabList}
TARGET GRAMMAR: ${grammarList}

INSTRUCTIONS:
1. Respond naturally in Japanese with furigana for kanji when helpful
2. Keep responses at JLPT N5 level
3. Provide gentle feedback on user's Japanese
4. Guide conversation toward scenario goals
5. Include English translation for clarity
6. Suggest helpful phrases when appropriate

RESPONSE FORMAT (JSON):
{
  "response": "Your Japanese response with any necessary furigana",
  "english": "English translation",
  "feedback": "Gentle feedback on user's message (if applicable)",
  "vocabUsed": [array of vocab IDs used],
  "grammarUsed": [array of grammar IDs used],
  "suggestions": ["helpful phrase 1", "helpful phrase 2"]
}

Be encouraging and patient. Focus on building confidence while gently correcting mistakes.`;
}

export async function generateScenarioIntroduction(persona: Persona, scenario: Scenario): Promise<string> {
  const systemPrompt = `You are ${persona.name}, starting a new conversation scenario: ${scenario.title}.
  
Provide a warm, encouraging introduction in Japanese (with English translation) that:
1. Greets the student appropriately for your persona
2. Introduces the scenario topic
3. Gives the first prompt to get the conversation started
4. Uses JLPT N5 level Japanese only

Keep it natural and encouraging. Response should be in plain text, not JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'system', content: systemPrompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "こんにちは！始めましょう。";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "こんにちは！始めましょう。Hello! Let's begin.";
  }
}
