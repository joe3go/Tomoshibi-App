import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, BookOpen, History } from 'lucide-react';
import type { HeaderProps } from '@/types/dashboard';

/**
 * Dashboard header component with user profile and navigation
 * Maintains exact DOM structure and styling from original dashboard
 */
export const DashboardHeader = React.memo<HeaderProps>(({
  user,
  progressionLabel,
  onNavigate,
  onLogout
}) => {
  return (
    <header className="content-card mb-6 flex items-center justify-between">
      <div 
        className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
        onClick={() => onNavigate("/settings")}
      >
        <div className="avatar student">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="font-medium">
              {user?.displayName?.[0]?.toUpperCase() || "U"}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-primary">
            {user?.displayName || "User"}
          </h2>
          <p className="text-sm text-foreground">{progressionLabel}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("/vocabulary")}
          className="text-foreground hover:text-primary flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Vocabulary
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("/history")}
          className="text-foreground hover:text-primary flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          History
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("/settings")}
          className="p-2 text-foreground hover:text-primary"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-foreground hover:text-primary"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';