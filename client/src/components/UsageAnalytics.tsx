import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, Clock, Target } from 'lucide-react';
import { vocabularyTracker } from '@/lib/vocabulary-tracker';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase/client';

interface UsageStats {
  totalWords: number;
  uniqueWords: number;
  topWords: Array<{ word: string; count: number; lastUsed: string }>;
}

interface ConjugationExample {
  originalForm: string;
  normalizedForm: string;
  count: number;
  source: string;
}

export function UsageAnalytics() {
  const [stats, setStats] = useState<UsageStats>({ totalWords: 0, uniqueWords: 0, topWords: [] });
  const [conjugationExamples, setConjugationExamples] = useState<ConjugationExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user]);

  const loadUsageData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!userData) return;

      // Load usage statistics
      const usageStats = await vocabularyTracker.getUserUsageStats(userData.id);
      setStats(usageStats);

      // Load conjugation examples
      const { data: conjugationData, error } = await supabase
        .from('usage_log')
        .select('word_form_used, word_normalized, source')
        .eq('user_id', userData.id)
        .neq('word_form_used', 'word_normalized') // Only show conjugated forms
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && conjugationData) {
        // Group by conjugation pairs
        const conjugationMap = new Map<string, ConjugationExample>();
        
        conjugationData.forEach(entry => {
          const key = `${entry.word_form_used}-${entry.word_normalized}`;
          const existing = conjugationMap.get(key);
          
          if (existing) {
            existing.count++;
          } else {
            conjugationMap.set(key, {
              originalForm: entry.word_form_used,
              normalizedForm: entry.word_normalized,
              count: 1,
              source: entry.source
            });
          }
        });

        setConjugationExamples(Array.from(conjugationMap.values()).slice(0, 8));
      }

    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Vocabulary Usage Analytics
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign in to view your vocabulary usage patterns and conjugation tracking.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Vocabulary Usage Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalWords}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Total Word Encounters
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.uniqueWords}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Unique Words
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {conjugationExamples.length}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Conjugations Detected
            </div>
          </div>
        </div>
      </div>

      {/* Conjugation Detection Examples */}
      {conjugationExamples.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h4 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Conjugation Detection (Conjugated → Dictionary Form)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {conjugationExamples.map((example, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-japanese text-lg text-zinc-900 dark:text-zinc-100">
                    {example.originalForm}
                  </span>
                  <span className="text-zinc-400">→</span>
                  <span className="font-japanese text-lg text-blue-600 dark:text-blue-400">
                    {example.normalizedForm}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded text-xs">
                    {example.source}
                  </span>
                  <span className="text-xs">×{example.count}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Smart Tracking:</strong> The system automatically detects conjugated forms (like 食べた, 行きます) 
              and links them to their dictionary forms (食べる, 行く) for accurate usage statistics.
            </p>
          </div>
        </div>
      )}

      {/* Most Used Words */}
      {stats.topWords.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <h4 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Most Encountered Words
          </h4>
          
          <div className="space-y-2">
            {stats.topWords.slice(0, 10).map((wordStat, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500 w-6">#{index + 1}</span>
                  <span className="font-japanese text-lg text-zinc-900 dark:text-zinc-100">
                    {wordStat.word}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>×{wordStat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {stats.totalWords === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <div className="text-zinc-400 mb-2">
            <TrendingUp className="w-12 h-12 mx-auto mb-3" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Start Chatting to See Analytics
          </h4>
          <p className="text-zinc-600 dark:text-zinc-400">
            Begin conversations with AI tutors to start tracking your vocabulary usage with advanced conjugation detection.
          </p>
        </div>
      )}
    </div>
  );
}