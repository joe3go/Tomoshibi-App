import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProgress } from '@/lib/supabase/types';
import { getUserProgress, markScenarioComplete, updateScenarioXP } from '@/lib/supabase/database';
import { useSupabaseAuth } from './useSupabaseAuth';

const STORAGE_KEY = 'tomoshibi_progress';

export function useUserProgress() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [localProgress, setLocalProgress] = useState<UserProgress[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLocalProgress(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing local progress:', error);
      }
    }
  }, []);

  // Fetch user progress from Supabase if authenticated
  const { data: supabaseProgress = [], isLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => getUserProgress(user!.id),
    enabled: isAuthenticated && !!user,
  });

  // Complete scenario mutation
  const completeScenarioMutation = useMutation({
    mutationFn: async ({ scenarioId, xp = 0 }: { scenarioId: string; xp?: number }) => {
      if (isAuthenticated && user) {
        return markScenarioComplete(user.id, scenarioId, xp);
      } else {
        // Add to localStorage
        const existing = localProgress.find(p => p.scenario_id === scenarioId);
        if (existing) {
          const updated = localProgress.map(p => 
            p.scenario_id === scenarioId 
              ? { ...p, completed: true, xp: p.xp + xp, updated_at: new Date().toISOString() }
              : p
          );
          setLocalProgress(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated.find(p => p.scenario_id === scenarioId);
        } else {
          const newProgress: UserProgress = {
            id: `local_${Date.now()}`,
            user_id: 'local',
            scenario_id: scenarioId,
            completed: true,
            xp,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const updated = [...localProgress, newProgress];
          setLocalProgress(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return newProgress;
        }
      }
    },
    onSuccess: () => {
      if (isAuthenticated && user) {
        queryClient.invalidateQueries({ queryKey: ['userProgress', user.id] });
      }
    },
  });

  // Update XP mutation
  const updateXPMutation = useMutation({
    mutationFn: async ({ scenarioId, xp }: { scenarioId: string; xp: number }) => {
      if (isAuthenticated && user) {
        return updateScenarioXP(user.id, scenarioId, xp);
      } else {
        // Update localStorage
        const existing = localProgress.find(p => p.scenario_id === scenarioId);
        if (existing) {
          const updated = localProgress.map(p => 
            p.scenario_id === scenarioId 
              ? { ...p, xp: p.xp + xp, updated_at: new Date().toISOString() }
              : p
          );
          setLocalProgress(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated.find(p => p.scenario_id === scenarioId);
        } else {
          const newProgress: UserProgress = {
            id: `local_${Date.now()}`,
            user_id: 'local',
            scenario_id: scenarioId,
            completed: false,
            xp,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const updated = [...localProgress, newProgress];
          setLocalProgress(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return newProgress;
        }
      }
    },
    onSuccess: () => {
      if (isAuthenticated && user) {
        queryClient.invalidateQueries({ queryKey: ['userProgress', user.id] });
      }
    },
  });

  const progress = isAuthenticated ? supabaseProgress : localProgress;

  const getScenarioProgress = (scenarioId: string) => {
    return progress.find(p => p.scenario_id === scenarioId);
  };

  const getTotalXP = () => {
    return progress.reduce((total, p) => total + p.xp, 0);
  };

  const getCompletedScenarios = () => {
    return progress.filter(p => p.completed);
  };

  return {
    progress,
    isLoading: isAuthenticated ? isLoading : false,
    completeScenario: completeScenarioMutation.mutate,
    updateXP: updateXPMutation.mutate,
    getScenarioProgress,
    getTotalXP,
    getCompletedScenarios,
    isUpdating: completeScenarioMutation.isPending || updateXPMutation.isPending,
  };
}