import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

export function useAuth() {
  const token = getAuthToken();
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    staleTime: 0, // Always refetch when token changes
  });

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    error,
  };
}
