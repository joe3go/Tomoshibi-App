
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, User, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { removeAuthToken } from '@/lib/auth';

interface UserSettings {
  id: number;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  jlptLevel: string;
  studyGoal: string;
  preferredDifficulty: string;
}

interface UserProgress {
  id: number;
  userId: number;
  jlptLevel: string;
  vocabEncountered: number[];
  vocabMastered: number[];
  grammarEncountered: number[];
  grammarMastered: number[];
  totalConversations: number;
  totalMessagesSent: number;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    removeAuthToken();
    queryClient.clear();
    window.location.href = '/login';
  };

  const { data: userSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/auth/me'],
  });

  const { data: progress } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      const response = await apiRequest('PATCH', `/api/users/${userSettings?.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        updateProfileMutation.mutate({ profileImageUrl: data.url });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = (field: keyof UserSettings, value: string) => {
    updateProfileMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="settings-page-container">
        <div className="settings-content-wrapper">
          <div className="settings-loading-container">
            <div className="settings-loading-content">
              <div className="settings-loading-spinner"></div>
              <p className="settings-loading-text">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <div className="settings-content-wrapper">
        {/* Header */}
        <div className="settings-header">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="settings-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="settings-title-section">
            <div className="settings-icon-container">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="settings-page-title">Settings</h1>
              <p className="settings-page-subtitle">Manage your account and learning preferences</p>
            </div>
          </div>
        </div>

        <div className="settings-grid-layout">
          {/* Profile Settings */}
          <div className="settings-main-column">
            <Card>
              <CardHeader>
                <CardTitle className="settings-section-title">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="settings-profile-content">
                {/* Avatar Upload */}
                <div className="settings-avatar-section">
                  <Avatar className="settings-avatar">
                    <AvatarImage src={userSettings?.profileImageUrl} />
                    <AvatarFallback>
                      {userSettings?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="settings-avatar-upload-label">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Change Avatar'}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="settings-avatar-input"
                    />
                    <p className="settings-avatar-helper-text">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Display Name */}
                <div className="settings-field-group">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    defaultValue={userSettings?.displayName}
                    onBlur={(e) => handleProfileUpdate('displayName', e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="settings-field-group">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userSettings?.email}
                    disabled
                    className="settings-readonly-field"
                  />
                  <p className="settings-field-helper-text">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="settings-section-title">
                  <BookOpen className="w-5 h-5" />
                  Learning Preferences
                </CardTitle>
                <CardDescription>
                  Customize your learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="settings-preferences-content">
                {/* JLPT Level */}
                <div className="settings-field-group">
                  <Label>Current JLPT Level</Label>
                  <Select
                    defaultValue={progress?.jlptLevel || 'N5'}
                    onValueChange={(value) => handleProfileUpdate('jlptLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N5">N5 (Beginner)</SelectItem>
                      <SelectItem value="N4">N4 (Elementary)</SelectItem>
                      <SelectItem value="N3">N3 (Intermediate)</SelectItem>
                      <SelectItem value="N2">N2 (Upper Intermediate)</SelectItem>
                      <SelectItem value="N1">N1 (Advanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Study Goal */}
                <div className="settings-field-group">
                  <Label>Study Goal</Label>
                  <Select
                    defaultValue={userSettings?.studyGoal || 'conversation'}
                    onValueChange={(value) => handleProfileUpdate('studyGoal', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversation">Improve Conversation</SelectItem>
                      <SelectItem value="jlpt">Pass JLPT Exam</SelectItem>
                      <SelectItem value="business">Business Japanese</SelectItem>
                      <SelectItem value="travel">Travel Japanese</SelectItem>
                      <SelectItem value="general">General Proficiency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Difficulty */}
                <div className="settings-field-group">
                  <Label>Preferred Difficulty</Label>
                  <Select
                    defaultValue={userSettings?.preferredDifficulty || 'adaptive'}
                    onValueChange={(value) => handleProfileUpdate('preferredDifficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="settings-sidebar">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent className="settings-stats-content">
                <div className="settings-stat-item">
                  <div className="settings-stat-value settings-stat-value-primary">
                    {progress?.totalConversations || 0}
                  </div>
                  <p className="settings-stat-label">Conversations</p>
                </div>
                <div className="settings-stat-item">
                  <div className="settings-stat-value settings-stat-value-green">
                    {progress?.vocabEncountered?.length || 0}
                  </div>
                  <p className="settings-stat-label">Vocabulary Encountered</p>
                </div>
                <div className="settings-stat-item">
                  <div className="settings-stat-value settings-stat-value-blue">
                    {progress?.vocabMastered?.length || 0}
                  </div>
                  <p className="settings-stat-label">Words Mastered</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="settings-account-actions">
                <Button variant="outline" className="settings-action-button" disabled>
                  Export Data
                </Button>
                <Button variant="outline" className="settings-action-button" disabled>
                  Reset Progress
                </Button>
                <Button 
                  variant="destructive" 
                  className="settings-logout-button" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
                <p className="settings-logout-help-text">
                  Sign out of your account
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
