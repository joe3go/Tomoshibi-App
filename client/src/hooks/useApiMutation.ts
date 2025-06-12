import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseApiMutationOptions<TData, TVariables> {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[];
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useApiMutation<TData = any, TVariables = any>({
  endpoint,
  method = 'POST',
  successMessage,
  errorMessage,
  invalidateQueries = [],
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await apiRequest(method, endpoint, variables);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate specified queries
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });

      // Show success message
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Call custom success handler
      onSuccess?.(data);
    },
    onError: (error) => {
      // Show error message
      toast({
        title: "Error",
        description: errorMessage || error.message || "An error occurred",
        variant: "destructive",
      });

      // Call custom error handler
      onError?.(error);
    },
  });
}