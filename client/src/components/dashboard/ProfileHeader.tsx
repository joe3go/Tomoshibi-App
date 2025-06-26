
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/lib/supabase-user-profile";

interface ProfileHeaderProps {
  userProfile: UserProfile | null;
  userEmail?: string;
  displayName?: string;
}

export default function ProfileHeader({ userProfile, userEmail, displayName }: ProfileHeaderProps) {
  const userName = userProfile?.display_name || displayName || userEmail?.split('@')[0] || 'Student';

  return (
    <div className="welcome-section">
      <div className="welcome-content">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={userProfile?.avatar_url} alt="Profile" />
            <AvatarFallback>
              {userName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="welcome-title">
              Welcome back, {userName}!
            </h1>
            <p className="welcome-subtitle">Keep your momentum going!</p>
            {userProfile?.jlpt_goal_level && (
              <Badge variant="secondary" className="mt-1">
                Goal: {userProfile.jlpt_goal_level}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
