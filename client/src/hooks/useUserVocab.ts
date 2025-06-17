import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserVocab } from '@/lib/supabase/types';
import { getUserVocab, addUserVocab, removeUserVocab } from '@/lib/supabase/database';
import { useSupabaseAuth } from './useSupabaseAuth';

const STORAGE_KEY = 'tomoshibi_vocab';

export function useUserVocab() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const [localVocab, setLocalVocab] = useState<UserVocab[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setLocalVocab(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing local vocab:', error);
      }
    }
  }, []);

  // Fetch user vocab from Supabase if authenticated
  const { data: supabaseVocab = [], isLoading } = useQuery({
    queryKey: ['userVocab', user?.id],
    queryFn: () => getUserVocab(user!.id),
    enabled: isAuthenticated && !!user,
  });

  // Add vocab mutation
  const addVocabMutation = useMutation({
    mutationFn: async (vocab: Omit<UserVocab, 'id' | 'user_id' | 'created_at'>) => {
      if (isAuthenticated && user) {
        return addUserVocab(user.id, vocab);
      } else {
        // Add to localStorage
        const newVocab: UserVocab = {
          id: `local_${Date.now()}`,
          user_id: 'local',
          created_at: new Date().toISOString(),
          ...vocab,
        };
        const updated = [newVocab, ...localVocab];
        setLocalVocab(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newVocab;
      }
    },
    onSuccess: () => {
      if (isAuthenticated && user) {
        queryClient.invalidateQueries({ queryKey: ['userVocab', user.id] });
      }
    },
  });

  // Remove vocab mutation
  const removeVocabMutation = useMutation({
    mutationFn: async (vocabId: string) => {
      if (isAuthenticated && user) {
        return removeUserVocab(user.id, vocabId);
      } else {
        // Remove from localStorage
        const updated = localVocab.filter(v => v.id !== vocabId);
        setLocalVocab(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true;
      }
    },
    onSuccess: () => {
      if (isAuthenticated && user) {
        queryClient.invalidateQueries({ queryKey: ['userVocab', user.id] });
      }
    },
  });

  const vocab = isAuthenticated ? supabaseVocab : localVocab;

  return {
    vocab,
    isLoading: isAuthenticated ? isLoading : false,
    addVocab: addVocabMutation.mutate,
    removeVocab: removeVocabMutation.mutate,
    isAddingVocab: addVocabMutation.isPending,
    isRemovingVocab: removeVocabMutation.isPending,
  };
}