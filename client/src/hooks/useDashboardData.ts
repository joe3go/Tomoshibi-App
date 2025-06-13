
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<DashboardConversation[]>({
    queryKey: ['/api/conversations'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: personas = [], isLoading: personasLoading } = useQuery<DashboardPersona[]>({
    queryKey: ['/api/personas'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<DashboardScenario[]>({
    queryKey: ['/api/scenarios'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized filtered conversations with proper dependencies
  const activeConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    return conversations.filter(conv => conv && typeof conv === 'object' && conv.status === 'active');
  }, [conversations]);

  const recentConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    const active = conversations.filter(conv => conv && typeof conv === 'object' && conv.status === 'active');
    return active
      .filter(conv => conv && conv.startedAt && typeof conv.startedAt === 'string')
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
  }, [conversations]);

  // Memoized progress calculations with null checks
  const progressMetrics = useMemo(() => {
    if (!progress || typeof progress !== 'object' || progress === null) {
      return {
        vocabulary: 0,
        grammar: 0,
        conversations: 0,
        messages: 0,
        streak: 0,
        accuracy: 0,
      };
    }
    
    const vocabMastered = Array.isArray(progress.vocabMastered) ? progress.vocabMastered.length : 0;
    const vocabEncountered = Array.isArray(progress.vocabEncountered) ? progress.vocabEncountered.length : 0;
    const grammarMastered = Array.isArray(progress.grammarMastered) ? progress.grammarMastered.length : 0;
    const grammarEncountered = Array.isArray(progress.grammarEncountered) ? progress.grammarEncountered.length : 0;
    
    const vocabProgress = vocabEncountered > 0 ? (vocabMastered / vocabEncountered) * 100 : 0;
    const grammarProgress = grammarEncountered > 0 ? (grammarMastered / grammarEncountered) * 100 : 0;
    
    return {
      vocabulary: Math.round(vocabProgress),
      grammar: Math.round(grammarProgress),
      conversations: typeof progress.totalConversations === 'number' ? progress.totalConversations : 0,
      messages: typeof progress.totalMessagesSent === 'number' ? progress.totalMessagesSent : 0,
      streak: progress.metrics && typeof progress.metrics.streak === 'number' ? progress.metrics.streak : 0,
      accuracy: progress.metrics && typeof progress.metrics.accuracy === 'number' ? progress.metrics.accuracy : 0,
    };
  }, [progress]);

  // Japanese status calculation with proper null checks
  const japaneseStatus = useMemo(() => {
    if (!progress || typeof progress !== 'object' || progress === null) {
      return '新人 (Newcomer)';
    }
    
    const vocabMastered = Array.isArray(progress.vocabMastered) ? progress.vocabMastered.length : 0;
    const grammarMastered = Array.isArray(progress.grammarMastered) ? progress.grammarMastered.length : 0;
    const totalMastered = vocabMastered + grammarMastered;
    
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
