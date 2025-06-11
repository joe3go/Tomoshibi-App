import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, LogOut, MessageCircle, User, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
  });

  // Fetch scenarios
  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ["/api/scenarios"],
  });

  // Fetch personas
  const { data: personas, isLoading: personasLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  // Fetch progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Simple logout - just clear local storage
      localStorage.removeItem("token");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getScenarioJapanese = (title: string): string => {
    const scenarios: Record<string, string> = {
      "Self-Introduction": "自己紹介",
      "Shopping": "買い物",
      "Restaurant": "レストラン",
      "Directions": "道案内",
      "Weather": "天気",
      "Family": "家族",
      "Hobbies": "趣味",
      "Work": "仕事",
      "Travel": "旅行",
      "Health": "健康"
    };
    return scenarios[title] || title;
  };

  if (conversationsLoading || scenariosLoading || personasLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="content-card mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="avatar student">
              <span className="font-medium">
                {(user as any)?.displayName?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-primary">
                {(user as any)?.displayName || "User"}
              </h2>
              <p className="text-sm text-secondary">JLPT N5 Learner</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="p-2 text-secondary hover:text-primary">
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-secondary hover:text-primary"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </header>

        {/* Start New Conversation */}
        <div className="mb-8 text-center">
          <div className="content-card max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              Ready to Practice?
            </h3>
            <p className="text-secondary mb-6">
              Choose your tutor and start a new conversation to improve your Japanese skills.
            </p>
            
            <Button 
              onClick={() => setLocation("/tutor-selection")}
              className="btn-primary w-full"
            >
              Start New Conversation
            </Button>
          </div>
        </div>

        {/* Continue Conversations Section */}
        {Array.isArray(conversations) && conversations.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-primary">Continue Learning</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversations.slice(0, 6).map((conversation: any) => {
                const persona = Array.isArray(personas) 
                  ? personas.find((p: any) => p.id === conversation.personaId)
                  : null;
                const scenario = Array.isArray(scenarios)
                  ? scenarios.find((s: any) => s.id === conversation.scenarioId)
                  : null;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setLocation(`/chat/${conversation.id}`)}
                    className="content-card cursor-pointer group"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <div className={`avatar ${persona?.type === 'teacher' ? 'sensei' : 'yuki'} flex-shrink-0`}>
                        <span className="font-japanese">
                          {persona?.type === 'teacher' ? '先' : '友'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-primary group-hover:text-blue-600 transition-colors">
                          {persona?.name || 'Unknown'}
                        </h4>
                        <p className="text-sm text-secondary">
                          {scenario?.title || 'Practice Session'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="status-tag in-progress">In Progress</div>
                      <div className="text-xs text-muted">
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="content-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-primary">Conversations</h3>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
              {Array.isArray(conversations) ? conversations.length : 0}
            </div>
            <p className="text-sm text-secondary mb-3">Total completed</p>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (Array.isArray(conversations) ? conversations.length : 0) * 10)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="content-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-japanese text-lg">語</span>
              </div>
              <h3 className="font-semibold text-primary">Vocabulary</h3>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
              {(progress as any)?.vocabEncountered?.length || 0}
            </div>
            <p className="text-sm text-secondary mb-3">Words learned</p>
            
            <div className="progress-bar">
              <div 
                className="progress-fill orange" 
                style={{ width: `${Math.min(100, ((progress as any)?.vocabEncountered?.length || 0) * 2)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="content-card">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-primary">Scenarios</h3>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
              {Array.isArray(scenarios) ? scenarios.length : 0}/10
            </div>
            <p className="text-sm text-secondary mb-3">Available</p>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, (Array.isArray(scenarios) ? scenarios.length : 0) * 10)}%`,
                  backgroundColor: '#10B981'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tutors Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-primary">Meet Your Tutors</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.isArray(personas) && personas.map((persona: any) => (
              <div
                key={persona.id}
                className="content-card cursor-pointer group"
                onClick={() => setLocation("/tutor-selection")}
              >
                <div className="flex items-start space-x-4">
                  <div className={`avatar ${persona.type === 'teacher' ? 'sensei' : 'yuki'} flex-shrink-0`}>
                    <span className="font-japanese">
                      {persona.type === 'teacher' ? '先' : '友'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary group-hover:text-blue-600 transition-colors mb-1">
                      {persona.name}
                    </h4>
                    <div className="status-tag n5 mb-2">
                      {persona.jlptLevel} Level
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {persona.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="content-card">
            <h4 className="font-semibold text-primary mb-3">Quick Practice</h4>
            <p className="text-secondary text-sm mb-4">
              Jump into a conversation with your preferred tutor
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setLocation("/tutor-selection")}
                className="btn-secondary w-full justify-start"
              >
                <User className="w-4 h-4 mr-2" />
                Choose Tutor
              </Button>
              <Button
                onClick={() => setLocation("/scenario-selection")}
                className="btn-secondary w-full justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Browse Scenarios
              </Button>
            </div>
          </div>

          <div className="content-card">
            <h4 className="font-semibold text-primary mb-3">Learning Tips</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-secondary">Practice speaking out loud to improve pronunciation</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-secondary">Review vocabulary after each conversation</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-secondary">Don't worry about mistakes - they help you learn!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}