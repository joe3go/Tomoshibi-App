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

interface UserSettings {
  id: number;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  jlptLevel: string;
  studyGoal: string;
  preferredDifficulty: string;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const { data: userSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/auth/me'],
  });

  const { data: progress } = useQuery({
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and learning preferences</p>
            </div>
          </div>
        </div>

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
                    <AvatarImage src={userSettings?.profileImageUrl} />
                    <AvatarFallback>
                      {userSettings?.displayName?.charAt(0)?.toUpperCase() || 'U'}
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

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    defaultValue={userSettings?.displayName}
                    onBlur={(e) => handleProfileUpdate('displayName', e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userSettings?.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
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
                {/* JLPT Level */}
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {progress?.totalConversations || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Conversations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress?.vocabEncountered?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Vocabulary Encountered</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress?.vocabMastered?.length || 0}
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
                <Button variant="destructive" className="w-full" disabled>
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Contact support for account management
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}