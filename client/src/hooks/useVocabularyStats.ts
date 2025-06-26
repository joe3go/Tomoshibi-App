
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getVocabStats } from "@/lib/supabase-functions";

export function useVocabularyStats() {
  const { user } = useAuth();

  const { data: vocabStats, ...query } = useQuery({
    queryKey: ["vocab-stats", user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          console.warn('No current user for vocab stats');
          return null;
        }
        return await getVocabStats(user.id);
      } catch (error) {
        console.error('Error fetching vocab stats:', error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  return { vocabStats, ...query };
}
