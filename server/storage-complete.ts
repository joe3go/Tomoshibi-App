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
import { getDatabase, isDatabaseAvailable } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IDataStorageInterface {
  // User account management operations
  getUserAccountById(id: number): Promise<User | undefined>;
  getUserAccountByEmail(email: string): Promise<User | undefined>;
  createUserAccount(user: InsertUser): Promise<User>;
  updateUserAccount(id: number, updates: Partial<User>): Promise<User>;

  // Teaching persona management operations
  getAllTeachingPersonas(): Promise<Persona[]>;
  getTeachingPersonaById(id: number): Promise<Persona | undefined>;

  // Learning scenario management operations
  getAllLearningScenarios(): Promise<Scenario[]>;
  getLearningScenarioById(id: number): Promise<Scenario | undefined>;
  getUserUnlockedScenarios(userId: number): Promise<Scenario[]>;

  // Conversation session management operations
  createConversationSession(conversation: InsertConversation): Promise<Conversation>;
  getConversationSessionById(id: number): Promise<Conversation | undefined>;
  getUserConversationSessions(userId: number): Promise<Conversation[]>;
  updateConversationSession(id: number, updates: Partial<Conversation>): Promise<Conversation>;

  // Conversation message operations
  createConversationMessage(message: InsertMessage): Promise<Message>;
  getConversationMessageHistory(conversationId: number): Promise<Message[]>;

  // Vocabulary word management operations
  getAllVocabularyWords(): Promise<JlptVocab[]>;
  getVocabularyWordsByIds(ids: number[]): Promise<JlptVocab[]>;
  searchVocabularyWords(query: string): Promise<JlptVocab[]>;

  // Grammar pattern management operations
  getAllGrammarPatterns(): Promise<JlptGrammar[]>;
  getGrammarPatternsByIds(ids: number[]): Promise<JlptGrammar[]>;

  // User learning progress operations
  getUserLearningProgress(userId: number): Promise<UserProgress | undefined>;
  updateUserLearningProgress(userId: number, progress: InsertUserProgress): Promise<UserProgress>;

  // Vocabulary tracking system operations
  getVocabularyTrackingEntry(userId: number, wordId: number): Promise<VocabTracker | undefined>;
  createVocabularyTrackingEntry(tracker: InsertVocabTracker): Promise<VocabTracker>;
  updateVocabularyTrackingEntry(userId: number, wordId: number, updates: Partial<VocabTracker>): Promise<VocabTracker>;
  getUserVocabularyTrackingData(userId: number): Promise<(VocabTracker & { word: JlptVocab })[]>;
  incrementVocabularyWordFrequency(userId: number, wordId: number, source?: 'user' | 'ai' | 'hover'): Promise<VocabTracker>;
}

export class DatabaseStorage implements IDataStorageInterface {
  private getDb() {
    if (!isDatabaseAvailable()) {
      throw new Error("Database is not available. Please check your DATABASE_URL configuration.");
    }
    return getDatabase();
  }

  // User account management operations
  async getUserAccountById(id: number): Promise<User | undefined> {
    const db = this.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserAccountByEmail(email: string): Promise<User | undefined> {
    const db = this.getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUserAccount(insertUser: InsertUser): Promise<User> {
    const db = this.getDb();
    const { password, ...userData } = insertUser;
    const [user] = await db.insert(users).values({
      ...userData,
      passwordHash: password
    }).returning();
    return user;
  }

  async updateUserAccount(id: number, updates: Partial<User>): Promise<User> {
    const db = this.getDb();
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Teaching persona management operations
  async getAllTeachingPersonas(): Promise<Persona[]> {
    const db = this.getDb();
    return await db.select().from(personas);
  }

  async getTeachingPersonaById(id: number): Promise<Persona | undefined> {
    const db = this.getDb();
    const [persona] = await db.select().from(personas).where(eq(personas.id, id));
    return persona;
  }

  // Learning scenario management operations
  async getAllLearningScenarios(): Promise<Scenario[]> {
    const db = this.getDb();
    return await db.select().from(scenarios);
  }

  async getLearningScenarioById(id: number): Promise<Scenario | undefined> {
    const db = this.getDb();
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async getUserUnlockedScenarios(userId: number): Promise<Scenario[]> {
    const db = this.getDb();
    // For now, return all scenarios. In the future, implement unlock logic
    return await db.select().from(scenarios);
  }

  // Conversation session management operations
  async createConversationSession(conversation: InsertConversation): Promise<Conversation> {
    const db = this.getDb();
    const [conv] = await db.insert(conversations).values(conversation).returning();
    return conv;
  }

  async getConversationSessionById(id: number): Promise<Conversation | undefined> {
    const db = this.getDb();
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversationSessions(userId: number): Promise<Conversation[]> {
    const db = this.getDb();
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));
  }

  async updateConversationSession(id: number, updates: Partial<Conversation>): Promise<Conversation> {
    const db = this.getDb();
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  // Conversation message operations
  async createConversationMessage(message: InsertMessage): Promise<Message> {
    const db = this.getDb();
    const conv = await this.getConversationSessionById(message.conversationId);
    if (!conv) {
      throw new Error(`Conversation with id ${message.conversationId} not found`);
    }

    const [msg] = await db.insert(messages).values(message).returning();
    
    // Update conversation lastMessageAt
    await this.updateConversationSession(message.conversationId, {
      lastMessageAt: new Date()
    });

    return msg;
  }

  async getConversationMessageHistory(conversationId: number): Promise<Message[]> {
    const db = this.getDb();
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  // Vocabulary word management operations
  async getAllVocabularyWords(): Promise<JlptVocab[]> {
    const db = this.getDb();
    return await db.select().from(jlptVocab);
  }

  async getVocabularyWordsByIds(ids: number[]): Promise<JlptVocab[]> {
    const db = this.getDb();
    return await db.select().from(jlptVocab);
  }

  async searchVocabularyWords(query: string): Promise<JlptVocab[]> {
    const db = this.getDb();
    return await db.select().from(jlptVocab);
  }

  // Grammar pattern management operations
  async getAllGrammarPatterns(): Promise<JlptGrammar[]> {
    const db = this.getDb();
    return await db.select().from(jlptGrammar);
  }

  async getGrammarPatternsByIds(ids: number[]): Promise<JlptGrammar[]> {
    const db = this.getDb();
    return await db.select().from(jlptGrammar);
  }

  // User learning progress operations
  async getUserLearningProgress(userId: number): Promise<UserProgress | undefined> {
    const db = this.getDb();
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    return progress;
  }

  async updateUserLearningProgress(userId: number, progress: InsertUserProgress): Promise<UserProgress> {
    const db = this.getDb();
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

  // Vocabulary tracking system operations
  async getVocabularyTrackingEntry(userId: number, wordId: number): Promise<VocabTracker | undefined> {
    const db = this.getDb();
    const [tracker] = await db
      .select()
      .from(vocabTracker)
      .where(and(eq(vocabTracker.userId, userId), eq(vocabTracker.wordId, wordId)));
    return tracker;
  }

  async createVocabularyTrackingEntry(tracker: InsertVocabTracker): Promise<VocabTracker> {
    const db = this.getDb();
    const [created] = await db
      .insert(vocabTracker)
      .values(tracker)
      .returning();
    return created;
  }

  async updateVocabularyTrackingEntry(userId: number, wordId: number, updates: Partial<VocabTracker>): Promise<VocabTracker> {
    const db = this.getDb();
    const [updated] = await db
      .update(vocabTracker)
      .set(updates)
      .where(and(eq(vocabTracker.userId, userId), eq(vocabTracker.wordId, wordId)))
      .returning();
    return updated;
  }

  async getUserVocabularyTrackingData(userId: number): Promise<(VocabTracker & { word: JlptVocab })[]> {
    const db = this.getDb();
    return await db
      .select()
      .from(vocabTracker)
      .leftJoin(jlptVocab, eq(vocabTracker.wordId, jlptVocab.id))
      .where(eq(vocabTracker.userId, userId)) as any;
  }

  async incrementVocabularyWordFrequency(userId: number, wordId: number, source: 'user' | 'ai' | 'hover' = 'conversation'): Promise<VocabTracker> {
    const existing = await this.getVocabularyTrackingEntry(userId, wordId);
    
    if (existing) {
      const updates: Partial<VocabTracker> = {
        frequency: (existing.frequency || 0) + 1,
        lastSeenAt: new Date(),
        source,
      };

      if (source === 'user') {
        updates.userUsageCount = (existing.userUsageCount || 0) + 1;
      } else if (source === 'ai') {
        updates.aiEncounterCount = (existing.aiEncounterCount || 0) + 1;
      }

      return await this.updateVocabularyTrackingEntry(userId, wordId, updates);
    } else {
      const newTracker: InsertVocabTracker = {
        userId,
        wordId,
        frequency: 1,
        userUsageCount: source === 'user' ? 1 : 0,
        aiEncounterCount: source === 'ai' ? 1 : 0,
        lastSeenAt: new Date(),
        source,
        memoryStrength: 1,
      };

      return await this.createVocabularyTrackingEntry(newTracker);
    }
  }
}

export const storage = new DatabaseStorage();