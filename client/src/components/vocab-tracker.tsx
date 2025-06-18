import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Clock, Filter, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import harukiAvatar from "@assets/harukiavatar_1750137453243.png";
import aoiAvatar from "@assets/aoiavatar_1750137453242.png";

interface VocabTrackerEntry {
  id: number;
  userId: number;
  wordId: number;
  frequency: number;
  userUsageCount: number;
  aiEncounterCount: number;
  lastSeenAt: string | null;
  memoryStrength: number;
  nextReviewAt: string | null;
  source: string;
  word: {
    id: number;
    kanji: string | null;
    hiragana: string;
    englishMeaning: string;
    jlptLevel: string;
    wordType: string | null;
  };
}

interface VocabStats {
  total: number;
  byLevel: Record<string, number>;
}

interface UserVocabStat {
  level: string;
  userWords: number;
  totalWords: number;
}

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const JLPT_LEVEL_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1'];

// JLPT level targets for progress tracking
const JLPT_TARGETS = {
  N5: 800,
  N4: 1500,
  N3: 3750,
  N2: 6000,
  N1: 10000
};

export default function VocabTracker() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('frequency');
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: vocabData = [] } = useQuery({
    queryKey: ['/api/vocab-tracker'],
  });

  const { data: vocabStats = [] } = useQuery({
    queryKey: ['/api/vocab/stats'],
    queryFn: async () => {
      const response = await fetch('/api/vocab/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vocab stats');
      }
      return response.json();
    },
  });

  const { data: userVocabStats = [] } = useQuery<UserVocabStat[]>({
    queryKey: ['/api/vocab/user-stats'],
  });

  // Get total vocabulary counts from database
  const { data: totalVocabStats = [] } = useQuery<{ level: string; count: number }[]>({
    queryKey: ['/api/vocab/stats'],
    queryFn: async () => {
      const response = await fetch('/api/vocab/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vocab stats');
      }
      return response.json();
    },
  });

  // Calculate stats from vocabulary data
  const calculateStats = () => {
    const stats = {
      byLevel: {} as Record<string, number>,
      total: (vocabData as any[]).length,
      used3Plus: 0,
      used1to2: 0,
      notUsed: 0,
    };

    JLPT_LEVELS.forEach(level => {
      stats.byLevel[level] = 0;
    });

    (vocabData as any[]).forEach((entry: any) => {
      const level = entry.word?.jlptLevel || 'N5';
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      const totalUsage = (entry.userUsageCount || 0) + (entry.aiEncounterCount || 0);
      if (totalUsage >= 3) {
        stats.used3Plus++;
      } else if (totalUsage >= 1) {
        stats.used1to2++;
      } else {
        stats.notUsed++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // Convert vocab stats from API to proper JLPT level totals
  const levelTotals = (vocabStats as any[]).reduce((acc: Record<string, number>, stat: any) => {
    acc[stat.level] = parseInt(stat.count.toString());
    return acc;
  }, { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 });

  // Calculate user's vocabulary statistics (words they've encountered)
  const userStats: VocabStats = (vocabData as VocabTrackerEntry[]).reduce((acc: VocabStats, entry: VocabTrackerEntry) => {
    acc.total += 1;
    const level = entry.word.jlptLevel;
    acc.byLevel[level] = (acc.byLevel[level] || 0) + 1;
    return acc;
  }, { total: 0, byLevel: {} });

  const totalVocabCount = vocabStats.reduce((sum, stat) => sum + stat.count, 0);

  // Filter and sort data
  const filteredData = (vocabData as VocabTrackerEntry[])
    .filter((entry: VocabTrackerEntry) => {
      const levelMatch = selectedLevel === 'all' || entry.word.jlptLevel === selectedLevel;
      const tabMatch = activeTab === 'all' || 
        (activeTab === 'user' && (entry.userUsageCount || 0) > 0) ||
        (activeTab === 'ai' && (entry.aiEncounterCount || 0) > 0);
      return levelMatch && tabMatch;
    })
    .sort((a: VocabTrackerEntry, b: VocabTrackerEntry) => {
      switch (sortBy) {
        case 'frequency':
          return (b.frequency || 0) - (a.frequency || 0);
        case 'user-usage':
          return (b.userUsageCount || 0) - (a.userUsageCount || 0);
        case 'ai-encounters':
          return (b.aiEncounterCount || 0) - (a.aiEncounterCount || 0);
        case 'recent':
          return new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime();
        case 'alphabetical':
          return (a.word.hiragana || '').localeCompare(b.word.hiragana || '');
        default:
          return 0;
      }
    });

  // Calculate split statistics
  const userVocabCount = vocabData.filter(entry => (entry.userUsageCount || 0) > 0).length;
  const aiVocabCount = vocabData.filter(entry => (entry.aiEncounterCount || 0) > 0).length;

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">JLPT Vocabulary Journey</h1>
          <p className="text-muted-foreground">Track your Japanese vocabulary progress with your tutors</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {JLPT_LEVELS.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequency">Most Frequent</SelectItem>
              <SelectItem value="user-usage">Your Usage</SelectItem>
              <SelectItem value="ai-encounters">AI Encounters</SelectItem>
              <SelectItem value="recent">Recently Seen</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {JLPT_LEVELS.map(level => {
          const totalWords = levelTotals[level] || 0;
          const userWords = stats.byLevel[level] || 0;
          const percentage = totalWords > 0 ? Math.min((userWords / totalWords) * 100, 100) : 0;

          return (
            <ProgressRing 
              key={level} 
              level={level} 
              encountered={userWords} 
              target={totalWords} 
              percentage={percentage}
            />
          );
        })}
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-primary">Vocabulary Progress</h3>
              </div>
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Words</span>
                <span className="font-semibold">{userStats.total}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-muted-foreground">Your Words</span>
                </div>
                <span className="text-green-600 font-semibold">{userVocabCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={aoiAvatar} 
                    alt="Aoi" 
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-muted-foreground">Aoi's Words</span>
                </div>
                <span className="text-blue-600 font-semibold">{Math.floor(aiVocabCount * 0.6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={harukiAvatar} 
                    alt="Haruki" 
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-sm text-muted-foreground">Haruki's Words</span>
                </div>
                <span className="text-purple-600 font-semibold">{Math.floor(aiVocabCount * 0.4)}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 mt-3">
                {['N5', 'N4', 'N3', 'N2', 'N1'].map(level => {
                  const encountered = userStats.byLevel[level] || 0;
                  return (
                    <div key={level} className="text-center">
                      <div className="text-xs text-muted-foreground">{level}</div>
                      <div className="text-sm font-semibold">{encountered}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vocabulary Progress by JLPT Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {JLPT_LEVEL_ORDER.map(level => {
                const userWords = stats.byLevel[level] || 0;
                const totalWords = levelTotals[level] || 0;
                const percentage = totalWords > 0 ? Math.round((userWords / totalWords) * 100) : 0;
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{level}:</span>
                      <Badge variant="outline">{userWords} / {totalWords} words ({percentage}%)</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          level === 'N5' ? 'bg-green-500' :
                          level === 'N4' ? 'bg-blue-500' :
                          level === 'N3' ? 'bg-purple-500' :
                          level === 'N2' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total Progress:</span>
                  <Badge variant="default">{userStats.total} / {Object.values(levelTotals).reduce((sum, count) => sum + count, 0)} words</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vocabulary List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Vocabulary Tracker
            <Badge variant="secondary">{filteredData.length} words</Badge>
          </CardTitle>
          <CardDescription>
            Track your Japanese vocabulary progress and usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Words ({userStats.total})</TabsTrigger>
              <TabsTrigger value="user">Your Usage ({userVocabCount})</TabsTrigger>
              <TabsTrigger value="ai">AI Encounters ({aiVocabCount})</TabsTrigger>
            </TabsList>
          </Tabs>
          {filteredData.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedLevel === 'all' 
                  ? "Start chatting to encounter vocabulary!" 
                  : `No ${selectedLevel} vocabulary encountered yet`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((entry: VocabTrackerEntry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-medium">
                      {entry.word.kanji && (
                        <ruby>
                          {entry.word.kanji}
                          <rt className="text-xs text-muted-foreground">{entry.word.hiragana}</rt>
                        </ruby>
                      )}
                      {!entry.word.kanji && entry.word.hiragana}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.word.englishMeaning}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {entry.word.jlptLevel}
                    </Badge>
                    {entry.word.wordType && (
                      <Badge variant="secondary" className="text-xs">
                        {entry.word.wordType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{entry.frequency || 0}x total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600">👤 {entry.userUsageCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600">👨‍🏫 {entry.aiEncounterCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatLastSeen(entry.lastSeenAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressRing({ level, encountered, target, percentage }: {
  level: string;
  encountered: number;
  target: number;
  percentage: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="content-card text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg width="96" height="96" className="transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-muted opacity-20"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(strokeDashoffset) ? circumference : strokeDashoffset}
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
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{Math.round(percentage || 0)}%</span>
        </div>
      </div>
      <h4 className="font-semibold text-foreground mb-1">{level}</h4>
      <p className="text-sm text-muted-foreground">
        {encountered} / {target}
      </p>
    </div>
  );
}