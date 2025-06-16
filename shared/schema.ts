import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  varchar,
  boolean,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }),
  profileImageUrl: text("profile_image_url"),
  preferredKanjiDisplay: varchar("preferred_kanji_display", { length: 20 }).default("furigana"),
  soundNotifications: boolean("sound_notifications").default(true),
  desktopNotifications: boolean("desktop_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Personas for different teaching styles
export const personas = pgTable("personas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'teacher', 'friend'
  jlptLevel: varchar("jlpt_level", { length: 10 }).default("N5"),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  personalityTraits: jsonb("personality_traits"),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// JLPT N5 vocabulary reference
export const jlptVocab = pgTable("jlpt_vocab", {
  id: serial("id").primaryKey(),
  kanji: varchar("kanji", { length: 50 }),
  hiragana: varchar("hiragana", { length: 100 }).notNull(),
  romaji: varchar("romaji", { length: 100 }),
  englishMeaning: text("english_meaning").notNull(),
  jlptLevel: varchar("jlpt_level", { length: 10 }).default("N5"),
  wordType: varchar("word_type", { length: 20 }), // 'noun', 'verb', 'adjective', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// JLPT N5 grammar patterns
export const jlptGrammar = pgTable("jlpt_grammar", {
  id: serial("id").primaryKey(),
  pattern: varchar("pattern", { length: 100 }).notNull(),
  meaning: text("meaning").notNull(),
  jlptLevel: varchar("jlpt_level", { length: 10 }).default("N5"),
  exampleSentence: text("example_sentence"),
  exampleTranslation: text("example_translation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation scenarios
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  jlptLevel: varchar("jlpt_level", { length: 10 }).default("N5"),
  initialPrompt: text("initial_prompt").notNull(),
  conversationTree: jsonb("conversation_tree"),
  targetVocabIds: integer("target_vocab_ids").array(),
  targetGrammarIds: integer("target_grammar_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  personaId: integer("persona_id").references(() => personas.id),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  phase: varchar("phase", { length: 20 }).default("guided"), // 'guided', 'transitioning', 'open'
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'completed', 'paused'
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Individual messages in conversations
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  sender: varchar("sender", { length: 10 }).notNull(), // 'user', 'ai'
  content: text("content").notNull(),
  feedback: text("feedback"),
  vocabUsed: integer("vocab_used").array(),
  grammarUsed: integer("grammar_used").array(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  jlptLevel: varchar("jlpt_level", { length: 10 }).default("N5"),
  vocabEncountered: integer("vocab_encountered").array().default([]),
  vocabMastered: integer("vocab_mastered").array().default([]),
  grammarEncountered: integer("grammar_encountered").array().default([]),
  grammarMastered: integer("grammar_mastered").array().default([]),
  totalConversations: integer("total_conversations").default(0),
  totalMessagesSent: integer("total_messages_sent").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
});

// Vocabulary tracker for individual user-word relationships
export const vocabTracker = pgTable("vocab_tracker", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  wordId: integer("word_id").references(() => jlptVocab.id).notNull(),
  frequency: integer("frequency").default(0),
  userUsageCount: integer("user_usage_count").default(0),
  aiEncounterCount: integer("ai_encounter_count").default(0),
  lastSeenAt: timestamp("last_seen_at"),
  memoryStrength: integer("memory_strength").default(0),
  nextReviewAt: timestamp("next_review_at"),
  source: varchar("source", { length: 20 }).default("conversation"), // 'conversation', 'manual', 'hover'
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertPersonaSchema = createInsertSchema(personas).omit({
  id: true,
  createdAt: true,
});

export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertVocabSchema = createInsertSchema(jlptVocab).omit({
  id: true,
  createdAt: true,
});

export const insertGrammarSchema = createInsertSchema(jlptGrammar).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  lastActivity: true,
});

export const insertVocabTrackerSchema = createInsertSchema(vocabTracker).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Persona = typeof personas.$inferSelect;
export type InsertPersona = z.infer<typeof insertPersonaSchema>;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type JlptVocab = typeof jlptVocab.$inferSelect;
export type InsertJlptVocab = z.infer<typeof insertVocabSchema>;
export type JlptGrammar = typeof jlptGrammar.$inferSelect;
export type InsertJlptGrammar = z.infer<typeof insertGrammarSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type VocabTracker = typeof vocabTracker.$inferSelect;
export type InsertVocabTracker = z.infer<typeof insertVocabTrackerSchema>;
