import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { 
  DashboardConversation, 
  DashboardPersona, 
  DashboardScenario, 
  UserProgress,
  DashboardUser 
} from '@/types/dashboard';
import { getQueryFn } from '@/lib/api';

export function useDashboardData() {
  const { data: user, isLoading: userLoading } = useQuery<DashboardUser>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery<DashboardConversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: personas, isLoading: personasLoading } = useQuery<DashboardPersona[]>({
    queryKey: ['/api/personas'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: scenarios, isLoading: scenariosLoading } = useQuery<DashboardScenario[]>({
    queryKey: ['/api/scenarios'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Stable memoized filtered conversations
  const activeConversations = useMemo(() => {
    return (conversations || []).filter(conv => conv?.status === 'active');
  }, [conversations]);

  const recentConversations = useMemo(() => {
    return activeConversations
      .filter(conv => conv.startedAt)
      .sort((a, b) => {
        try {
          const dateA = new Date(a.startedAt).getTime();
          const dateB = new Date(b.startedAt).getTime();
          if (isNaN(dateA) || isNaN(dateB)) return 0;
          return dateB - dateA;
        } catch {
          return 0;
        }
      })
      .slice(0, 3);
  }, [activeConversations]);

  // Safe progress calculations
  const progressMetrics = useMemo(() => {
    if (!progress) {
      return {
        vocabulary: 0,
        grammar: 0,
        conversations: 0,
        messages: 0,
        streak: 0,
        accuracy: 0,
      };
    }

    const vocabMastered = progress.vocabMastered?.length || 0;
    const vocabEncountered = Math.max(progress.vocabEncountered?.length || 0, 1);
    const grammarMastered = progress.grammarMastered?.length || 0;
    const grammarEncountered = Math.max(progress.grammarEncountered?.length || 0, 1);

    const vocabProgress = (vocabMastered / vocabEncountered) * 100;
    const grammarProgress = (grammarMastered / grammarEncountered) * 100;

    return {
      vocabulary: Math.round(vocabProgress),
      grammar: Math.round(grammarProgress),
      conversations: progress.totalConversations || 0,
      messages: progress.totalMessagesSent || 0,
      streak: progress.metrics?.streak || 0,
      accuracy: progress.metrics?.accuracy || 0,
    };
  }, [progress]);

  // Safe Japanese status calculation
  const japaneseStatus = useMemo(() => {
    if (!progress) return '新人 (Newcomer)';

    const vocabMastered = progress.vocabMastered?.length || 0;
    const grammarMastered = progress.grammarMastered?.length || 0;
    const totalMastered = vocabMastered + grammarMastered;

    if (totalMastered >= 100) return '桜 Scholar (Cherry Blossom Scholar)';
    if (totalMastered >= 50) return '灯火 Apprentice (Lantern Apprentice)';
    if (totalMastered >= 20) return '芽 Sprout (Young Sprout)';
    return '新人 Newcomer (Beginner)';
  }, [progress]);

  const isLoading = userLoading || conversationsLoading || personasLoading || scenariosLoading || progressLoading;

  return {
    user,
    conversations: conversations || [],
    personas: personas || [],
    scenarios: scenarios || [],
    progress,
    activeConversations,
    recentConversations,
    progressMetrics,
    japaneseStatus,
    isLoading,
  };
}