import {
  users,
  personas,
  scenarios,
  conversations,
  messages,
  jlptVocab,
  jlptGrammar,
  userProgress,
  vocabTracker,
  type User,
  type InsertUser,
  type Persona,
  type Scenario,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type JlptVocab,
  type JlptGrammar,
  type UserProgress,
  type InsertUserProgress,
  type VocabTracker,
  type InsertVocabTracker,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Persona operations
  getAllPersonas(): Promise<Persona[]>;
  getPersona(id: number): Promise<Persona | undefined>;

  // Scenario operations
  getAllScenarios(): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  getUnlockedScenarios(userId: number): Promise<Scenario[]>;

  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;

  // Vocabulary operations
  getAllVocab(): Promise<JlptVocab[]>;
  getVocabByLevel(level: string): Promise<JlptVocab[]>;
  getVocabByIds(ids: number[]): Promise<JlptVocab[]>;
  searchVocab(query: string): Promise<JlptVocab[]>;

  // Grammar operations
  getAllGrammar(): Promise<JlptGrammar[]>;
  getGrammarByIds(ids: number[]): Promise<JlptGrammar[]>;

  // Progress operations
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: number, progress: InsertUserProgress): Promise<UserProgress>;

  // Vocabulary tracker operations
  getVocabTracker(userId: number, wordId: number): Promise<VocabTracker | undefined>;
  createVocabTracker(tracker: InsertVocabTracker): Promise<VocabTracker>;
  updateVocabTracker(userId: number, wordId: number, updates: Partial<VocabTracker>): Promise<VocabTracker>;
  getUserVocabTracker(userId: number): Promise<(VocabTracker & { word: JlptVocab })[]>;
  incrementWordFrequency(userId: number, wordId: number, source?: 'user' | 'ai' | 'hover'): Promise<VocabTracker>;
  getVocabStats(): Promise<{ level: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { password, ...userData } = insertUser;
    const [user] = await db.insert(users).values({
      ...userData,
      passwordHash: password
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Persona operations
  async getAllPersonas(): Promise<Persona[]> {
    return await db.select().from(personas);
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }

  // Scenario operations
  async getAllScenarios(): Promise<Scenario[]> {
    return await db.select().from(scenarios);
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async getUnlockedScenarios(userId: number): Promise<Scenario[]> {
    // For now, return first 3 scenarios as unlocked
    // In a real implementation, this would check user progress
    const allScenarios = await db.select().from(scenarios);
    return allScenarios.slice(0, 3);
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(conversation).returning();
    return conv;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.startedAt));
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(message).returning();
    return msg;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  // Vocabulary operations
  async getAllVocab(): Promise<JlptVocab[]> {
    return await db.select().from(jlptVocab);
  }

  async getVocabByIds(ids: number[]): Promise<JlptVocab[]> {
    if (ids.length === 0) return [];
    return await db.select().from(jlptVocab).where(
      // Use proper SQL IN operator
      eq(jlptVocab.id, ids[0]) // Simplified for now, would need proper IN implementation
    );
  }

  async getVocabByLevel(level: string): Promise<JlptVocab[]> {
    return await db.select().from(jlptVocab).where(eq(jlptVocab.jlptLevel, level));
  }

  async searchVocab(query: string): Promise<JlptVocab[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    return await db.select().from(jlptVocab).where(
      or(
        like(jlptVocab.hiragana, `%${query}%`),
        like(jlptVocab.kanji, `%${query}%`),
        like(jlptVocab.englishMeaning, `%${query}%`)
      )
    );
  }

  // Grammar operations
  async getAllGrammar(): Promise<JlptGrammar[]> {
    return await db.select().from(jlptGrammar);
  }

  async getGrammarByIds(ids: number[]): Promise<JlptGrammar[]> {
    if (ids.length === 0) return [];
    return await db.select().from(jlptGrammar).where(
      eq(jlptGrammar.id, ids[0]) // Simplified for now
    );
  }

  // Progress operations
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    return progress;
  }

  async updateUserProgress(userId: number, progress: InsertUserProgress): Promise<UserProgress> {
    const [updated] = await db
      .insert(userProgress)
      .values({ ...progress, userId })
      .onConflictDoUpdate({
        target: [userProgress.userId],
        set: progress,
      })
      .returning();
    return updated;
  }

  // Vocabulary tracker operations
  async getVocabTracker(userId: number, wordId: number): Promise<VocabTracker | undefined> {
    const [tracker] = await db
      .select()
      .from(vocabTracker)
      .where(and(eq(vocabTracker.userId, userId), eq(vocabTracker.wordId, wordId)));
    return tracker;
  }

  async createVocabTracker(tracker: InsertVocabTracker): Promise<VocabTracker> {
    const [created] = await db
      .insert(vocabTracker)
      .values(tracker)
      .returning();
    return created;
  }

  async updateVocabTracker(userId: number, wordId: number, updates: Partial<VocabTracker>): Promise<VocabTracker> {
    const [updated] = await db
      .insert(vocabTracker)
      .values({ userId, wordId, ...updates })
      .onConflictDoUpdate({
        target: [vocabTracker.userId, vocabTracker.wordId],
        set: updates,
      })
      .returning();
    return updated;
  }

  async getUserVocabTracker(userId: number): Promise<(VocabTracker & { word: JlptVocab })[]> {
    const result = await db
      .select({
        id: vocabTracker.id,
        userId: vocabTracker.userId,
        wordId: vocabTracker.wordId,
        frequency: vocabTracker.frequency,
        userUsageCount: vocabTracker.userUsageCount,
        aiEncounterCount: vocabTracker.aiEncounterCount,
        lastSeenAt: vocabTracker.lastSeenAt,
        memoryStrength: vocabTracker.memoryStrength,
        nextReviewAt: vocabTracker.nextReviewAt,
        source: vocabTracker.source,
        word: jlptVocab,
      })
      .from(vocabTracker)
      .innerJoin(jlptVocab, eq(vocabTracker.wordId, jlptVocab.id))
      .where(eq(vocabTracker.userId, userId))
      .orderBy(desc(vocabTracker.frequency));
    return result;
  }

  async incrementWordFrequency(userId: number, wordId: number, source: 'user' | 'ai' | 'hover' = 'hover'): Promise<VocabTracker> {
    const existing = await this.getVocabTracker(userId, wordId);

    if (existing) {
      const updates: Partial<VocabTracker> = {
        frequency: (existing.frequency || 0) + 1,
        lastSeenAt: new Date(),
      };

      if (source === 'user') {
        updates.userUsageCount = (existing.userUsageCount || 0) + 1;
      } else if (source === 'ai') {
        updates.aiEncounterCount = (existing.aiEncounterCount || 0) + 1;
      }

      return await this.updateVocabTracker(userId, wordId, updates);
    } else {
      const newTracker: InsertVocabTracker = {
        userId,
        wordId,
        frequency: 1,
        userUsageCount: source === 'user' ? 1 : 0,
        aiEncounterCount: source === 'ai' ? 1 : 0,
        lastSeenAt: new Date(),
        memoryStrength: 0,
        source: source === 'hover' ? 'manual' : 'conversation',
      };

      return await this.createVocabTracker(newTracker);
    }
  }

  async getVocabStats(): Promise<{ level: string; count: number }[]> {
    const stats = await db
      .select({
        level: jlptVocab.jlptLevel,
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(jlptVocab)
      .groupBy(jlptVocab.jlptLevel)
      .orderBy(jlptVocab.jlptLevel);

    // Map numeric levels to proper JLPT level names if needed
    return stats.map(stat => {
      const levelMapping: Record<string, string> = {
        '1': 'N5',
        '2': 'N4', 
        '3': 'N3',
        '4': 'N2',
        '5': 'N1'
      };

      return {
        level: levelMapping[stat.level] || stat.level,
        count: stat.count
      };
    });
  }

  async getUserVocabTracker(userId: number): Promise<any[]> {
    const trackerData = await db
      .select({
        id: vocabTracker.id,
        userId: vocabTracker.userId,
        wordId: vocabTracker.wordId,
        frequency: vocabTracker.frequency,
        userUsageCount: vocabTracker.userUsageCount,
        aiEncounterCount: vocabTracker.aiEncounterCount,
        lastSeenAt: vocabTracker.lastSeenAt,
        memoryStrength: vocabTracker.memoryStrength,
        nextReviewAt: vocabTracker.nextReviewAt,
        source: vocabTracker.source,
        word: {
          id: jlptVocab.id,
          kanji: jlptVocab.kanji,
          hiragana: jlptVocab.hiragana,
          englishMeaning: jlptVocab.englishMeaning,
          jlptLevel: jlptVocab.jlptLevel,
          wordType: jlptVocab.wordType,
        },
      })
      .from(vocabTracker)
      .leftJoin(jlptVocab, eq(vocabTracker.wordId, jlptVocab.id))
      .where(eq(vocabTracker.userId, userId));

    return trackerData;
  }

  async getUserVocabStatsByLevel(userId: number): Promise<{ level: string; userWords: number; totalWords: number }[]> {
    // Get total vocab counts per level
    const totalStats = await this.getVocabStats();

    // Get user's vocab counts per level
    const userStats = await db
      .select({
        level: jlptVocab.jlptLevel,
        userWords: sql<number>`count(*)::int`.as('userWords'),
      })
      .from(vocabTracker)
      .leftJoin(jlptVocab, eq(vocabTracker.wordId, jlptVocab.id))
      .where(eq(vocabTracker.userId, userId))
      .groupBy(jlptVocab.jlptLevel);

    // Combine the stats
    const combined = totalStats.map(total => {
      const userStat = userStats.find(user => user.level === total.level);
      return {
        level: total.level,
        userWords: userStat?.userWords || 0,
        totalWords: total.count
      };
    });

    return combined;
  }
}

export const storage = new DatabaseStorage();