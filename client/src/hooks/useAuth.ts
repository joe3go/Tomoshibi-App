import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!getAuthToken(),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!getAuthToken(),
    error,
  };
}
