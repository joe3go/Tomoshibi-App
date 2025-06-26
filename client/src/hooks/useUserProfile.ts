
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getUserProfile, updateStreak, addXP, UserProfile } from "@/lib/supabase-user-profile";

export function useUserProfile() {
  const { user } = useAuth();

  const { data: userProfile, ...query } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profile = await getUserProfile(user.id);
      if (profile) {
        // Update streak when user visits dashboard
        await updateStreak(user.id);
      }
      return profile;
    },
    enabled: !!user?.id,
  });

  const addUserXP = async (points: number) => {
    if (user?.id) {
      await addXP(user.id, points);
    }
  };

  return {
    userProfile,
    addUserXP,
    ...query
  };
}
