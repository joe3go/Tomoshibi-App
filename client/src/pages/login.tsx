import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase/client";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { session, loading: authLoading, user } = useAuth();
  const isAuthenticated = !!session;

  // Debug refs and state
  const renderCount = useRef(0);
  const authStateChanges = useRef(0);
  const [debugInfo, setDebugInfo] = useState({
    renderCount: 0,
    authLoading,
    isAuthenticated,
    hasSession: !!session,
    hasUser: !!user,
    userEmail: user?.email,
    authStateChanges: 0,
    lastAuthStateChange: new Date().toISOString()
  });

  // Track renders and auth state changes
  useEffect(() => {
    renderCount.current += 1;
    authStateChanges.current += 1;

    console.log('🔄 Login Page Render:', {
      renderCount: renderCount.current,
      authLoading,
      isAuthenticated,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    });

    setDebugInfo({
      renderCount: renderCount.current,
      authLoading,
      isAuthenticated,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email,
      authStateChanges: authStateChanges.current,
      lastAuthStateChange: new Date().toISOString()
    });
  }, [authLoading, isAuthenticated, session, user]);

  // Redirect if authenticated (only after loading completes)
  useEffect(() => {
    if (!authLoading && !!session) {
      console.log('✅ User authenticated, redirecting to dashboard');
      setLocation('/dashboard');
    }
  }, [authLoading, session, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('🔐 Login attempt started:', {
      isLogin,
      email,
      timestamp: new Date().toISOString()
    });

    try {
      if (isLogin) {
        console.log('📧 Attempting login with email/password...');

        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('🔑 Login response:', {
          hasUser: !!data.user,
          hasSession: !!data.session,
          error: error?.message,
          userEmail: data.user?.email
        });

        if (error) {
          console.error('❌ Login error:', error);
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          console.log('✅ Login successful, user authenticated');
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
          // Don't redirect here - let the auth context handle it
          console.log('⏳ Waiting for auth context to update...');
        }
      } else {
        console.log('📝 Attempting registration...');

        // Register with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              preferred_kanji_display: 'furigana',
            },
          },
        });

        console.log('📋 Registration response:', {
          hasUser: !!data.user,
          hasSession: !!data.session,
          emailConfirmed: !!data.user?.email_confirmed_at,
          error: error?.message
        });

        if (error) {
          console.error('❌ Registration error:', error);
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          if (data.user.email_confirmed_at) {
            console.log('✅ Registration successful, email confirmed');
            // Email already confirmed, redirect to dashboard
            toast({
              title: "Welcome to Tomoshibi!",
              description: "Your account has been created successfully.",
            });
            setLocation('/dashboard');
          } else {
            console.log('📧 Registration successful, email confirmation required');
            // Email confirmation required
            toast({
              title: "Check your email",
              description: "We've sent you a confirmation link. Please check your email and click the link to activate your account.",
            });
          }
        }
      }
    } catch (error) {
      console.error('💥 Unexpected auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Login attempt finished, setting loading to false');
      setIsLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    console.log('⏳ Login page showing auth loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50">
        <div className="space-y-4 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-black/80 text-white p-3 rounded text-xs space-y-1">
              <div>Auth Loading: {authLoading ? 'true' : 'false'}</div>
              <div>Has Session: {!!session ? 'true' : 'false'}</div>
              <div>Render Count: {debugInfo.renderCount}</div>
              <div>Auth State Changes: {debugInfo.authStateChanges}</div>
              <div>Last Update: {debugInfo.lastAuthStateChange}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🌸 Tomoshibi</h1>
          <p className="text-gray-600">Japanese Learning Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to continue your Japanese learning journey" 
                : "Start your Japanese learning adventure"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 bg-gray-100 p-3 rounded text-xs space-y-1">
                  <div><strong>Debug Info:</strong></div>
                  <div>Auth Loading: {debugInfo.authLoading ? 'true' : 'false'}</div>
                  <div>Is Authenticated: {debugInfo.isAuthenticated ? 'true' : 'false'}</div>
                  <div>Has Session: {debugInfo.hasSession ? 'true' : 'false'}</div>
                  <div>Has User: {debugInfo.hasUser ? 'true' : 'false'}</div>
                  <div>User Email: {debugInfo.userEmail || 'none'}</div>
                  <div>Render Count: {debugInfo.renderCount}</div>
                  <div>Auth State Changes: {debugInfo.authStateChanges}</div>
                  <div>Form Loading: {isLoading ? 'true' : 'false'}</div>
                </div>
              )}
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}