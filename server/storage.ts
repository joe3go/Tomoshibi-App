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

  async getUserConversations(userId: number): Promise<(Conversation & { messageCount: number; vocabWordsUsed: number })[]> {
    // Get conversations with message counts
    const conversationsWithCounts = await db
      .select({
        id: conversations.id,
        userId: conversations.userId,
        personaId: conversations.personaId,
        scenarioId: conversations.scenarioId,
        phase: conversations.phase,
        status: conversations.status,
        startedAt: conversations.startedAt,
        completedAt: conversations.completedAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.startedAt));

    // Get message counts and vocabulary data for each conversation
    const conversationsWithStats = await Promise.all(
      conversationsWithCounts.map(async (conv) => {
        const msgs = await this.getConversationMessages(conv.id);
        const vocabWordsUsed = new Set(
          msgs.flatMap(msg => msg.vocabUsed || [])
        ).size;
        
        return {
          ...conv,
          messageCount: msgs.length,
          vocabWordsUsed,
        };
      })
    );

    return conversationsWithStats;
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

  async searchVocab(query: string): Promise<JlptVocab[]> {
    // Simplified search - in real implementation would use proper text search
    return await db.select().from(jlptVocab);
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
    // First try to find existing record
    const existing = await this.getVocabTracker(userId, wordId);
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(vocabTracker)
        .set(updates)
        .where(and(eq(vocabTracker.userId, userId), eq(vocabTracker.wordId, wordId)))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(vocabTracker)
        .values({ userId, wordId, ...updates })
        .returning();
      return created;
    }
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
}

export const storage = new DatabaseStorage();
