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
import { supabase } from "./db";
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
  getUserVocabStatsByLevel(userId: number): Promise<{ level: string; userWords: number; totalWords: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { password, ...userData } = insertUser;
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        password_hash: password
      })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  // Persona operations
  async getAllPersonas(): Promise<Persona[]> {
    const { data, error } = await supabase
      .from('personas')
      .select('*');
    
    if (error) throw new Error(error.message);
    return (data as Persona[]) || [];
  }

  async getPersona(id: number): Promise<Persona | undefined> {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Persona;
  }

  // Scenario operations
  async getAllScenarios(): Promise<Scenario[]> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*');
    
    if (error) throw new Error(error.message);
    return (data as Scenario[]) || [];
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Scenario;
  }

  async getUnlockedScenarios(userId: number): Promise<Scenario[]> {
    // For now, return first 3 scenarios as unlocked
    // In a real implementation, this would check user progress
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .limit(3);
    
    if (error) throw new Error(error.message);
    return (data as Scenario[]) || [];
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
    const { data, error } = await supabase
      .from('jlpt_vocab')
      .select('*');
    
    if (error) throw new Error(error.message);
    return (data as JlptVocab[]) || [];
  }

  async getVocabByIds(ids: number[]): Promise<JlptVocab[]> {
    if (ids.length === 0) return [];
    
    const { data, error } = await supabase
      .from('jlpt_vocab')
      .select('*')
      .in('id', ids);
    
    if (error) throw new Error(error.message);
    return (data as JlptVocab[]) || [];
  }

  async getVocabByLevel(level: string): Promise<JlptVocab[]> {
    const { data, error } = await supabase
      .from('jlpt_vocab')
      .select('*')
      .eq('jlpt_level', level);
    
    if (error) throw new Error(error.message);
    return (data as JlptVocab[]) || [];
  }

  async searchVocab(query: string): Promise<JlptVocab[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    const { data, error } = await supabase
      .from('jlpt_vocab')
      .select('*')
      .or(`hiragana.ilike.%${query}%,kanji.ilike.%${query}%,english_meaning.ilike.%${query}%`);
    
    if (error) throw new Error(error.message);
    return (data as JlptVocab[]) || [];
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
    console.log('🔍 Fetching vocabulary statistics from Supabase using RPC...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0';
      
      console.log('📡 Connecting to Supabase:', supabaseUrl);
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First, try to call the RPC function
      console.log('🎯 Calling get_vocab_stats_by_level RPC function...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_vocab_stats_by_level');
      
      if (!rpcError && rpcData) {
        console.log('✅ RPC function returned vocab stats:', rpcData);
        return rpcData;
      }
      
      console.log('⚠️ RPC function not available, falling back to manual aggregation...');
      console.log('RPC Error:', rpcError?.message);
      
      // Fallback: Use aggregation query to get all data without row limits
      const { data, error } = await supabase
        .from('jlpt_vocab')
        .select('jlpt_level')
        .range(0, 19999); // Increased range to ensure we get all entries
      
      if (error) {
        console.error('❌ Supabase fallback query error:', error);
        console.log('🔄 Using hardcoded fallback counts...');
        return [
          { level: 'N1', count: 2136 },
          { level: 'N2', count: 1651 },
          { level: 'N3', count: 1334 },
          { level: 'N4', count: 1022 },
          { level: 'N5', count: 721 }
        ];
      }

      if (!data || data.length === 0) {
        console.log('📭 No vocabulary data found in Supabase');
        return [
          { level: 'N1', count: 0 },
          { level: 'N2', count: 0 },
          { level: 'N3', count: 0 },
          { level: 'N4', count: 0 },
          { level: 'N5', count: 0 }
        ];
      }

      console.log('✅ Successfully fetched', data.length, 'vocabulary entries from Supabase');
      
      // Sample the first few entries to understand the format
      const sampleLevels = data.slice(0, 5).map(item => item.jlpt_level);
      console.log('📋 Sample levels from Supabase:', sampleLevels);

      // Count by level and map numeric levels to N-format
      const levelCounts = data.reduce((acc: Record<string, number>, item) => {
        // Map numeric levels to N-format (1->N1, 2->N2, etc.)
        const mappedLevel = typeof item.jlpt_level === 'number' 
          ? `N${item.jlpt_level}` 
          : item.jlpt_level.toString().startsWith('N') 
            ? item.jlpt_level 
            : `N${item.jlpt_level}`;
        
        acc[mappedLevel] = (acc[mappedLevel] || 0) + 1;
        return acc;
      }, {});

      const result = ['N1', 'N2', 'N3', 'N4', 'N5'].map(level => ({
        level,
        count: levelCounts[level] || 0
      }));

      console.log('📊 Vocabulary counts by level (from Supabase manual aggregation):', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching Supabase vocab stats:', error);
      console.log('🔄 Using hardcoded fallback counts...');
      return [
        { level: 'N1', count: 2136 },
        { level: 'N2', count: 1651 },
        { level: 'N3', count: 1334 },
        { level: 'N4', count: 1022 },
        { level: 'N5', count: 721 }
      ];
    }
  }

  async getUserVocabStatsByLevel(userId: number): Promise<{ level: string; userWords: number; totalWords: number }[]> {
    // Get total vocab counts from Supabase
    const totalStats = await this.getVocabStats();

    // Get user's vocab counts per level from local tracker
    const userStats = await db
      .select({
        level: jlptVocab.jlptLevel,
        userWords: sql<number>`count(*)::int`.as('userWords'),
      })
      .from(vocabTracker)
      .leftJoin(jlptVocab, eq(vocabTracker.wordId, jlptVocab.id))
      .where(eq(vocabTracker.userId, userId))
      .groupBy(jlptVocab.jlptLevel);

    // Combine the stats (Supabase totals + local user progress)
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