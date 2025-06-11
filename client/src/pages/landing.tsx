import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageCircle, BookOpen, TrendingUp, Users, Star, CheckCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="navbar absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold font-japanese" style={{ color: 'var(--kin)' }}>Tomoshibi</h1>
            <span className="text-lg font-japanese" style={{ color: 'var(--washi)' }}>灯火</span>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            variant="outline"
            className="lesson-card text-washi hover:bg-aka"
            style={{ borderColor: 'var(--kin)', color: 'var(--washi)' }}
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Atmospheric Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Curved flowing lines inspired by traditional Japanese art */}
          <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 1200 800">
            <path
              d="M-100,200 Q300,100 600,250 T1200,200"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M-100,600 Q400,450 800,550 T1300,500"
              stroke="hsl(var(--secondary))"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: "1s" }}
            />
          </svg>
          
          {/* Floating particle effects */}
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-secondary/60 rounded-full animate-ping" style={{ animationDelay: "2s" }}></div>
          <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: "3s" }}></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 ma-spacing">
              <div className="space-y-6">
                <div className="text-sm uppercase tracking-wide text-muted-foreground font-medium">
                  The art of learning
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  When the learning
                  <br />
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    illuminates
                  </span>
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Master Japanese conversation through AI-powered practice sessions. 
                  Like a gentle flame guiding your path to fluency.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setLocation("/login")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-6 text-lg tomoshibi-glow"
                >
                  Begin Your Journey
                </Button>
                <Button
                  variant="outline"
                  className="border-muted-foreground/30 text-foreground hover:bg-muted px-8 py-6 text-lg"
                >
                  Learn More →
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span>500+ learners</span>
                </div>
              </div>
            </div>

            {/* Right Content - Authentic Chōchin Lantern */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative fade-in-up">
                {/* Chōchin Lantern SVG with Glow */}
                <div className="relative w-64 h-80">
                  <svg viewBox="0 0 200 300" className="w-full h-full">
                    {/* Lantern Body */}
                    <ellipse cx="100" cy="150" rx="80" ry="120" 
                      fill="var(--urushi)" 
                      stroke="var(--kin)" 
                      strokeWidth="2"
                      opacity="0.9"/>
                    
                    {/* Horizontal Ribs */}
                    <line x1="20" y1="80" x2="180" y2="80" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    <line x1="25" y1="110" x2="175" y2="110" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    <line x1="30" y1="140" x2="170" y2="140" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    <line x1="30" y1="170" x2="170" y2="170" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    <line x1="25" y1="200" x2="175" y2="200" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    <line x1="20" y1="230" x2="180" y2="230" stroke="var(--kin)" strokeWidth="1" opacity="0.6"/>
                    
                    {/* Inner Glow */}
                    <ellipse cx="100" cy="150" rx="60" ry="100" 
                      fill="var(--kin)" 
                      opacity="0.3"/>
                    
                    {/* Central Flame */}
                    <ellipse cx="100" cy="150" rx="15" ry="20" 
                      fill="var(--aka)" 
                      className="animate-pulse"/>
                    
                    {/* Top Cap */}
                    <rect x="85" y="25" width="30" height="15" 
                      fill="var(--sumi)" 
                      stroke="var(--kin)" 
                      strokeWidth="1" 
                      rx="3"/>
                    
                    {/* Bottom Cap */}
                    <rect x="80" y="275" width="40" height="12" 
                      fill="var(--sumi)" 
                      stroke="var(--kin)" 
                      strokeWidth="1" 
                      rx="2"/>
                    
                    {/* Hanging String */}
                    <line x1="100" y1="10" x2="100" y2="25" 
                      stroke="var(--kin)" 
                      strokeWidth="2"/>
                    
                    {/* Glow Filter */}
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                  </svg>
                  
                  {/* Apply the paper-lantern class for additional glow */}
                  <div className="absolute inset-0 paper-lantern rounded-full opacity-30 -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 ma-spacing">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">Three pillars of learning</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the harmony of traditional learning methods with modern AI technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Personalized AI Tutors */}
            <Card className="glass-card subtle-depth hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Personalized AI Tutors</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Practice with Haruki-sensei for formal lessons or Aoi-chan for casual conversations. 
                    Each AI tutor adapts to your learning style.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 - JLPT N5 Scenarios */}
            <Card className="glass-card subtle-depth hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl flex items-center justify-center border border-secondary/20">
                  <BookOpen className="w-8 h-8 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">JLPT N5 Scenarios</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Master real-life situations through structured dialogue practice. 
                    From restaurant ordering to job interviews.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 - Real-Time Feedback */}
            <Card className="glass-card subtle-depth hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">Gentle Guidance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Receive thoughtful corrections and encouragement. 
                    Track your progress as you build confidence naturally.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card subtle-depth">
            <CardContent className="p-12 text-center">
              <h3 className="text-2xl font-semibold mb-8">Join our learning community</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">500+</div>
                  <div className="text-muted-foreground">Active Learners</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">10+</div>
                  <div className="text-muted-foreground">Practice Scenarios</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">95%</div>
                  <div className="text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center space-x-3">
            <h3 className="text-2xl font-bold text-primary font-japanese">Tomoshibi</h3>
            <span className="text-secondary text-lg font-japanese">灯火</span>
          </div>
          <p className="text-muted-foreground">A small light in the dark, guiding your Japanese learning journey</p>
          <Button
            onClick={() => setLocation("/login")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 tomoshibi-glow"
          >
            Start Learning Today
          </Button>
        </div>
      </footer>
    </div>
  );
}