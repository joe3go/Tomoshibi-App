import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Cherry Blossom Decorations */}
      <div className="cherry-blossom" style={{ top: '10%', left: '5%' }}></div>
      <div className="cherry-blossom" style={{ top: '20%', right: '10%' }}></div>
      <div className="cherry-blossom" style={{ top: '60%', left: '8%' }}></div>
      <div className="cherry-blossom" style={{ bottom: '15%', right: '5%' }}></div>
      
      {/* Navigation */}
      <nav className="navbar absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold font-japanese glitch" data-text="Tomoshibi">Tomoshibi</h1>
            <span className="text-lg font-japanese text-accent">灯火</span>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            className="cta-button px-6 py-2 font-tech"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left fade-in-up">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight font-japanese">
                  Master Japanese
                  <span className="block text-primary glitch" data-text="会話を学ぼう">会話を学ぼう</span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed font-tech">
                  Immerse yourself in authentic Japanese conversations with AI-powered tutors. 
                  Practice real scenarios, build confidence, and achieve fluency through interactive learning.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={() => setLocation("/login")}
                  size="lg"
                  className="cta-button text-lg px-8 py-4 font-japanese"
                >
                  始めましょう Start Learning
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-primary hover:bg-primary hover:text-primary-foreground font-tech"
                >
                  View Demo
                </Button>
              </div>

              {/* Feature Pills - Fighting Game Style */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4">
                <div className="cyberpunk-card inline-flex items-center px-4 py-2 text-sm">
                  <span className="mr-2 text-accent">🎌</span>
                  <span className="font-tech">JLPT N5 Focus</span>
                </div>
                <div className="cyberpunk-card inline-flex items-center px-4 py-2 text-sm">
                  <span className="mr-2 text-secondary">🤖</span>
                  <span className="font-tech">AI Tutors</span>
                </div>
                <div className="cyberpunk-card inline-flex items-center px-4 py-2 text-sm">
                  <span className="mr-2 text-primary">💬</span>
                  <span className="font-tech">Real Scenarios</span>
                </div>
              </div>
            </div>

            {/* Right Content - Cyberpunk Combat Interface */}
            <div className="flex justify-center lg:justify-end slide-in-right">
              <div className="relative w-80 h-96">
                {/* Main Interface Panel */}
                <div className="cyberpunk-card p-6 h-full">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-tech font-bold text-lg">手花色</h3>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div className="w-3 h-3 bg-secondary rounded-full"></div>
                        <div className="w-3 h-3 bg-accent rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Character Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-japanese text-sm">元気度</span>
                        <span className="font-tech text-secondary">85.7%</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: '85.7%' }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-japanese text-sm">漢字力</span>
                        <span className="font-tech text-secondary">76%</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: '76%' }}></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-japanese text-sm">会話力</span>
                        <span className="font-tech text-secondary">92%</span>
                      </div>
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    
                    {/* Battle Preview */}
                    <div className="border border-border rounded p-3 bg-background/50">
                      <div className="flex items-start space-x-2 mb-2">
                        <div className="avatar-ai flex-shrink-0">
                          <span className="text-xs">先</span>
                        </div>
                        <div className="message-bubble-ai text-xs p-2 flex-1">
                          <span className="font-japanese">こんにちは！今日はいい天気ですね。</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2 justify-end">
                        <div className="message-bubble-user text-xs p-2 flex-1 max-w-[70%]">
                          <span className="font-japanese">はい、とてもいい天気です！</span>
                        </div>
                        <div className="avatar-user flex-shrink-0">
                          <span className="text-xs">生</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button className="w-full text-left p-2 text-sm border border-border rounded hover:border-primary transition-colors font-tech">
                        → Continue Conversation
                      </button>
                      <button className="w-full text-left p-2 text-sm border border-border rounded hover:border-secondary transition-colors font-tech">
                        → Review Vocabulary
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Floating decorations */}
                <div className="absolute -top-4 -right-4 cherry-blossom opacity-80"></div>
                <div className="absolute -bottom-2 -left-2 cherry-blossom opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 font-japanese glitch" data-text="Features">Features</h2>
            <p className="text-xl text-muted-foreground font-tech">Advanced learning technology meets traditional Japanese culture</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="cyberpunk-card p-6 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-japanese">AI Personas</h3>
              <p className="text-muted-foreground font-tech">Learn with Haruki-sensei and Aoi-chan, each with unique teaching styles</p>
            </div>
            
            <div className="cyberpunk-card p-6 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚔️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-japanese">Combat Training</h3>
              <p className="text-muted-foreground font-tech">Battle through conversation scenarios to level up your skills</p>
            </div>
            
            <div className="cyberpunk-card p-6 text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌸</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-japanese">Cultural Immersion</h3>
              <p className="text-muted-foreground font-tech">Experience authentic Japanese culture through real-world scenarios</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="cyberpunk-card p-12">
            <h2 className="text-4xl font-bold mb-6 font-japanese glitch" data-text="Ready to Begin?">Ready to Begin?</h2>
            <p className="text-xl text-muted-foreground mb-8 font-tech">
              Join thousands of learners mastering Japanese conversation skills
            </p>
            <Button 
              onClick={() => setLocation("/login")}
              size="lg"
              className="cta-button text-xl px-12 py-6 font-japanese"
            >
              戦いを始める Start Your Battle
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}