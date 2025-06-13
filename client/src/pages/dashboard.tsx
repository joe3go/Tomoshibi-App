
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Trophy, Award, Zap, Play, BarChart3, Settings } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn, apiRequest } from '@/lib/api';

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: recentSessions } = useQuery({
    queryKey: ['/api/dashboard/recent-sessions'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/dashboard/achievements'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // JLPT Level Selection Mutation
  const updateLevelMutation = useMutation({
    mutationFn: async (level: string) => {
      await apiRequest('PUT', '/api/user/jlpt-level', { jlptLevel: level });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'JLPT Level Updated',
        description: 'Your study content will now focus on this level',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  // Safe display name handling - only safety fix kept
  const safeDisplayName = typeof user.displayName === 'string' && user.displayName.trim() 
    ? user.displayName 
    : (user.username || '学生');

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Welcome back, {safeDisplayName}!</h1>
        <p className="text-muted-foreground">Continue your Japanese learning journey</p>
      </div>

      {/* JLPT Level Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your JLPT Level</h3>
            <Badge variant="secondary" className="text-sm">
              Current: {user.currentJLPTLevel || 'N5'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={user.currentJLPTLevel || 'N5'}
                onValueChange={(value) => updateLevelMutation.mutate(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your JLPT level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N5">N5 - Beginner</SelectItem>
                  <SelectItem value="N4">N4 - Elementary</SelectItem>
                  <SelectItem value="N3">N3 - Intermediate</SelectItem>
                  <SelectItem value="N2">N2 - Upper Intermediate</SelectItem>
                  <SelectItem value="N1">N1 - Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={updateLevelMutation.isPending}
            >
              {updateLevelMutation.isPending ? 'Updating...' : 'Update Level'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Kanji Progress */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-red-200 dark:hover:border-red-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">漢</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Kanji</h3>
                  <p className="text-sm text-muted-foreground">Characters</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {stats?.kanji?.mastered || 0}/{stats?.kanji?.total || 100}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={(stats?.kanji?.mastered || 0) / (stats?.kanji?.total || 100) * 100} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round((stats?.kanji?.mastered || 0) / (stats?.kanji?.total || 100) * 100)}% Complete
            </p>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Vocabulary Progress */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Vocabulary</h3>
                  <p className="text-sm text-muted-foreground">Words</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {stats?.vocabulary?.mastered || 0}/{stats?.vocabulary?.total || 300}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={(stats?.vocabulary?.mastered || 0) / (stats?.vocabulary?.total || 300) * 100} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round((stats?.vocabulary?.mastered || 0) / (stats?.vocabulary?.total || 300) * 100)}% Complete
            </p>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>

        {/* Grammar Progress */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-200 dark:hover:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">文</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Grammar</h3>
                  <p className="text-sm text-muted-foreground">Patterns</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {stats?.grammar?.mastered || 0}/{stats?.grammar?.total || 50}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={(stats?.grammar?.mastered || 0) / (stats?.grammar?.total || 50) * 100} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round((stats?.grammar?.mastered || 0) / (stats?.grammar?.total || 50) * 100)}% Complete
            </p>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
      </div>

      {/* Study Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button asChild className="h-20 flex-col gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
          <Link href="/chat">
            <Play className="w-6 h-6" />
            <span className="text-sm font-medium">Continue Chat</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20 flex-col gap-2 border-2 hover:bg-orange-50 hover:border-orange-200">
          <Link href="/vocabulary">
            <BookOpen className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Vocabulary</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20 flex-col gap-2 border-2 hover:bg-emerald-50 hover:border-emerald-200">
          <Link href="/study">
            <Zap className="w-6 h-6 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600">Study Mode</span>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20 flex-col gap-2 border-2 hover:bg-blue-50 hover:border-blue-200">
          <Link href="/history">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Progress</span>
          </Link>
        </Button>
      </div>

      {/* Recent Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions?.length > 0 ? (
              recentSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{session.activity}</p>
                    <p className="text-sm text-muted-foreground">{session.timeAgo}</p>
                  </div>
                  <Badge variant="secondary">{session.score}</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements?.length > 0 ? (
              achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No achievements yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/furigana-demo">
                <BookOpen className="w-4 h-4 mr-2" />
                Furigana Demo
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/transcripts">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Transcripts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
