import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, Clock, Target } from 'lucide-react';

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

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      // Load from localStorage for now
      const stored = localStorage.getItem('vocab-usage') || '[]';
      const usageData = JSON.parse(stored);
      
      const totalWords = usageData.length;
      const uniqueWords = new Set(usageData.map((entry: any) => entry.word)).size;
      const topWords = usageData
        .slice(0, 10)
        .map((entry: any) => ({
          word: entry.word,
          count: entry.count || 1,
          lastUsed: entry.timestamp || new Date().toISOString()
        }));

      setStats({ totalWords, uniqueWords, topWords });
      setConjugationExamples([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading usage data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Vocabulary Usage Analytics
        </h3>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalWords}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Words
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.uniqueWords}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Unique Words
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {conjugationExamples.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Conjugations
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            This Week
          </div>
        </div>
      </div>

      {/* Top Words */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Most Encountered Words
        </h4>
        
        {stats.topWords.length > 0 ? (
          <div className="space-y-2">
            {stats.topWords.map((wordData, index) => (
              <div key={wordData.word} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-4">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {wordData.word}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{wordData.count} times</span>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(wordData.lastUsed).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start chatting to see vocabulary analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}