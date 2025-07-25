
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
import { createClient } from '@supabase/supabase-js';
import { uuidToInt, validateUuid } from './uuid-mapping';

// Environment-specific Supabase configuration
const isDevelopment = process.env.NODE_ENV === 'development';

const getSupabaseConfig = () => {
  if (isDevelopment) {
    return {
      url: 'https://gsnnydemkpllycgzmalv.supabase.co',
      serviceKey: process.env.VITE_SUPABASE_DEV_SERVICE_KEY || ''
    };
  } else {
    return {
      url: 'https://oyawpeylvdqfkhysnjsq.supabase.co',
      serviceKey: process.env.VITE_SUPABASE_PROD_SERVICE_KEY || ''
    };
  }
};

const config = getSupabaseConfig();
console.log('🔧 Server Supabase Environment:', isDevelopment ? 'development' : 'production');
console.log('🔧 Using Supabase URL for Auth:', config.url);

const supabase = createClient(config.url, config.serviceKey);
import { eq, desc, and, like, or, inArray, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: string | number): Promise<User | undefined>;
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
  getUserConversations(userId: string): Promise<Conversation[]>;
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
  async getUser(id: string | number): Promise<User | undefined> {
    try {
      const userIdStr = typeof id === 'string' ? id : id.toString();

      // For Supabase Auth, use admin API to get user by ID
      const { data: user, error } = await supabase.auth.admin.getUserById(userIdStr);

      if (error || !user.user) {
        console.error('Supabase getUser error:', error);
        return undefined;
      }

      // Transform Supabase user to our User type
      return {
        id: user.user.id,
        email: user.user.email!,
        displayName: user.user.user_metadata?.display_name || user.user.email?.split('@')[0] || '',
        passwordHash: '',
        preferredKanjiDisplay: user.user.user_metadata?.preferred_kanji_display || 'furigana',
        profileImageUrl: user.user.user_metadata?.avatar_url || null,
        soundNotifications: true,
        desktopNotifications: true,
        createdAt: new Date(user.user.created_at)
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // For Supabase Auth, we don't directly query users by email
    // This method is typically used for login validation, which should use supabase.auth.signInWithPassword instead
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Get the current base URL for redirect
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? 'http://0.0.0.0:5000' : 'https://tomoshibi-joebouchabake.replit.app';
    
    // Use Supabase Auth instead of manual user creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: insertUser.email,
      password: insertUser.password,
      options: {
        data: {
          display_name: insertUser.displayName,
          preferred_kanji_display: insertUser.preferredKanjiDisplay || 'furigana'
        },
        emailRedirectTo: `${baseUrl}/auth/confirm`
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Failed to create user');

    // Return user data in expected format
    return {
      id: authData.user.id, // Convert UUID to number for compatibility
      email: authData.user.email!,
      displayName: authData.user.user_metadata?.display_name || insertUser.displayName,
      passwordHash: '', // Not needed with Supabase Auth
      preferredKanjiDisplay: authData.user.user_metadata?.preferred_kanji_display || 'furigana',
      profileImageUrl: null,
      soundNotifications: true,
      desktopNotifications: true,
      createdAt: new Date(authData.user.created_at)
    } as User;
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
    // Convert UUID user ID to integer for database compatibility
    let mappedUserId: number;
    
    if (validateUuid(conversation.userId)) {
      mappedUserId = uuidToInt(conversation.userId);
    } else {
      mappedUserId = parseInt(conversation.userId);
      if (isNaN(mappedUserId)) {
        throw new Error(`Invalid user ID format: ${conversation.userId}`);
      }
    }

    console.log(`Creating conversation for user ${conversation.userId} -> mapped to ${mappedUserId}`);

    // Insert only the required fields that exist in Supabase
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: mappedUserId,
        persona_id: conversation.personaId,
        scenario_id: conversation.scenarioId || null,
        status: conversation.status || 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);
    
    // Map database field names to expected field names
    return {
      id: data.id,
      userId: conversation.userId, // Return original UUID
      personaId: data.persona_id,
      scenarioId: data.scenario_id,
      phase: data.phase || 'guided',
      status: data.status,
      startedAt: data.started_at,
      completedAt: data.completed_at
    } as Conversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getConversation error:', error);
      return undefined;
    }
    
    if (!data) return undefined;
    
    // Map database field names to expected field names
    return {
      id: data.id,
      userId: data.user_id,
      personaId: data.persona_id,
      scenarioId: data.scenario_id,
      phase: data.phase,
      status: data.status,
      startedAt: data.created_at ? new Date(data.created_at) : null,
      completedAt: data.completed_at ? new Date(data.completed_at) : null
    } as Conversation;
  }

  async getUserConversations(userId: string | number): Promise<Conversation[]> {
    // Convert UUID to integer if needed
    const mappedUserId = typeof userId === 'string' ? this.uuidToInt(userId) : userId;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', mappedUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getUserConversations error:', error);
      throw new Error(error.message);
    }
    
    // Convert Supabase format to our Conversation format
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      personaId: item.persona_id,
      scenarioId: item.scenario_id,
      phase: item.phase,
      status: item.status,
      startedAt: item.created_at ? new Date(item.created_at) : null,
      completedAt: item.completed_at ? new Date(item.completed_at) : null
    }));
  }

  private uuidToInt(uuid: string): number {
    // Simple deterministic hash function to convert UUID to positive integer
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update conversation: ${error.message}`);
    return data as Conversation;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: message.conversationId,
        sender: message.sender,
        content: message.content,
        feedback: message.feedback,
        vocab_used: message.vocabUsed,
        grammar_used: message.grammarUsed
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create message: ${error.message}`);
    return data as Message;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getConversationMessages error:', error);
      throw new Error(error.message);
    }
    
    // Convert Supabase format to our Message format
    return (data || []).map(item => ({
      id: item.id,
      conversationId: item.conversation_id,
      content: item.content,
      sender: item.sender,
      feedback: item.feedback || null,
      vocabUsed: item.vocab_used || null,
      grammarUsed: item.grammar_used || null,
      timestamp: item.created_at ? new Date(item.created_at) : new Date()
    }));
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
