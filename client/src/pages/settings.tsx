import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User as UserIcon, BookOpen, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useApiMutation } from '@/hooks/useApiMutation';
import { removeAuthToken } from '@/lib/auth';
import { ApiService } from '@/services/api';
import PageHeader from '@/components/layout/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { JLPT_LEVELS, STUDY_GOALS, DIFFICULTY_LEVELS } from '@/constants/jlpt';
import type { User, UserProgress } from "@shared/schema";
import type { BaseComponentProps } from '@/types';

interface SettingsProps extends BaseComponentProps {}

const Settings: React.FC<SettingsProps> = React.memo(() => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    jlptLevel: 'N5',
    studyGoal: 'conversation',
    preferredDifficulty: 'adaptive'
  });

  const { data: userAccountSettings, isLoading: isLoadingUserSettings } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    onSuccess: (data) => {
      setProfileForm({
        displayName: data.displayName || '',
        jlptLevel: data.jlptLevel || 'N5',
        studyGoal: data.studyGoal || 'conversation',
        preferredDifficulty: data.preferredDifficulty || 'adaptive'
      });
    }
  });

  const { data: userLearningProgress } = useQuery<UserProgress>({
    queryKey: ['/api/progress'],
  });

  const updateProfileMutation = useApiMutation({
    endpoint: `/api/users/${userAccountSettings?.id}`,
    method: 'PATCH',
    successMessage: 'Profile updated successfully',
    errorMessage: 'Failed to update profile',
    invalidateQueries: ['/api/auth/me']
  });

  const logoutMutation = useApiMutation({
    endpoint: '/api/auth/logout',
    method: 'POST',
    successMessage: 'Logged out successfully',
    onSuccess: () => {
      removeAuthToken();
      queryClient.clear();
      setLocation('/login');
    }
  });

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    try {
      const data = await ApiService.uploadAvatar(file);
      updateProfileMutation.mutate({ profileImageUrl: data.url });
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [updateProfileMutation]);

  const handleFormFieldChange = useCallback((field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveProfile = useCallback(() => {
    updateProfileMutation.mutate(profileForm);
  }, [profileForm, updateProfileMutation]);

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  if (isLoadingUserSettings) {
    return <LoadingSpinner fullScreen message="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Settings"
          description="Manage your account and learning preferences"
          showBackButton
          backPath="/dashboard"
          icon={<SettingsIcon className="w-5 h-5 text-primary" />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Update your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userAccountSettings?.profileImageUrl} />
                    <AvatarFallback>
                      {userAccountSettings?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
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
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>

                <Separator />

                <FormField
                  type="text"
                  id="displayName"
                  label="Display Name"
                  value={profileForm.displayName}
                  onChange={(value) => handleFormFieldChange('displayName', value)}
                  placeholder="Enter your display name"
                />

                <FormField
                  type="text"
                  id="email"
                  label="Email"
                  value={userAccountSettings?.email || ''}
                  onChange={() => {}}
                  disabled
                  description="Contact support to change your email address"
                />
              </CardContent>
            </Card>

            {/* Learning Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Learning Preferences
                </CardTitle>
                <CardDescription>
                  Customize your learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  type="select"
                  id="jlptLevel"
                  label="Current JLPT Level"
                  value={profileForm.jlptLevel}
                  onChange={(value) => handleFormFieldChange('jlptLevel', value)}
                  options={JLPT_LEVELS.map(level => ({
                    value: level,
                    label: `${level} (${level === 'N5' ? 'Beginner' : level === 'N4' ? 'Elementary' : level === 'N3' ? 'Intermediate' : level === 'N2' ? 'Upper Intermediate' : 'Advanced'})`
                  }))}
                />

                <FormField
                  type="select"
                  id="studyGoal"
                  label="Study Goal"
                  value={profileForm.studyGoal}
                  onChange={(value) => handleFormFieldChange('studyGoal', value)}
                  options={STUDY_GOALS}
                />

                <FormField
                  type="select"
                  id="preferredDifficulty"
                  label="Preferred Difficulty"
                  value={profileForm.preferredDifficulty}
                  onChange={(value) => handleFormFieldChange('preferredDifficulty', value)}
                  options={DIFFICULTY_LEVELS}
                />

                <div className="pt-4">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfileMutation.isPending}
                    className="w-full"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {userLearningProgress?.totalConversations || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {userLearningProgress?.vocabEncountered?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Vocabulary Encountered</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userLearningProgress?.vocabMastered?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Words Mastered</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Export Data
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Reset Progress
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Sign out of your account
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';

export default Settings;