import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/group-chat/TemplateSelector";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { logDebug, logError, logInfo } from "@utils/logger";
import { generateUUID } from "@utils/uuid";

export default function PracticeGroups() {
  const [, setLocation] = useLocation();
  const { user, session, loading } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  // Fetch group conversation templates from Supabase
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['conversation-templates', 'group'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_templates')
        .select('id, title, description, default_personas, group_prompt_suffix, topic, participant_count')
        .eq('mode', 'group')
        .order('title');

      if (error) {
        console.error('Failed to fetch conversation templates:', error);
        // Return fallback templates matching your actual database structure
        return [
          {
            id: 'b987f235-5199-4deb-86ec-af042c2bbeeb', // Anime Club actual ID
            title: 'Anime Club',
            description: 'Chat with others about your favorite anime, characters, and seasons',
            default_personas: ['8b0f056c-41fb-4c47-baac-6029c64e026a', '9612651e-d1df-428f-865c-2a1c005952ef', 'e73a0afc-3ee9-4886-b39a-c6f516ad7db7'],
            group_prompt_suffix: 'You are discussing anime together - your favorite shows, characters, genres, and recommendations. Talk about specific anime series, what you like about them, and share recommendations naturally.',
            topic: 'anime_discussion',
            participant_count: 3
          },
          {
            id: '76d38157-b77f-48f0-a8c5-f1d6a48273f4', // Japanese Learning actual ID
            title: 'Japanese Focused Learning',
            description: 'Practice Japanese in a guided group with adaptive level support',
            default_personas: ['9612651e-d1df-428f-865c-2a1c005952ef', 'be32911d-08a9-4308-8a00-7ffa5144ccdc'],
            group_prompt_suffix: 'Help the user practice Japanese at their current level. Make polite corrections and adjust complexity based on their responses.',
            topic: 'grammar_practice',
            participant_count: 2
          },
          {
            id: 'c86fb330-12ed-400b-9953-155dd9321072', // Casual Chat actual ID
            title: 'Casual Random Chat',
            description: 'Light, everyday conversation with natural Japanese adapted to your level',
            default_personas: ['9612651e-d1df-428f-865c-2a1c005952ef', 'e4390fc8-40b4-4ad1-a153-08bc37482dad'],
            group_prompt_suffix: 'Keep it light and informal. Use friendly Japanese appropriate for the user\'s level. Talk about food, daily life, or anything random.',
            topic: 'daily_life',
            participant_count: 2
          }
        ];
      }

      return data;
    }
  });

  // Create group conversation mutation
  const createGroupMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!isAuthenticated) throw new Error('Must be logged in');

      logInfo('🚀 Creating group conversation with template ID:', templateId);

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          templateId,
          mode: 'group'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logError('❌ Failed to create group conversation:', errorData);
        throw new Error(`Failed to create group conversation: ${errorData}`);
      }

      const result = await response.json();
      logInfo('✅ Group conversation created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Group conversation created!",
        description: "Redirecting to your new group chat...",
      });

      // Handle both possible response formats
      const conversationId = data.conversationId || data.conversation?.id;
      if (!conversationId) {
        logError('❌ No conversation ID in response:', data);
        throw new Error('Invalid response: missing conversation ID');
      }

      // Store conversation ID and navigate with URL parameter
      localStorage.setItem('currentGroupConversationId', conversationId);
      setLocation(`/group-chat?conversationId=${conversationId}`);
    },
    onError: (error) => {
      logError('❌ Error creating group conversation:', error);
      toast({
        title: "Failed to create group conversation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-rose-600 bg-clip-text text-transparent">
                Practice Groups
              </CardTitle>
              <CardDescription className="text-lg">
                Join AI-powered group conversations to practice Japanese in realistic social settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{templates.length}</div>
                  <div className="text-sm text-muted-foreground">Available Groups</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">Multiple</div>
                  <div className="text-sm text-muted-foreground">AI Participants</div>
                </div>
                <div className="text-center p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">Real-time</div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Practice Group</CardTitle>
              <CardDescription>
                Select a group conversation template that matches your interests and learning goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateSelector
                templates={templates}
                onSelectTemplate={(templateId) => createGroupMutation.mutate(templateId)}
                isLoading={isLoading || createGroupMutation.isPending}
              />
            </CardContent>
          </Card>

          {/* Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Natural Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Experience realistic group dynamics with multiple AI participants who have unique personalities and speaking styles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adaptive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Groups automatically adjust to your skill level and provide contextual feedback to improve your Japanese.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}