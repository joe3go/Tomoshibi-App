import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="navbar">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">Tomoshibi</h1>
            <span className="text-lg font-japanese text-muted-foreground">灯火</span>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            className="btn-primary"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                  An Output Focused Platform
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-primary leading-tight">
                  Master Japanese
                  <span className="block text-primary font-japanese">会話を学ぼう</span>
                </h1>
                
                <p className="text-xl text-primary max-w-2xl leading-relaxed">
                  Practice authentic Japanese conversations with AI-powered tutors. 
                  Build confidence through interactive scenarios designed for JLPT N5 learners.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={() => setLocation("/login")}
                  size="lg"
                  className="btn-primary text-lg px-8 py-4"
                >
                  Start Learning
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="btn-secondary text-lg px-8 py-4"
                >
                  View Demo
                </Button>
              </div>

              {/* Feature Highlights */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4">
                <div className="flex items-center space-x-2 text-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">AI-Powered Conversations</span>
                </div>
                <div className="flex items-center space-x-2 text-foreground">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Real-World Scenarios</span>
                </div>
                <div className="flex items-center space-x-2 text-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Progress Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Preview */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {/* Main Preview Card */}
                <div className="content-card">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-light">
                      <h3 className="font-semibold text-primary">Conversation Practice</h3>
                      <div className="status-tag n5">N5 Level</div>
                    </div>
                    
                    {/* Conversation Preview */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="avatar sensei flex-shrink-0">
                          <span className="font-japanese">先</span>
                        </div>
                        <div className="message-bubble ai flex-1">
                          <span className="font-japanese">こんにちは！今日はいい天気ですね。</span>
                          <div className="text-xs text-muted mt-1">Hello! The weather is nice today.</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="message-bubble user">
                          <span className="font-japanese">はい、とてもいい天気です！</span>
                        </div>
                        <div className="avatar student flex-shrink-0">
                          <span>You</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="pt-3 border-t border-light">
                      <div className="flex items-center justify-between text-sm text-secondary mb-2">
                        <span>Progress</span>
                        <span>3/5 exchanges</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Stats */}
                <div className="absolute -right-4 -top-4 content-card p-3 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">127</div>
                    <div className="text-xs text-secondary">Words Learned</div>
                  </div>
                </div>
                
                <div className="absolute -left-4 -bottom-4 content-card p-3 shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">15</div>
                    <div className="text-xs text-secondary">Scenarios</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">Why Choose Tomoshibi?</h2>
            <p className="text-xl text-foreground">Effective Japanese learning through interactive conversations</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="content-card text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">AI Tutors</h3>
              <p className="text-foreground">Learn with Haruki-sensei and Aoi-chan, each offering unique teaching approaches tailored to your learning style.</p>
            </div>
            
            <div className="content-card text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Real Scenarios</h3>
              <p className="text-foreground">Practice conversations for everyday situations like shopping, dining, and social interactions.</p>
            </div>
            
            <div className="content-card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">Track Progress</h3>
              <p className="text-foreground">Monitor your vocabulary growth, conversation skills, and JLPT N5 preparation progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1,000+</div>
              <div className="text-foreground">Active Learners</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-foreground">Scenarios</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-foreground">Vocabulary Words</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-blue-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">Ready to Start Your Japanese Journey?</h2>
          <p className="text-xl text-foreground mb-8">
            Join thousands of learners building confidence in Japanese conversation
          </p>
          <Button 
            onClick={() => setLocation("/login")}
            size="lg"
            className="btn-primary text-lg px-8 py-4"
          >
            Start Learning Today
          </Button>
        </div>
      </section>
    </div>
  );
}