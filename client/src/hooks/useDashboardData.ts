
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import type { 
  DashboardConversation, 
  DashboardPersona, 
  DashboardScenario, 
  UserProgress,
  DashboardUser 
} from '@/types/dashboard';

// Stable default values to prevent unnecessary re-renders
const EMPTY_ARRAY: any[] = [];
const EMPTY_PROGRESS = {
  vocabulary: 0,
  grammar: 0,
  conversations: 0,
  messages: 0,
  streak: 0,
  accuracy: 0,
};

export function useDashboardData() {
  // Use refs to store previous stable values
  const prevConversationsRef = useRef<DashboardConversation[]>(EMPTY_ARRAY);
  const prevProgressRef = useRef<UserProgress | null>(null);

  const { data: user, isLoading: userLoading } = useQuery<DashboardUser>({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: rawConversations, isLoading: conversationsLoading } = useQuery<DashboardConversation[]>({
    queryKey: ['/api/conversations'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: personas = EMPTY_ARRAY, isLoading: personasLoading } = useQuery<DashboardPersona[]>({
    queryKey: ['/api/personas'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: scenarios = EMPTY_ARRAY, isLoading: scenariosLoading } = useQuery<DashboardScenario[]>({
    queryKey: ['/api/scenarios'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: rawProgress, isLoading: progressLoading } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stabilize conversations array
  const conversations = useMemo(() => {
    if (!rawConversations || !Array.isArray(rawConversations)) {
      return prevConversationsRef.current;
    }
    
    // Deep equality check to prevent unnecessary updates
    const isEqual = JSON.stringify(prevConversationsRef.current) === JSON.stringify(rawConversations);
    if (isEqual) {
      return prevConversationsRef.current;
    }
    
    prevConversationsRef.current = rawConversations;
    return rawConversations;
  }, [rawConversations]);

  // Stabilize progress object
  const progress = useMemo(() => {
    if (!rawProgress || typeof rawProgress !== 'object') {
      return prevProgressRef.current;
    }
    
    // Deep equality check to prevent unnecessary updates
    const isEqual = JSON.stringify(prevProgressRef.current) === JSON.stringify(rawProgress);
    if (isEqual) {
      return prevProgressRef.current;
    }
    
    prevProgressRef.current = rawProgress;
    return rawProgress;
  }, [rawProgress]);

  // Memoized filtered conversations with stable dependencies
  const activeConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return EMPTY_ARRAY;
    
    const filtered = conversations.filter(conv => {
      return conv && 
             typeof conv === 'object' && 
             conv !== null &&
             conv.status === 'active';
    });
    
    return filtered.length > 0 ? filtered : EMPTY_ARRAY;
  }, [conversations]);

  const recentConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) return EMPTY_ARRAY;
    
    const active = conversations.filter(conv => {
      return conv && 
             typeof conv === 'object' && 
             conv !== null &&
             conv.status === 'active';
    });
    
    if (active.length === 0) return EMPTY_ARRAY;
    
    const withValidDates = active.filter(conv => {
      return conv.startedAt && 
             typeof conv.startedAt === 'string' && 
             !isNaN(new Date(conv.startedAt).getTime());
    });
    
    if (withValidDates.length === 0) return EMPTY_ARRAY;
    
    const sorted = withValidDates.sort((a, b) => {
      const dateA = new Date(a.startedAt).getTime();
      const dateB = new Date(b.startedAt).getTime();
      return dateB - dateA;
    });
    
    return sorted.slice(0, 3);
  }, [conversations]);

  // Memoized progress calculations with stable output
  const progressMetrics = useMemo(() => {
    if (!progress || typeof progress !== 'object' || progress === null) {
      return EMPTY_PROGRESS;
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

  // Japanese status calculation with stable output
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
    user: user || null,
    conversations: conversations || EMPTY_ARRAY,
    personas: personas || EMPTY_ARRAY,
    scenarios: scenarios || EMPTY_ARRAY,
    progress: progress || null,
    activeConversations,
    recentConversations,
    progressMetrics,
    japaneseStatus,
    isLoading,
  };
}
