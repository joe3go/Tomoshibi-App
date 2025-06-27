import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { createConversation } from "@/lib/supabase-functions";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch conversations:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async ({ personaId, title }: { personaId: string; title: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      console.log('🎯 Creating conversation with persona:', personaId, 'title:', title);
      const conversationId = await createConversation(user.id, personaId, null, title);
      console.log('✅ Conversation created with ID:', conversationId, 'Type:', typeof conversationId);
      
      // Return an object with the id property for the onSuccess callback
      return { id: conversationId, title, personaId };
    },
    onError: (error) => {
      console.error('❌ Conversation creation failed:', error);
      toast({
        title: "Failed to start conversation",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    }
  });

  // End conversation mutation
  const endConversationMutation = useMutation({
    mutationFn: async (conversationId: string | number) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      console.log('🛑 Ending conversation:', conversationId);

      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Failed to end conversation:', error);
        throw new Error('Failed to end conversation');
      }

      return { success: true };
    },
    onSuccess: async () => {
      toast({
        title: "Conversation ended",
        description: "The conversation has been completed and moved to your transcripts. +50 XP earned!",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
      refetchConversations();
    },
    onError: (error) => {
      toast({
        title: "Failed to end conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    conversationsLoading,
    refetchConversations,
    createConversationMutation,
    endConversationMutation
  };
}