import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Upload, Save, Mail } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);

  // Fetch user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setDisplayName((user as any).displayName || "");
      setSoundNotifications((user as any).soundNotifications ?? true);
      setDesktopNotifications((user as any).desktopNotifications ?? true);
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/users/${(user as any)?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Avatar upload mutation
  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    const updates: any = {
      displayName,
      soundNotifications,
      desktopNotifications,
    };

    if (newPassword && newPassword === confirmPassword) {
      updates.currentPassword = currentPassword;
      updates.newPassword = newPassword;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      avatarUploadMutation.mutate(file);
    }
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent("Tomoshibi Feedback");
    const body = encodeURIComponent("Hi,\n\nI'd like to share feedback about Tomoshibi:\n\n");
    window.open(`mailto:feedback@tomoshibi.app?subject=${subject}&body=${body}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary border-l-transparent rounded-full animate-spin"></div>
            <span className="text-foreground">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-navy p-4">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="text-off-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-xl font-semibold text-off-white">Account Settings</h1>
        <div className="w-24"></div> {/* Spacer for centering */}
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-off-white flex items-center space-x-2">
              <span>Profile Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {(user as any)?.profileImageUrl ? (
                  <img
                    src={(user as any).profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground font-medium">
                    {(user as any)?.displayName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="avatar-upload" className="text-off-white/90">
                  Profile Picture
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    disabled={avatarUploadMutation.isPending}
                    className="border-sakura-blue/50 text-sakura-blue hover:bg-sakura-blue/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {avatarUploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName" className="text-off-white/90">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-input border-border text-foreground"
                placeholder="Enter your display name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <Label className="text-off-white/90">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-muted/30 border-border text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-off-white">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-off-white/90">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-off-white/90">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-off-white/90">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-off-white">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-off-white/90">Sound Notifications</Label>
                <p className="text-off-white/60 text-sm">Play sounds for new messages and achievements</p>
              </div>
              <Switch
                checked={soundNotifications}
                onCheckedChange={setSoundNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-off-white/90">Desktop Notifications</Label>
                <p className="text-off-white/60 text-sm">Show browser notifications for important updates</p>
              </div>
              <Switch
                checked={desktopNotifications}
                onCheckedChange={setDesktopNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleProfileUpdate}
            disabled={updateProfileMutation.isPending}
            className="gradient-button flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSendFeedback}
            className="border-sakura-blue/50 text-sakura-blue hover:bg-sakura-blue/10 flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}