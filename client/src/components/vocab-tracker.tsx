import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, Clock, Filter } from 'lucide-react';

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

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
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

  const { data: vocabData = [], isLoading } = useQuery<VocabTrackerEntry[]>({
    queryKey: ['/api/vocab-tracker'],
  });

  const { data: allVocab = [] } = useQuery({
    queryKey: ['/api/vocab'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading vocabulary tracker...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats: VocabStats = (vocabData as VocabTrackerEntry[]).reduce((acc: VocabStats, entry: VocabTrackerEntry) => {
    acc.total += 1;
    const level = entry.word.jlptLevel;
    acc.byLevel[level] = (acc.byLevel[level] || 0) + 1;
    return acc;
  }, { total: 0, byLevel: {} });

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
          <h1 className="text-3xl font-bold">Vocabulary Tracker</h1>
          <p className="text-muted-foreground">Track your Japanese vocabulary progress by JLPT level</p>
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
          const encountered = stats.byLevel[level] || 0;
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
            <CardTitle className="text-lg">Vocabulary Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Your Usage</span>
                <Badge variant="default">{userVocabCount} words</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">AI Encounters</span>
                <Badge variant="secondary">{aiVocabCount} words</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Unique</span>
                <Badge variant="outline">{stats.total} words</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Learning</span>
                <span className="text-sm font-medium">
                  {Math.round((userVocabCount / Math.max(stats.total, 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(userVocabCount / Math.max(stats.total, 1)) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                Words you've actively used vs encountered
              </p>
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
              <TabsTrigger value="all">All Words ({stats.total})</TabsTrigger>
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
                      <span className="text-blue-600">🤖 {entry.aiEncounterCount || 0}</span>
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