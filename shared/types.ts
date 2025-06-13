
import { z } from 'zod';

// Core Domain Types
export const JLPTLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export type JLPTLevel = z.infer<typeof JLPTLevelSchema>;

export const ConversationPhaseSchema = z.enum(['guided', 'transitioning', 'open']);
export type ConversationPhase = z.infer<typeof ConversationPhaseSchema>;

export const ConversationStatusSchema = z.enum(['active', 'completed', 'paused']);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

export const MessageSenderSchema = z.enum(['user', 'ai']);
export type MessageSender = z.infer<typeof MessageSenderSchema>;

export const PersonaTypeSchema = z.enum(['teacher', 'friend']);
export type PersonaType = z.infer<typeof PersonaTypeSchema>;

export const WordTypeSchema = z.enum(['noun', 'verb', 'adjective', 'adverb', 'particle', 'expression']);
export type WordType = z.infer<typeof WordTypeSchema>;

// User Schemas
export const UserPreferencesSchema = z.object({
  preferredKanjiDisplay: z.enum(['furigana', 'kanji', 'hiragana']).default('furigana'),
  soundNotifications: z.boolean().default(true),
  desktopNotifications: z.boolean().default(true),
});

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  preferences: UserPreferencesSchema,
  createdAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Progress Tracking Schemas
export const ProgressMetricsSchema = z.object({
  current: z.number().min(0).max(100),
  total: z.number().min(0),
  streak: z.number().min(0),
  accuracy: z.number().min(0).max(100),
});

export const UserProgressSchema = z.object({
  id: z.number(),
  userId: z.number(),
  jlptLevel: JLPTLevelSchema,
  vocabEncountered: z.array(z.number()),
  vocabMastered: z.array(z.number()),
  grammarEncountered: z.array(z.number()),
  grammarMastered: z.array(z.number()),
  totalConversations: z.number(),
  totalMessagesSent: z.number(),
  metrics: ProgressMetricsSchema,
  lastActivity: z.date(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;
export type ProgressMetrics = z.infer<typeof ProgressMetricsSchema>;

// Vocabulary Schemas
export const VocabularyItemSchema = z.object({
  id: z.number(),
  kanji: z.string().nullable(),
  hiragana: z.string(),
  romaji: z.string().nullable(),
  englishMeaning: z.string(),
  jlptLevel: JLPTLevelSchema,
  wordType: WordTypeSchema.nullable(),
  frequency: z.number().default(0),
  createdAt: z.date(),
});

export const VocabTrackerEntrySchema = z.object({
  id: z.number(),
  userId: z.number(),
  wordId: z.number(),
  frequency: z.number(),
  userUsageCount: z.number(),
  aiEncounterCount: z.number(),
  lastSeenAt: z.date().nullable(),
  memoryStrength: z.number().min(0).max(100),
  nextReviewAt: z.date().nullable(),
  source: z.enum(['conversation', 'manual', 'hover']),
  word: VocabularyItemSchema.optional(),
});

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type VocabTrackerEntry = z.infer<typeof VocabTrackerEntrySchema>;

// Grammar Schemas
export const GrammarPatternSchema = z.object({
  id: z.number(),
  pattern: z.string(),
  englishExplanation: z.string(),
  exampleJapanese: z.string().nullable(),
  exampleEnglish: z.string().nullable(),
  jlptLevel: JLPTLevelSchema,
  createdAt: z.date(),
});

export type GrammarPattern = z.infer<typeof GrammarPatternSchema>;

// Persona Schemas
export const PersonalityTraitsSchema = z.object({
  enthusiasm: z.number().min(1).max(10),
  patience: z.number().min(1).max(10),
  formality: z.number().min(1).max(10),
  encouragement: z.number().min(1).max(10),
});

export const PersonaSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: PersonaTypeSchema,
  jlptLevel: JLPTLevelSchema,
  description: z.string().nullable(),
  systemPrompt: z.string(),
  personalityTraits: PersonalityTraitsSchema.nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.date(),
});

export type Persona = z.infer<typeof PersonaSchema>;
export type PersonalityTraits = z.infer<typeof PersonalityTraitsSchema>;

// Scenario Schemas
export const ScenarioSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  jlptLevel: JLPTLevelSchema,
  initialPrompt: z.string(),
  conversationTree: z.any().nullable(), // JSON structure
  targetVocabIds: z.array(z.number()),
  targetGrammarIds: z.array(z.number()),
  createdAt: z.date(),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

// Message Schemas
export const MessageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  sender: MessageSenderSchema,
  content: z.string(),
  feedback: z.string().nullable(),
  vocabUsed: z.array(z.number()),
  grammarUsed: z.array(z.number()),
  timestamp: z.date(),
});

export const ConversationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  personaId: z.number().nullable(),
  scenarioId: z.number().nullable(),
  phase: ConversationPhaseSchema,
  status: ConversationStatusSchema,
  startedAt: z.date(),
  completedAt: z.date().nullable(),
  persona: PersonaSchema.optional(),
  scenario: ScenarioSchema.optional(),
});

export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;

// API Response Schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number(),
  totalPages: z.number(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    pagination: PaginationSchema,
    error: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
  });

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination: z.infer<typeof PaginationSchema>;
  error?: string;
  timestamp: Date;
};

// Form Validation Schemas
export const LoginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

export const MessageFormSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
});

export type LoginForm = z.infer<typeof LoginFormSchema>;
export type RegisterForm = z.infer<typeof RegisterFormSchema>;
export type MessageForm = z.infer<typeof MessageFormSchema>;

// Performance Metrics
export const PerformanceMetricsSchema = z.object({
  responseTime: z.number(),
  memoryUsage: z.number(),
  renderTime: z.number(),
  bundleSize: z.number(),
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
