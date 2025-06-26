import { useState } from 'react';
import type { UserVocab } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search, Filter, Trash2, Plus, User, Database } from 'lucide-react';
import { useUserVocab } from '@/hooks/useUserVocab';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function MyVocabularyPage() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { vocab, isLoading, removeVocab, isRemovingVocab } = useUserVocab();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filteredVocab = vocab.filter(word => {
    const matchesSearch = 
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'all' || word.source.includes(sourceFilter);
    
    return matchesSearch && matchesSource;
  });

  const groupedBySource = filteredVocab.reduce((acc, word) => {
    const source = word.source.includes('popup') ? 'popup' : 
                  word.source.includes('scenario') ? 'scenario' : 
                  word.source.includes('chat') ? 'chat' : 'other';
    if (!acc[source]) acc[source] = [];
    acc[source].push(word);
    return acc;
  }, {} as Record<string, typeof vocab>);

  const getSourceBadgeColor = (source: string) => {
    if (source.includes('popup')) return 'bg-blue-100 text-blue-800';
    if (source.includes('scenario')) return 'bg-green-100 text-green-800';
    if (source.includes('chat')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your vocabulary...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            My Vocabulary
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAuthenticated ? (
              <>Manage your personal vocabulary collection • Synced to Supabase</>
            ) : (
              <>Your vocabulary is stored locally • Sign in to sync across devices</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Badge variant="outline" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Synced
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Local
            </Badge>
          )}
          <Badge variant="outline">
            {vocab.length} {vocab.length === 1 ? 'word' : 'words'}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search words, readings, or meanings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="popup">Word Popup</SelectItem>
                <SelectItem value="scenario">Scenarios</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary List */}
      {vocab.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No vocabulary yet</h3>
            <p className="text-muted-foreground mb-6">
              Start learning! Words you encounter in chats and scenarios will appear here.
            </p>
            <Button onClick={() => window.location.href = '/scenarios'}>
              <Plus className="w-4 h-4 mr-2" />
              Start Learning
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Words ({filteredVocab.length})</TabsTrigger>
            {Object.entries(groupedBySource).map(([source, words]) => (
              <TabsTrigger key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)} ({words.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {filteredVocab.map((word) => (
                <Card key={word.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{word.word}</h3>
                          <span className="text-muted-foreground">({word.reading})</span>
                          <Badge className={getSourceBadgeColor(word.source)}>
                            {word.source.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{word.meaning}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(word.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVocab(word.id)}
                        disabled={isRemovingVocab}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {Object.entries(groupedBySource).map(([source, words]) => (
            <TabsContent key={source} value={source} className="space-y-4">
              <div className="grid gap-4">
                {words.map((word) => (
                  <Card key={word.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{word.word}</h3>
                            <span className="text-muted-foreground">({word.reading})</span>
                          </div>
                          <p className="text-muted-foreground mb-2">{word.meaning}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(word.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVocab(word.id)}
                          disabled={isRemovingVocab}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}