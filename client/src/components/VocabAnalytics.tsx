import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, BookOpen, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { EnhancedCard } from "./EnhancedCard";
import { EnhancedButton } from "./EnhancedButton";
import { Badge } from "@/components/ui/badge";

interface VocabEntry {
  word: {
    word: string;
    reading: string;
    meaning: string;
    jlptLevel: string;
  };
  userUsageCount: number;
  aiEncounterCount: number;
  lastUsed?: string;
  frequency: number;
}

interface BaseAnalyticsProps {
  vocabData: VocabEntry[];
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
  onNavigate?: (path: string) => void;
}

// Generate mock daily usage data for the last 42 days (6 weeks)
const generateDailyUsageData = (vocabData: VocabEntry[]) => {
  const days = [];
  const today = new Date();

  for (let i = 41; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate realistic usage patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseUsage = isWeekend ? 2 : 8;
    const randomVariation = Math.random() * 6;
    const wordsUsed = Math.floor(baseUsage + randomVariation);

    days.push({
      date: date.toISOString().split('T')[0],
      wordsUsed,
      level: wordsUsed >= 12 ? 4 : wordsUsed >= 8 ? 3 : wordsUsed >= 4 ? 2 : wordsUsed > 0 ? 1 : 0
    });
  }

  return days;
};

export function VocabProgressRings({ 
  vocabData, 
  className = "", 
  showTitle = true, 
  compact = false,
  onNavigate 
}: BaseAnalyticsProps) {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Get actual totals from API
  const { data: vocabStats = [], error, isLoading } = useQuery<{ level: string; count: number }[]>({
    queryKey: ['/api/vocab/stats'],
    queryFn: async () => {
      console.log('Fetching vocab stats from Supabase via API...'); // Debug log
      const response = await fetch('/api/vocab/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch vocab stats: ${response.status}`);
      }
      const data = await response.json();
      console.log('Vocab stats fetched from Supabase:', data); // Debug log
      return data;
    },
  });

  // Debug log for errors and loading state
  if (error) {
    console.error('Error fetching vocab stats from Supabase:', error);
  }
  if (isLoading) {
    console.log('Loading vocab stats from Supabase...');
  }

  const levelTotals = vocabStats.reduce((acc: Record<string, number>, stat) => {
    acc[stat.level] = parseInt(stat.count.toString());
    return acc;
  }, { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 });

  const levelStats = levels.map(level => {
    const levelWords = vocabData.filter((entry: VocabEntry) => entry.word.jlptLevel === level);
    const used3Plus = levelWords.filter((entry: VocabEntry) => (entry.userUsageCount || 0) >= 3).length;
    const used1to2 = levelWords.filter((entry: VocabEntry) => {
      const count = entry.userUsageCount || 0;
      return count >= 1 && count < 3;
    }).length;
    const notUsed = levelTotals[level as keyof typeof levelTotals] - used3Plus - used1to2;

    return {
      level,
      used3Plus,
      used1to2,
      notUsed,
      total: levelTotals[level as keyof typeof levelTotals],
      usedTotal: used3Plus + used1to2
    };
  });

  return (
    <EnhancedCard className={`${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Vocabulary Progress Rings
          </h3>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {levelStats.map(({ level, used3Plus, used1to2, usedTotal, total }) => {
          const safeTotal = total || 1;
          const safeUsedTotal = usedTotal || 0;
          const percentage = (safeUsedTotal / safeTotal) * 100;
          const strokeDasharray = 2 * Math.PI * 35; // radius = 35
          const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

          return (
            <div key={level} className="flex-shrink-0 text-center group">
              <div className="relative w-20 h-20 mb-2">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  {/* Background circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-500 ${
                      level === 'N5' ? 'text-green-500' :
                      level === 'N4' ? 'text-blue-500' :
                      level === 'N3' ? 'text-purple-500' :
                      level === 'N2' ? 'text-orange-500' :
                      'text-red-500'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">{safeUsedTotal}</span>
                  <span className="text-xs text-gray-500">/ {safeTotal}</span>
                </div>
              </div>
              <div className="text-sm font-medium">{level}</div>

              {/* Tooltip on hover */}
              <div className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 mt-1 whitespace-nowrap">
                🟢 Used 3+ times: {used3Plus}<br/>
                🟡 Used 1-2 times: {used1to2}<br/>
                ⚪ Not used yet: {total - usedTotal}
              </div>
            </div>
          );
        })}
      </div>
    </EnhancedCard>
  );
}

export function MiniVocabHeatmap({ 
  vocabData, 
  className = "", 
  showTitle = true, 
  compact = false 
}: BaseAnalyticsProps) {
  const dailyData = generateDailyUsageData(vocabData);

  return (
    <EnhancedCard className={`${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Vocab Usage
          </h3>
          <div className="text-xs text-muted-foreground">Last 6 weeks</div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 max-w-xs">
        {dailyData.map(({ date, wordsUsed, level }) => (
          <div
            key={date}
            className={`w-3 h-3 rounded-sm cursor-pointer group relative ${
              level === 0 ? 'bg-gray-100' :
              level === 1 ? 'bg-green-100' :
              level === 2 ? 'bg-green-300' :
              level === 3 ? 'bg-green-500' :
              'bg-green-700'
            }`}
            title={`${date}: ${wordsUsed} words used`}
          >
            <div className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 -mt-8 -ml-4 whitespace-nowrap">
              {wordsUsed} words used
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-100 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-100 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-300 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
          <div className="w-2 h-2 bg-green-700 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>
    </EnhancedCard>
  );
}

export function JLPTLevelComparison({ 
  vocabData, 
  className = "", 
  showTitle = true, 
  compact = false 
}: BaseAnalyticsProps) {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Get actual totals from API (from Supabase)
  const { data: vocabStats = [], error: statsError } = useQuery<{ level: string; count: number }[]>({
    queryKey: ['/api/vocab/stats'],
    queryFn: async () => {
      console.log('JLPTLevelComparison - Fetching vocab stats from Supabase...'); // Debug log
      const response = await fetch('/api/vocab/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        console.error('JLPTLevelComparison - API response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch vocab stats: ${response.status}`);
      }
      const data = await response.json();
      console.log('JLPTLevelComparison - Vocab stats fetched from Supabase:', data); // Debug log
      return data;
    },
  });

  // Debug log for errors
  if (statsError) {
    console.error('JLPTLevelComparison - Error fetching vocab stats from Supabase:', statsError);
  }

  const levelTotals = vocabStats.reduce((acc: Record<string, number>, stat) => {
    acc[stat.level] = parseInt(stat.count.toString());
    return acc;
  }, { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 });

  const levelStats = levels.map(level => {
    const levelWords = vocabData.filter((entry: VocabEntry) => entry.word.jlptLevel === level);
    const used = levelWords.filter((entry: VocabEntry) => (entry.userUsageCount || 0) > 0).length;
    const reviewed = levelWords.filter((entry: VocabEntry) => (entry.aiEncounterCount || 0) > 0 && (entry.userUsageCount || 0) === 0).length;
    const total = levelTotals[level as keyof typeof levelTotals];
    const unseen = total - used - reviewed;

    return { level, used, reviewed, unseen, total };
  });

  return (
    <EnhancedCard className={`${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            JLPT Level Usage
          </h3>
        </div>
      )}

      <div className="space-y-3">
        {levelStats.map(({ level, used, reviewed, unseen, total }) => (
          <div key={level} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{level}</span>
              <span className="text-xs text-muted-foreground">{used + reviewed}/{total}</span>
            </div>

            <div className="flex w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${(used / total) * 100}%` }}
                title={`Used: ${used}`}
              ></div>
              <div 
                className="bg-yellow-400 h-full" 
                style={{ width: `${(reviewed / total) * 100}%` }}
                title={`Reviewed: ${reviewed}`}
              ></div>
              <div 
                className="bg-gray-200 h-full" 
                style={{ width: `${(unseen / total) * 100}%` }}
                title={`Unseen: ${unseen}`}
              ></div>
            </div>

            {/* Tooltip */}
            <div className="invisible group-hover:visible absolute z-10 bg-black text-white text-xs rounded py-1 px-2 mt-1 whitespace-nowrap">
              {level}: {used} used / {reviewed} reviewed / {unseen} unseen
            </div>
          </div>
        ))}
      </div>
    </EnhancedCard>
  );
}

export function WordSpotlightCarousel({ 
  vocabData, 
  className = "", 
  showTitle = true, 
  compact = false,
  onNavigate 
}: BaseAnalyticsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get most used words this week
  const mostUsed = vocabData
    .filter((entry: VocabEntry) => (entry.userUsageCount || 0) > 0)
    .sort((a: VocabEntry, b: VocabEntry) => (b.userUsageCount || 0) - (a.userUsageCount || 0))
    .slice(0, 5);

  // Get inactive words (not used in 2+ weeks)
  const inactive = vocabData
    .filter((entry: VocabEntry) => (entry.userUsageCount || 0) > 0 && (entry.userUsageCount || 0) < 3)
    .slice(0, 5);

  const sections = [
    { title: "Most Used This Week", words: mostUsed, icon: "✅", color: "green" },
    { title: "Inactive Words", words: inactive, icon: "⚠️", color: "orange" }
  ];

  const currentSection = sections[Math.floor(currentIndex / 3)];
  const currentWord = currentSection?.words[currentIndex % 3];

  if (!currentWord) return null;

  return (
    <EnhancedCard className={`${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Word Spotlight
          </h3>
          <div className="flex gap-1">
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </EnhancedButton>
            <EnhancedButton
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(5, currentIndex + 1))}
              disabled={currentIndex >= 5}
            >
              <ChevronRight className="w-4 h-4" />
            </EnhancedButton>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">{currentSection.icon}</span>
          <Badge variant="secondary" className="text-xs">
            {currentSection.title}
          </Badge>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-3">
          <div className="text-lg font-bold text-primary mb-1">
            {currentWord.word.word}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            {currentWord.word.reading}
          </div>
          <div className="text-sm">
            {currentWord.word.meaning}
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Used {currentWord.userUsageCount || 0} times</span>
          <Badge variant="outline" className="text-xs">
            {currentWord.word.jlptLevel}
          </Badge>
        </div>
      </div>
    </EnhancedCard>
  );
}

export function KnownVsUsedGap({ 
  vocabData, 
  className = "", 
  showTitle = true, 
  compact = false,
  onNavigate 
}: BaseAnalyticsProps) {
  const totalKnown = vocabData.length;
  const totalUsed = vocabData.filter((entry: VocabEntry) => (entry.userUsageCount || 0) > 0).length;
  const activationRate = totalKnown > 0 ? (totalUsed / totalKnown) * 100 : 0;
  const inactiveN5Words = vocabData.filter((entry: VocabEntry) => 
    entry.word.jlptLevel === 'N5' && (entry.userUsageCount || 0) === 0
  ).length;

  return (
    <EnhancedCard className={`${compact ? 'mb-4' : 'mb-6'} ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Known vs Used Gap
          </h3>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative">
          <div className="flex justify-between text-sm mb-1">
            <span>Total Known Words</span>
            <span className="font-semibold">{totalKnown}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div className="bg-blue-500 h-full rounded-full"></div>
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between text-sm mb-1">
            <span>Used in Output</span>
            <span className="font-semibold">{totalUsed}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div 
              className="bg-green-500 h-full rounded-full"
              style={{ width: `${activationRate}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center py-2">
          <div className="text-2xl font-bold text-primary">
            {Math.round(activationRate)}%
          </div>
          <div className="text-sm text-muted-foreground">
            You've activated {Math.round(activationRate)}% of your known words
          </div>
        </div>

        {inactiveN5Words > 0 && (
          <EnhancedButton 
            variant="outline" 
            className="w-full"
            onClick={() => {/* Navigation to practice inactive words */}}
          >
            Practice {Math.min(5, inactiveN5Words)} inactive N5 words →
          </EnhancedButton>
        )}
      </div>
    </EnhancedCard>
  );
}