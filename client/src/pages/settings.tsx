import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Target, Globe, Palette, Save } from "lucide-react";
import { getUserProfile, updateUserProfile, createUserProfile, UserProfile } from "@/lib/supabase-user-profile";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, session } = useAuth();
  const isAuthenticated = !!session;
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    username: '',
    display_name: '',
    avatar_url: '',
    prefers_english: false,
    jlpt_goal_level: 'N5',
    native_language: '',
    timezone: '',
    theme: 'light',
    learning_goals: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      try {
        let userProfile = await getUserProfile(user.id);

        // Create profile if it doesn't exist
        if (!userProfile) {
          userProfile = await createUserProfile(user.id, {
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
            username: user.email?.split('@')[0] || '',
          });
        }

        if (userProfile) {
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadProfile();
    }
  }, [user?.id, toast]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const updated = await updateUserProfile(user.id, profile);
      if (updated) {
        toast({
          title: "Settings saved",
          description: "Your profile has been updated successfully",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/dashboard')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name || ''}
                  onChange={(e) => updateField('display_name', e.target.value)}
                  placeholder="How you'd like to be addressed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="Unique username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={profile.avatar_url || ''}
                onChange={(e) => updateField('avatar_url', e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Learning Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Learning Preferences
            </CardTitle>
            <CardDescription>
              Set your Japanese learning goals and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jlpt_goal_level">JLPT Goal Level</Label>
                <Select
                  value={profile.jlpt_goal_level || 'N5'}
                  onValueChange={(value) => updateField('jlpt_goal_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N5">N5 (Beginner)</SelectItem>
                    <SelectItem value="N4">N4 (Elementary)</SelectItem>
                    <SelectItem value="N3">N3 (Intermediate)</SelectItem>
                    <SelectItem value="N2">N2 (Upper-Intermediate)</SelectItem>
                    <SelectItem value="N1">N1 (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="native_language">Native Language</Label>
                <Input
                  id="native_language"
                  value={profile.native_language || ''}
                  onChange={(e) => updateField('native_language', e.target.value)}
                  placeholder="English, Spanish, etc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning_goals">Learning Goals</Label>
              <Textarea
                id="learning_goals"
                value={profile.learning_goals || ''}
                onChange={(e) => updateField('learning_goals', e.target.value)}
                placeholder="Describe your Japanese learning goals..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="prefers_english"
                checked={profile.prefers_english || false}
                onCheckedChange={(checked) => updateField('prefers_english', checked)}
              />
              <Label htmlFor="prefers_english">Prefer English explanations</Label>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={profile.theme || 'light'}
                  onValueChange={(value) => updateField('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={profile.timezone || ''}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  placeholder="America/New_York, Asia/Tokyo, etc."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}