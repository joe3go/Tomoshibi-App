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
        .select('id, title, description, default_personas, group_prompt_suffix')
        .eq('mode', 'group')
        .order('title');

      if (error) {
        logError('Failed to fetch conversation templates:', error);
        throw error;
      }

      return data || [];
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
        throw new Error('Invalid response: missing conversation ID')
      }

      logInfo('✅ Navigating to group chat with conversation ID:', conversationId);

      // Store conversation ID and navigate with URL parameter
      localStorage.setItem('currentGroupConversationId', conversationId);

      // Use a slight delay to ensure localStorage is written
      setTimeout(() => {
        const targetUrl = `/group-chat?conversationId=${conversationId}`;
        logInfo('🔗 Navigating to:', targetUrl);
        setLocation(targetUrl);
      }, 50);
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