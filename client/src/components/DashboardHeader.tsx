
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Settings, LogOut, BookOpen, History } from 'lucide-react';
import { EnhancedButton } from './EnhancedButton';
import { EnhancedCard } from './EnhancedCard';

interface DashboardHeaderProps {
  user: any;
  progressionLabel: string;
  onLogout: () => void;
}

export default function DashboardHeader({ user, progressionLabel, onLogout }: DashboardHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <EnhancedCard className="mb-6 flex items-center justify-between">
      <div 
        className="flex items-center space-x-3 cursor-pointer hover:opacity-80"
        onClick={() => setLocation("/settings")}
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
        <EnhancedButton
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/vocabulary")}
          className="text-foreground hover:text-primary flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Vocabulary
        </EnhancedButton>
        <EnhancedButton
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/history")}
          className="text-foreground hover:text-primary flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          History
        </EnhancedButton>
        <EnhancedButton
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/settings")}
          className="p-2 text-foreground hover:text-primary"
        >
          <Settings className="w-5 h-5" />
        </EnhancedButton>
        <EnhancedButton
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-foreground hover:text-primary"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </EnhancedButton>
      </div>
    </EnhancedCard>
  );
}
