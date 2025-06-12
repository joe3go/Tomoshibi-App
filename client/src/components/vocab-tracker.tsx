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
  const handleLevelChange = useCallback((value: string) => {
    setSelectedLevel(value as JlptLevel | 'all');
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as 'frequency' | 'lastSeen' | 'memoryStrength');
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'all' | 'user' | 'ai');
  }, []);

  // Memoized filtered and sorted vocabulary data
  const filteredVocabularyData = useMemo(() => {
    return vocabularyData
      .filter((entry) => {
        const isLevelMatch = selectedLevel === 'all' || entry.word.jlptLevel === selectedLevel;
        const isTabMatch = activeTab === 'all' || 
          (activeTab === 'user' && entry.userUsageCount > 0) ||
          (activeTab === 'ai' && entry.aiEncounterCount > 0);
        return isLevelMatch && isTabMatch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'frequency':
            return b.frequency - a.frequency;
          case 'lastSeen':
            const aDate = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
            const bDate = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
            return bDate - aDate;
          case 'memoryStrength':
            return b.memoryStrength - a.memoryStrength;
          default:
            return 0;
        }
      });
  }, [vocabularyData, selectedLevel, activeTab, sortBy]);

  // Memoized utility function for JLPT level colors
  const getJlptLevelColor = useCallback((level: string): string => {
    return JLPT_LEVEL_COLORS[level as JlptLevel] || 'bg-gray-100 text-gray-800';
  }, []);

  // Calculate user and AI vocabulary counts
  const userVocabularyCount = vocabularyData.filter(entry => entry.userUsageCount > 0).length;
  const aiVocabularyCount = vocabularyData.filter(entry => entry.aiEncounterCount > 0).length;

  const formatLastSeen = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className || ''}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading vocabulary tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">JLPT Vocabulary Journey</h1>
          <p className="text-muted-foreground">Track your Japanese vocabulary progress across all JLPT levels</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Words</p>
                <p className="text-2xl font-bold">{vocabularyStatistics.totalWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">User Words</p>
                <p className="text-2xl font-bold">{userVocabularyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden">
                <img src={aoiAvatar} alt="AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Words</p>
                <p className="text-2xl font-bold">{aiVocabularyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Review Due</p>
                <p className="text-2xl font-bold">{vocabularyStatistics.reviewDueWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* JLPT Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle>JLPT Progress</CardTitle>
          <CardDescription>Your vocabulary progress across all JLPT levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {JLPT_LEVELS.map(level => {
              const count = vocabularyStatistics.wordsByLevel[level] || 0;
              const target = JLPT_TARGETS[level];
              const percentage = Math.min((count / target) * 100, 100);
              
              return (
                <div key={level} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getJlptLevelColor(level)}>
                      JLPT {level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {count}/{target}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% complete
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vocabulary Words</CardTitle>
              <CardDescription>
                Showing {filteredVocabularyData.length} of {vocabularyData.length} words
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          {showFilterOptions && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedLevel} onValueChange={handleLevelChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by JLPT Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {JLPT_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>
                          JLPT {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frequency">Frequency</SelectItem>
                    <SelectItem value="lastSeen">Last Seen</SelectItem>
                    <SelectItem value="memoryStrength">Memory Strength</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Words ({vocabularyData.length})</TabsTrigger>
              <TabsTrigger value="user">Your Words ({userVocabularyCount})</TabsTrigger>
              <TabsTrigger value="ai">AI Words ({aiVocabularyCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredVocabularyData.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No vocabulary words found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVocabularyData.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-lg font-medium">
                            {entry.word.kanji ? (
                              <span>
                                {entry.word.kanji} <span className="text-muted-foreground">({entry.word.hiragana})</span>
                              </span>
                            ) : (
                              entry.word.hiragana
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {entry.word.englishMeaning}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getJlptLevelColor(entry.word.jlptLevel)}>
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
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
});

VocabTracker.displayName = 'VocabTracker';

export default VocabTracker;