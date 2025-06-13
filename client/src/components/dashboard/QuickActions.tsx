
import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, Target, FileText, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const QuickActions = memo(() => {
  const [, setLocation] = useLocation();

  const actions: QuickAction[] = [
    {
      title: 'Vocabulary Tracker',
      description: 'Track your word mastery',
      icon: BookOpen,
      path: '/vocabulary',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      title: 'Browse Scenarios',
      description: 'Explore conversation topics',
      icon: MessageSquare,
      path: '/scenario-browse',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
    },
    {
      title: 'Practice Grammar',
      description: 'Master grammar patterns',
      icon: Target,
      path: '/grammar',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    },
    {
      title: 'View Transcripts',
      description: 'Review past conversations',
      icon: FileText,
      path: '/transcripts',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    },
    {
      title: 'Settings',
      description: 'Customize your experience',
      icon: Settings,
      path: '/settings',
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    },
  ];

  return (
    <Card className="content-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions クイックアクション
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-muted transition-colors"
                onClick={() => setLocation(action.path)}
              >
                <div className={`p-3 rounded-full ${action.color} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;
