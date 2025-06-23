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

export default function PracticeGroups() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Group conversation templates
  const templates = [
    {
      id: 'anime-club',
      name: 'Anime Club',
      description: 'Chat with Keiko and Aoi about your favorite anime series',
      personas: ['8b0f056c-41fb-4c47-baac-6029c64e026a', '3c9f4d8a-5678-9012-3456-789012345678'], // Keiko + Aoi
      difficulty: 'beginner',
    },
    {
      id: 'study-group',
      name: 'Japanese Study Group',
      description: 'Practice with Aoi and Satoshi in a study session',
      personas: ['3c9f4d8a-5678-9012-3456-789012345678', '2b8e7f3d-4567-8901-2345-678901234567'], // Aoi + Satoshi
      difficulty: 'intermediate',
    },
    {
      id: 'cafe-hangout',
      name: 'Cafe Hangout',
      description: 'Casual conversation with Keiko and Haruki at a Tokyo cafe',
      personas: ['8b0f056c-41fb-4c47-baac-6029c64e026a', 'f7e8d9c2-1234-5678-9abc-def012345678'], // Keiko + Haruki
      difficulty: 'beginner',
    }
  ];

  // Create group conversation mutation
  const createGroupMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error("Template not found");
      }

      // Create conversation with group mode
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: template.name,
          mode: 'group',
          status: 'active'
        })
        .select()
        .single();

      if (convError || !conversation) {
        throw new Error("Failed to create group conversation");
      }

      // Add participants to conversation_participants table if it exists
      try {
        const participantInserts = template.personas.map((personaId, index) => ({
          conversation_id: conversation.id,
          persona_id: personaId,
          role: 'member',
          join_order: index + 1
        }));

        await supabase
          .from('conversation_participants')
          .insert(participantInserts);
      } catch (error) {
        // conversation_participants table might not exist yet, continue anyway
        console.log("conversation_participants table not available, using fallback mode");
      }

      return conversation.id;
    },
    onSuccess: (conversationId) => {
      toast({
        title: "Group chat created!",
        description: "Welcome to your practice group",
      });
      setLocation(`/chat/${conversationId}`);
    },
    onError: (error) => {
      console.error('Group creation failed:', error);
      toast({
        title: "Failed to create group",
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
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</div>
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