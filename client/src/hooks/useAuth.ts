import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/auth";

export function useAuth() {
  const token = getAuthToken();
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && token !== 'null' && token !== 'undefined',
    retry: false,
    staleTime: 0, // Always refetch when token changes
    refetchOnWindowFocus: false,
    onError: (error: any) => {
      // If token is invalid, clear it
      if (error?.status === 401 || error?.status === 403) {
        localStorage.removeItem('token');
      }
    }
  });

  // Clear invalid tokens
  if (token && (token === 'null' || token === 'undefined' || token.trim() === '')) {
    localStorage.removeItem('token');
  }

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token && token !== 'null' && token !== 'undefined',
    error,
  };
}
