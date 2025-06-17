import { conjugationNormalizer } from './conjugation-normalizer';
import { supabase } from './supabase/client';

export interface VocabUsageEntry {
  wordFormUsed: string;
  wordNormalized: string;
  source: 'chat' | 'scenario' | 'popup';
  confidence: number;
  partOfSpeech?: string;
}

class VocabularyTracker {
  private pendingEntries: VocabUsageEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private readonly MAX_BATCH_SIZE = 50;

  /**
   * Track vocabulary usage from Japanese text with conjugation normalization
   */
  async trackUsageFromText(
    text: string, 
    source: 'chat' | 'scenario' | 'popup',
    userId?: number
  ): Promise<void> {
    try {
      // Initialize the conjugation normalizer
      await conjugationNormalizer.initialize();
      
      // Normalize all words in the text
      const normalizedResults = await conjugationNormalizer.normalizeText(text);
      
      // Create usage entries for each normalized word
      const entries: VocabUsageEntry[] = normalizedResults
        .filter(result => {
          // Filter out particles, punctuation, and low-confidence results
          return result.confidence > 0.3 && 
                 result.originalForm.trim().length > 0 &&
                 !this.isParticleOrPunctuation(result.partOfSpeech);
        })
        .map(result => ({
          wordFormUsed: result.originalForm,
          wordNormalized: result.normalizedForm,
          source,
          confidence: Math.round(result.confidence * 100),
          partOfSpeech: result.partOfSpeech
        }));

      // Add to pending batch
      this.pendingEntries.push(...entries);
      
      // Schedule batch processing
      this.scheduleBatchInsert(userId);
      
    } catch (error) {
      console.error('Error tracking vocabulary usage:', error);
    }
  }

  /**
   * Track a single word usage (for popup interactions)
   */
  async trackSingleWord(
    wordForm: string,
    source: 'chat' | 'scenario' | 'popup',
    userId?: number
  ): Promise<void> {
    try {
      await conjugationNormalizer.initialize();
      const normalized = await conjugationNormalizer.normalizeWord(wordForm);
      
      const entry: VocabUsageEntry = {
        wordFormUsed: wordForm,
        wordNormalized: normalized.normalizedForm,
        source,
        confidence: Math.round(normalized.confidence * 100),
        partOfSpeech: normalized.partOfSpeech
      };

      this.pendingEntries.push(entry);
      this.scheduleBatchInsert(userId);
      
    } catch (error) {
      console.error('Error tracking single word:', error);
    }
  }

  /**
   * Schedule batch insert with debouncing
   */
  private scheduleBatchInsert(userId?: number): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch(userId);
    }, this.BATCH_DELAY);

    // Force process if batch is full
    if (this.pendingEntries.length >= this.MAX_BATCH_SIZE) {
      clearTimeout(this.batchTimeout);
      this.processBatch(userId);
    }
  }

  /**
   * Process and insert the batch of usage entries
   */
  private async processBatch(userId?: number): Promise<void> {
    if (this.pendingEntries.length === 0) return;

    const entries = [...this.pendingEntries];
    this.pendingEntries = [];
    this.batchTimeout = null;

    try {
      // Get current user ID if not provided
      const currentUserId = userId || await this.getCurrentUserId();
      if (!currentUserId) {
        console.warn('No user ID available for vocabulary tracking');
        return;
      }

      // Insert into Supabase usage_log table
      const { error } = await supabase
        .from('usage_log')
        .insert(
          entries.map(entry => ({
            user_id: currentUserId,
            word_form_used: entry.wordFormUsed,
            word_normalized: entry.wordNormalized,
            source: entry.source,
            confidence: entry.confidence,
            part_of_speech: entry.partOfSpeech
          }))
        );

      if (error) {
        console.error('Error inserting usage log entries:', error);
        // Re-queue entries for retry
        this.pendingEntries.unshift(...entries);
      } else {
        console.log(`Successfully tracked ${entries.length} vocabulary usage entries`);
      }

    } catch (error) {
      console.error('Error processing vocabulary batch:', error);
      // Re-queue entries for retry
      this.pendingEntries.unshift(...entries);
    }
  }

  /**
   * Get current user ID from authentication
   */
  private async getCurrentUserId(): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Query the users table to get the numeric ID
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (error || !data) {
          console.error('Error getting user ID:', error);
          return null;
        }
        
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if a part of speech should be filtered out
   */
  private isParticleOrPunctuation(partOfSpeech?: string): boolean {
    if (!partOfSpeech) return false;
    
    const filterPatterns = [
      '助詞', // particles
      '記号', // symbols
      '補助記号', // auxiliary symbols
      '空白' // whitespace
    ];
    
    return filterPatterns.some(pattern => partOfSpeech.includes(pattern));
  }

  /**
   * Force process any pending entries
   */
  async flush(userId?: number): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.pendingEntries.length > 0) {
      await this.processBatch(userId);
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: number): Promise<{
    totalWords: number;
    uniqueWords: number;
    topWords: Array<{ word: string; count: number; lastUsed: string }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('usage_log')
        .select('word_normalized, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const wordCounts = new Map<string, { count: number; lastUsed: string }>();
      
      data?.forEach(entry => {
        const existing = wordCounts.get(entry.word_normalized);
        if (existing) {
          existing.count++;
        } else {
          wordCounts.set(entry.word_normalized, {
            count: 1,
            lastUsed: entry.created_at
          });
        }
      });

      const topWords = Array.from(wordCounts.entries())
        .map(([word, stats]) => ({
          word,
          count: stats.count,
          lastUsed: stats.lastUsed
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        totalWords: data?.length || 0,
        uniqueWords: wordCounts.size,
        topWords
      };

    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { totalWords: 0, uniqueWords: 0, topWords: [] };
    }
  }
}

export const vocabularyTracker = new VocabularyTracker();