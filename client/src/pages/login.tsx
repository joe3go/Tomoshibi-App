import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/auth";
import { useLocation } from "wouter";


const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(1, "Display name is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.clear();
      toast({
        title: "Welcome back!",
        description: "Successfully logged in.",
      });
      // Use wouter navigation for SPA routing
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.clear();
      toast({
        title: "Welcome to Tomoshibi!",
        description: "Your account has been created successfully.",
      });
      // Use wouter navigation for SPA routing
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-deep-navy">
      {/* Background decoration */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      
      <Card className="glass-card w-full max-w-md relative z-10 border-glass-border">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-lantern-orange">Tomoshibi</h1>
            <p className="text-sakura-blue text-lg font-japanese">灯火</p>
            <p className="text-off-white/70 mt-2">Your First Japanese Journey</p>
          </div>
          
          {!isRegistering ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-off-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email")}
                  className="mt-2 bg-kanji-glow border-glass-border text-off-white focus:border-lantern-orange focus:ring-lantern-orange/20"
                  placeholder="your@email.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password" className="text-off-white/80">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password")}
                  className="mt-2 bg-kanji-glow border-glass-border text-off-white focus:border-lantern-orange focus:ring-lantern-orange/20"
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full gradient-button hover-glow"
              >
                {loginMutation.isPending ? "Signing in..." : "Begin Journey"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="displayName" className="text-off-white/80">Display Name</Label>
                <Input
                  id="displayName"
                  {...registerForm.register("displayName")}
                  className="mt-2 bg-kanji-glow border-glass-border text-off-white focus:border-lantern-orange focus:ring-lantern-orange/20"
                  placeholder="Your name"
                />
                {registerForm.formState.errors.displayName && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.displayName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="registerEmail" className="text-off-white/80">Email</Label>
                <Input
                  id="registerEmail"
                  type="email"
                  {...registerForm.register("email")}
                  className="mt-2 bg-kanji-glow border-glass-border text-off-white focus:border-lantern-orange focus:ring-lantern-orange/20"
                  placeholder="your@email.com"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="registerPassword" className="text-off-white/80">Password</Label>
                <Input
                  id="registerPassword"
                  type="password"
                  {...registerForm.register("password")}
                  className="mt-2 bg-kanji-glow border-glass-border text-off-white focus:border-lantern-orange focus:ring-lantern-orange/20"
                  placeholder="••••••••"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full gradient-button hover-glow"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          )}
          
          <div className="text-center mt-6">
            <p className="text-off-white/60">
              {!isRegistering ? "New to Japanese?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sakura-blue hover:text-sakura-blue/80 transition-colors"
              >
                {!isRegistering ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
