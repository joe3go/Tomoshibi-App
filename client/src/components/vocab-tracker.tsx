import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Clock, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { 
  VocabularyTrackingEntry, 
  VocabularyStatistics, 
  JlptLevel,
  BaseComponentProps,
  ChangeHandler 
} from '@/types';
import { JLPT_LEVELS, JLPT_TARGETS, JLPT_LEVEL_COLORS, API_ENDPOINTS } from '@/utils/constants';
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

interface VocabTrackerProps extends BaseComponentProps {
  showFilterOptions?: boolean;
  initialLevel?: JlptLevel | 'all';
}

const VocabTracker: React.FC<VocabTrackerProps> = React.memo(({
  className,
  showFilterOptions = true,
  initialLevel = 'all'
}) => {
  const [selectedLevel, setSelectedLevel] = useState<JlptLevel | 'all'>(initialLevel);
  const [sortBy, setSortBy] = useState<'frequency' | 'lastSeen' | 'memoryStrength'>('frequency');
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'ai'>('all');

  const { data: vocabularyData = [], isLoading } = useQuery<VocabularyTrackingEntry[]>({
    queryKey: [API_ENDPOINTS.VOCAB_TRACKER],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: allVocabularyWords = [] } = useQuery({
    queryKey: ['/api/vocab'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoized vocabulary statistics calculation
  const vocabularyStatistics: VocabularyStatistics = useMemo(() => ({
    totalWords: vocabularyData.length,
    wordsByLevel: vocabularyData.reduce((acc, entry) => {
      const level = entry.word.jlptLevel as JlptLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    masteredWords: vocabularyData.filter(entry => entry.memoryStrength >= 80).length,
    reviewDueWords: vocabularyData.filter(entry => 
      entry.nextReviewAt && new Date(entry.nextReviewAt) <= new Date()
    ).length
  }), [vocabularyData]);

  // Event handlers with useCallback for performance optimization
  const handleLevelChange: ChangeHandler<JlptLevel | 'all'> = useCallback((value) => {
    setSelectedLevel(value);
  }, []);

  const handleSortChange: ChangeHandler<'frequency' | 'lastSeen' | 'memoryStrength'> = useCallback((value) => {
    setSortBy(value);
  }, []);

  const handleTabChange: ChangeHandler<'all' | 'user' | 'ai'> = useCallback((value) => {
    setActiveTab(value);
  }, []);

  // Filter and sort vocabulary data based on user preferences
  const filteredVocabularyData = (vocabularyData as VocabularyTrackerEntry[])
    .filter((vocabularyEntry: VocabularyTrackerEntry) => {
      const isLevelMatch = selectedLevel === 'all' || vocabularyEntry.word.jlptLevel === selectedLevel;
      const isTabMatch = activeTab === 'all' || 
        (activeTab === 'user' && (vocabularyEntry.userUsageCount || 0) > 0) ||
        (activeTab === 'ai' && (vocabularyEntry.aiEncounterCount || 0) > 0);
      return isLevelMatch && isTabMatch;
    })
    .sort((firstEntry: VocabularyTrackerEntry, secondEntry: VocabularyTrackerEntry) => {
      switch (sortBy) {
        case 'frequency':
          return (secondEntry.frequency || 0) - (firstEntry.frequency || 0);
        case 'user-usage':
          return (secondEntry.userUsageCount || 0) - (firstEntry.userUsageCount || 0);
        case 'ai-encounters':
          return (secondEntry.aiEncounterCount || 0) - (firstEntry.aiEncounterCount || 0);
        case 'recent':
          return new Date(secondEntry.lastSeenAt || 0).getTime() - new Date(firstEntry.lastSeenAt || 0).getTime();
        case 'alphabetical':
          return (firstEntry.word.hiragana || '').localeCompare(secondEntry.word.hiragana || '');
        default:
          return 0;
      }
    });

  // Calculate user and AI interaction statistics
  const userVocabularyCount = vocabularyData.filter((vocabularyEntry: VocabularyTrackerEntry) => (vocabularyEntry.userUsageCount || 0) > 0).length;
  const aiVocabularyCount = vocabularyData.filter((vocabularyEntry: VocabularyTrackerEntry) => (vocabularyEntry.aiEncounterCount || 0) > 0).length;

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
    <div className={`space-y-6 ${className || ''}`}>
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
          const encountered = vocabularyStatistics.wordsByLevel[level] || 0;
          const target = JLPT_TARGETS[level as keyof typeof JLPT_TARGETS];
          const percentage = Math.min((encountered / target) * 100, 100);
          
          return (
            <Card key={level}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{level}</CardTitle>
                <CardDescription>
                  {encountered}/{target} words
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={percentage} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {percentage.toFixed(1)}% complete
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Word Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Words You've Used</span>
                <Badge variant="default">{userVocabularyCount} words</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Words Encountered in Conversations</span>
                <Badge variant="secondary">{aiVocabularyCount} words</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Unique Vocabulary</span>
                <Badge variant="outline">{vocabularyStatistics.totalWords} words</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Unique Words by JLPT Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {JLPT_LEVELS.map((level, index) => {
                const levelWords = vocabularyStatistics.wordsByLevel[level] || 0;
                return (
                  <div key={`level-${level}-${index}`} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{level}:</span>
                    <Badge variant="outline">{levelWords} unique words</Badge>
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total:</span>
                  <Badge variant="default">{vocabularyStatistics.totalWords} unique words</Badge>
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
            <Badge variant="secondary">{filteredVocabularyData.length} words</Badge>
          </CardTitle>
          <CardDescription>
            Track your Japanese vocabulary progress and usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Words ({vocabularyStatistics.totalWords})</TabsTrigger>
              <TabsTrigger value="user">Words You Used ({userVocabularyCount})</TabsTrigger>
              <TabsTrigger value="ai">Words from Conversations ({aiVocabularyCount})</TabsTrigger>
            </TabsList>
          </Tabs>
          {filteredVocabularyData.length === 0 ? (
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
              {filteredVocabularyData.map((entry: VocabularyTrackerEntry) => (
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
                      <span className="text-green-600">You: {entry.userUsageCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600">Conversations: {entry.aiEncounterCount || 0}</span>
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
});

VocabTracker.displayName = 'VocabTracker';

export default VocabTracker;