import OpenAI from "openai";
import type { Persona, Scenario, JlptVocab, JlptGrammar } from "@shared/schema";
import { buildSystemPrompt as buildDynamicPrompt, getTutorById, buildUserContext, logPromptUsage, type Tutor, type UserContext } from "./prompt-builder";

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

// New secure dynamic prompt-based AI response function
export async function generateSecureAIResponse(
  tutorId: number, 
  userId: string, 
  username: string, 
  userMessage: string, 
  topic: string, 
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  prefersEnglish: boolean = false
): Promise<AIResponse> {
  try {
    // Get tutor data from Supabase
    const tutor = await getTutorById(tutorId);
    if (!tutor) {
      throw new Error(`Tutor with ID ${tutorId} not found`);
    }

    // Build user context
    const userContext = await buildUserContext(userId, username, topic, prefersEnglish);
    
    // Generate secure, tutor-specific system prompt
    const systemPrompt = buildDynamicPrompt(tutor, userContext);
    
    // Log usage for analytics (without sensitive data)
    logPromptUsage(tutorId, userId, topic);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || "すみません、もう一度言ってください。";

    return {
      content,
      feedback: undefined,
      vocabUsed: [],
      grammarUsed: [],
      suggestions: [],
    };
  } catch (error) {
    console.error('Error generating secure AI response:', error);
    throw error;
  }
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
      vocabUsed: Array.isArray(result.vocabUsed) ? result.vocabUsed.filter((id: any) => typeof id === 'number') : [],
      grammarUsed: Array.isArray(result.grammarUsed) ? result.grammarUsed.filter((id: any) => typeof id === 'number') : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

// Helper function to detect if text is primarily English
function isEnglishMessage(text: string): boolean {
  const englishChars = text.match(/[a-zA-Z\s.,!?'"]/g)?.length || 0;
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)?.length || 0;
  return englishChars > japaneseChars * 1.5;
}

function buildSystemPrompt(context: ConversationContext): string {
  const { persona, scenario, conversationHistory, targetVocab, targetGrammar, userMessage } = context;
  
  const vocabList = targetVocab.map(v => 
    `${v.kanji || v.hiragana} (${v.hiragana}) - ${v.englishMeaning}`
  ).join(', ');
  
  const grammarList = targetGrammar.map(g => 
    `${g.pattern} - ${g.meaning}`
  ).join(', ');

  // Analyze user performance from conversation history
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const messageCount = userMessages.length;
  const avgMessageLength = messageCount > 0 ? userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / messageCount : 0;
  const skillLevel = messageCount > 3 && avgMessageLength > 20 ? 'intermediate' : 'beginner';
  
  // Detect if current message is in English (question/explanation request)
  const isEnglishQuery = isEnglishMessage(userMessage);

  let adaptiveInstructions = '';
  if (persona.type === 'teacher') {
    adaptiveInstructions = `You are Aoi-sensei, a highly adaptive formal Japanese teacher with deep cultural insight.

ADAPTIVE TEACHING APPROACH:
- Be highly attuned to subtle grammatical and politeness errors, providing gentle but precise corrections
- Offer deeper explanations of WHY certain phrases are used in formal contexts (cultural reasoning)
- Proactively introduce new, slightly more complex formal expressions when user demonstrates readiness
- Focus on keigo (honorific language) and proper social context
- Current user skill assessment: ${skillLevel}

ENGLISH QUESTION HANDLING:
- When user asks in English: First provide a comprehensive explanation in clear English
- Follow with: "Now let's practice this in Japanese:" and continue the conversation naturally
- For grammar questions: Explain the rule, give examples, then practice together
- For vocabulary questions: Define the word, show usage patterns, then use it in conversation
- For cultural questions: Explain the cultural context thoroughly before practicing

DYNAMIC ADJUSTMENT RULES:
- If user makes politeness errors: Explain social context with cultural insight
- If user shows confidence (longer messages, complex grammar): Gradually introduce more sophisticated formal patterns
- If user struggles (short messages, basic errors): Simplify language and provide more scaffolding
- Monitor vocabulary usage accuracy and adjust complexity accordingly

CORRECTION STYLE: "That's a good attempt! In formal situations, we would say [correction] because [cultural/grammatical reasoning]..."`;
  } else {
    adaptiveInstructions = `You are Haruki, an adaptive casual Japanese friend who naturally adjusts to your conversation partner.

ADAPTIVE CONVERSATION APPROACH:
- Focus less on strict grammatical perfection, more on natural flow and appropriate casual expressions
- Introduce slang or common casual phrases naturally into conversation
- Encourage experimentation with different casual forms without heavy penalization
- Use contractions, casual particles, and modern expressions naturally
- Current user skill assessment: ${skillLevel}

ENGLISH QUESTION HANDLING:
- When user asks in English: Answer like a helpful friend would - casual but informative
- Follow with: "Let's try using that in Japanese!" and naturally continue the conversation
- For slang questions: Explain when/how to use it, then demonstrate in context
- For casual form questions: Show the difference between formal/casual, then practice
- Make explanations fun and relatable to everyday situations

DYNAMIC ADJUSTMENT RULES:
- If user is too formal: Gently guide toward casual speech with natural examples
- If user experiments with casual forms: Encourage and refine naturally without harsh correction
- If user seems overwhelmed (short responses): Slow down and use simpler casual patterns
- If user is confident (complex casual attempts): Introduce trendy slang and colloquialisms
- Adjust speaking speed and vocabulary complexity based on response patterns

CORRECTION STYLE: "Ah, that's close! We'd usually say [correction] in casual conversation" or "Nice try! Here's how we'd say that casually: [example]"`;
  }

  return `${adaptiveInstructions}

SCENARIO: ${scenario.title} - ${scenario.description}
PERSONA TRAITS: ${JSON.stringify(persona.personalityTraits)}

REAL-TIME PERFORMANCE MONITORING:
- User message count: ${messageCount}
- Average message complexity: ${avgMessageLength > 30 ? 'high' : avgMessageLength > 15 ? 'medium' : 'low'}
- Assessed skill level: ${skillLevel}

TARGET VOCABULARY: ${vocabList}
TARGET GRAMMAR: ${grammarList}

ADAPTIVE RESPONSE GUIDELINES:
1. Monitor user's vocabulary accuracy, grammar confidence, and response complexity
2. Subtly adjust your vocabulary complexity, speaking speed, and response intricacy in real-time
3. Provide corrections appropriate to your persona's teaching style
4. Naturally incorporate target vocabulary/grammar at appropriate difficulty level
5. Keep responses conversational but adjust complexity dynamically based on user performance
6. Respond primarily in Japanese with explanations when helpful for learning
7. IMPORTANT: Always format kanji with furigana readings using parentheses: 漢字(かんじ). This helps users learn pronunciation and reading.

CONVERSATION HISTORY FOR CONTEXT:
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

ENGLISH QUESTION DETECTION: ${isEnglishQuery ? 'TRUE - User asked in English' : 'FALSE - User responded in Japanese'}

RESPONSE FORMAT (JSON):
${isEnglishQuery ? `{
  "response": "First provide a clear English explanation addressing their question, then follow with: 'Now let's practice this in Japanese:' and continue with appropriate Japanese response using furigana notation: 漢字(かんじ)",
  "english": "English explanation of the concept/answer",
  "feedback": "Encouraging feedback about their question and learning approach",
  "vocabUsed": [array of vocab IDs used in Japanese portion],
  "grammarUsed": [array of grammar IDs used in Japanese portion],
  "suggestions": ["helpful phrases to continue the conversation in Japanese"]
}` : `{
  "response": "Your adaptive Japanese response with furigana notation for kanji. Format kanji with readings as: 漢字(かんじ) using parentheses immediately after each kanji. Always include furigana for N5 level kanji to help learning.",
  "english": "English translation of your Japanese response",
  "feedback": "Persona-appropriate feedback based on user's demonstrated level",
  "vocabUsed": [array of vocab IDs used],
  "grammarUsed": [array of grammar IDs used], 
  "suggestions": ["adaptive phrases suited to user's current level"]
}`}

Adapt your response complexity, correction style, and vocabulary introduction based on the user's demonstrated ability and your persona's adaptive teaching approach.`;
}

export async function generateScenarioIntroduction(persona: Persona, scenario: Scenario): Promise<string> {
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
