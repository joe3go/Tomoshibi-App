
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { safeString, safeNumber } from '@/lib/safety';
import type { 
  DashboardConversation, 
  DashboardPersona, 
  DashboardScenario, 
  UserProgress,
  DashboardUser 
} from '@/types/dashboard';

export function useDashboardData() {
  const { data: rawUser, isLoading: userLoading } = useQuery<DashboardUser>({
    queryKey: ['/api/auth/me'],
  });

  const { data: rawConversations, isLoading: conversationsLoading } = useQuery<DashboardConversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: rawPersonas, isLoading: personasLoading } = useQuery<DashboardPersona[]>({
    queryKey: ['/api/personas'],
  });

  const { data: rawScenarios, isLoading: scenariosLoading } = useQuery<DashboardScenario[]>({
    queryKey: ['/api/scenarios'],
  });

  const { data: rawProgress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
  });

  // Sanitize data to prevent primitive conversion errors
  const user = useMemo(() => {
    if (!rawUser) return null;
    return {
      ...rawUser,
      displayName: safeString(rawUser.displayName, '学生'),
      email: safeString(rawUser.email, ''),
    };
  }, [rawUser]);

  const conversations = useMemo(() => {
    if (!Array.isArray(rawConversations)) return [];
    return rawConversations.filter(conv => 
      conv && typeof conv === 'object' && conv.id && conv.status
    );
  }, [rawConversations]);

  const personas = useMemo(() => {
    if (!Array.isArray(rawPersonas)) return [];
    return rawPersonas.filter(persona => 
      persona && typeof persona === 'object' && persona.id && persona.name
    );
  }, [rawPersonas]);

  const scenarios = useMemo(() => {
    if (!Array.isArray(rawScenarios)) return [];
    return rawScenarios.filter(scenario => 
      scenario && typeof scenario === 'object' && scenario.id && scenario.title
    );
  }, [rawScenarios]);

  const progress = useMemo(() => {
    if (!rawProgress || typeof rawProgress !== 'object') return null;
    return {
      ...rawProgress,
      vocabMastered: Array.isArray(rawProgress.vocabMastered) ? rawProgress.vocabMastered : [],
      vocabEncountered: Array.isArray(rawProgress.vocabEncountered) ? rawProgress.vocabEncountered : [],
      grammarMastered: Array.isArray(rawProgress.grammarMastered) ? rawProgress.grammarMastered : [],
      grammarEncountered: Array.isArray(rawProgress.grammarEncountered) ? rawProgress.grammarEncountered : [],
      totalConversations: safeNumber(rawProgress.totalConversations, 0),
      totalMessagesSent: safeNumber(rawProgress.totalMessagesSent, 0),
    };
  }, [rawProgress]);

  // Stable memoized filtered conversations
  const activeConversations = useMemo(() => {
    return conversations.filter(conv => conv.status === 'active');
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
    
    const vocabMastered = progress.vocabMastered.length;
    const vocabEncountered = Math.max(progress.vocabEncountered.length, 1);
    const grammarMastered = progress.grammarMastered.length;
    const grammarEncountered = Math.max(progress.grammarEncountered.length, 1);
    
    const vocabProgress = (vocabMastered / vocabEncountered) * 100;
    const grammarProgress = (grammarMastered / grammarEncountered) * 100;
    
    return {
      vocabulary: Math.round(vocabProgress),
      grammar: Math.round(grammarProgress),
      conversations: progress.totalConversations,
      messages: progress.totalMessagesSent,
      streak: progress.metrics?.streak || 0,
      accuracy: progress.metrics?.accuracy || 0,
    };
  }, [progress]);

  // Safe Japanese status calculation
  const japaneseStatus = useMemo(() => {
    if (!progress) return '新人 (Newcomer)';
    
    const vocabMastered = progress.vocabMastered.length;
    const grammarMastered = progress.grammarMastered.length;
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
