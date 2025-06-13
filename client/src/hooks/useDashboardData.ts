
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { 
  DashboardConversation, 
  DashboardPersona, 
  DashboardScenario, 
  UserProgress,
  DashboardUser 
} from '@/types/dashboard';

export function useDashboardData() {
  const { data: user, isLoading: userLoading } = useQuery<DashboardUser>({
    queryKey: ['/api/auth/me'],
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<DashboardConversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: personas = [], isLoading: personasLoading } = useQuery<DashboardPersona[]>({
    queryKey: ['/api/personas'],
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<DashboardScenario[]>({
    queryKey: ['/api/scenarios'],
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
  });

  // Memoized filtered conversations
  const activeConversations = useMemo(() => 
    conversations.filter(conv => conv.status === 'active'),
    [conversations]
  );

  const recentConversations = useMemo(() => 
    activeConversations
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 3),
    [activeConversations]
  );

  // Memoized progress calculations
  const progressMetrics = useMemo(() => {
    if (!progress) return null;
    
    const vocabProgress = progress.vocabMastered.length / Math.max(progress.vocabEncountered.length, 1) * 100;
    const grammarProgress = progress.grammarMastered.length / Math.max(progress.grammarEncountered.length, 1) * 100;
    
    return {
      vocabulary: Math.round(vocabProgress),
      grammar: Math.round(grammarProgress),
      conversations: progress.totalConversations,
      messages: progress.totalMessagesSent,
      streak: progress.metrics?.streak || 0,
      accuracy: progress.metrics?.accuracy || 0,
    };
  }, [progress]);

  // Japanese status calculation
  const japaneseStatus = useMemo(() => {
    if (!progress) return '新人 (Newcomer)';
    
    const totalMastered = progress.vocabMastered.length + progress.grammarMastered.length;
    
    if (totalMastered >= 100) return '桜 Scholar (Cherry Blossom Scholar)';
    if (totalMastered >= 50) return '灯火 Apprentice (Lantern Apprentice)';
    if (totalMastered >= 20) return '芽 Sprout (Young Sprout)';
    return '新人 Newcomer (Beginner)';
  }, [progress]);

  const isLoading = userLoading || conversationsLoading || personasLoading || scenariosLoading || progressLoading;

  return {
    user,
    conversations,
    personas,
    scenarios,
    progress,
    activeConversations,
    recentConversations,
    progressMetrics,
    japaneseStatus,
    isLoading,
  };
}
