
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import tutorsImage from "@assets/HeroPage Tutors_1750137163692.png";
import scenariosImage from "@assets/Hero Page Real Scenarios_1750137163691.png";
import progressImage from "@assets/Progress Motivation_1750137163691.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="landing-page-container">
      {/* Navigation */}
      <Header showSignIn={true} />

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="landing-hero-grid">
            {/* Left Content */}
            <div className="landing-hero-text">
              <div className="landing-hero-content-wrapper">
                <div className="landing-hero-badge">
                  An Output Focused Platform
                </div>
                
                <h1 className="landing-hero-title">
                  Master Japanese
                  <span className="landing-hero-subtitle">会話を学ぼう</span>
                </h1>
                
                <p className="landing-hero-description">
                  Practice authentic Japanese conversations with AI-powered tutors. 
                  Build confidence through interactive scenarios designed for JLPT N5 learners.
                </p>
              </div>

              <div className="landing-hero-actions">
                <Button 
                  onClick={() => setLocation("/login")}
                  size="lg"
                  className="landing-cta-primary"
                >
                  Start Learning
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="landing-cta-secondary"
                >
                  View Demo
                </Button>
              </div>

              {/* Feature Highlights */}
              <div className="landing-feature-highlights">
                <div className="landing-feature-item">
                  <div className="landing-feature-dot landing-feature-dot-blue"></div>
                  <span className="landing-feature-text">AI-Powered Conversations</span>
                </div>
                <div className="landing-feature-item">
                  <div className="landing-feature-dot landing-feature-dot-orange"></div>
                  <span className="landing-feature-text">Real-World Scenarios</span>
                </div>
                <div className="landing-feature-item">
                  <div className="landing-feature-dot landing-feature-dot-green"></div>
                  <span className="landing-feature-text">Progress Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Content - Feature Preview */}
            <div className="landing-preview-container">
              <div className="landing-preview-wrapper">
                {/* Main Preview Card */}
                <div className="landing-preview-card">
                  <div className="landing-preview-content">
                    {/* Header */}
                    <div className="landing-preview-header">
                      <h3 className="landing-preview-title">Conversation Practice</h3>
                      <div className="landing-preview-badge">N5 Level</div>
                    </div>
                    
                    {/* Conversation Preview */}
                    <div className="landing-conversation-preview">
                      <div className="landing-message-ai">
                        <div className="landing-avatar landing-avatar-sensei">
                          <span className="landing-avatar-text">先</span>
                        </div>
                        <div className="landing-message-bubble landing-message-bubble-ai">
                          <span className="landing-message-japanese">こんにちは！今日はいい天気ですね。</span>
                          <div className="landing-message-translation">Hello! The weather is nice today.</div>
                        </div>
                      </div>
                      
                      <div className="landing-message-user">
                        <div className="landing-message-bubble landing-message-bubble-user">
                          <span className="landing-message-japanese">はい、とてもいい天気です！</span>
                        </div>
                        <div className="landing-avatar landing-avatar-student">
                          <span>You</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="landing-progress-section">
                      <div className="landing-progress-header">
                        <span>Progress</span>
                        <span>3/5 exchanges</span>
                      </div>
                      <div className="landing-progress-bar">
                        <div className="landing-progress-fill" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Stats */}
                <div className="landing-stat-card landing-stat-card-top">
                  <div className="landing-stat-content">
                    <div className="landing-stat-number">127</div>
                    <div className="landing-stat-label">Words Learned</div>
                  </div>
                </div>
                
                <div className="landing-stat-card landing-stat-card-bottom">
                  <div className="landing-stat-content">
                    <div className="landing-stat-number landing-stat-number-orange">15</div>
                    <div className="landing-stat-label">Scenarios</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features-section">
        <div className="landing-features-container">
          <div className="landing-features-header">
            <h2 className="landing-features-title">Why Choose Tomoshibi?</h2>
            <p className="landing-features-subtitle">Effective Japanese learning through interactive conversations</p>
          </div>
          
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-image-container">
                <img 
                  src={tutorsImage} 
                  alt="AI Tutors - Learn with personalized Japanese tutors" 
                  className="landing-feature-image"
                />
              </div>
              <h3 className="landing-feature-title">AI Tutors</h3>
              <p className="landing-feature-description">Learn with Haruki-sensei and Aoi-chan, each offering unique teaching approaches tailored to your learning style.</p>
            </div>
            
            <div className="landing-feature-card">
              <div className="landing-feature-image-container">
                <img 
                  src={scenariosImage} 
                  alt="Real Life Scenarios - Practice Japanese in authentic situations" 
                  className="landing-feature-image"
                />
              </div>
              <h3 className="landing-feature-title">Real Scenarios</h3>
              <p className="landing-feature-description">Practice conversations for everyday situations like shopping, dining, and social interactions.</p>
            </div>
            
            <div className="landing-feature-card">
              <div className="landing-feature-image-container">
                <img 
                  src={progressImage} 
                  alt="Track Progress - Monitor your Japanese learning journey" 
                  className="landing-feature-image"
                />
              </div>
              <h3 className="landing-feature-title">Track Progress</h3>
              <p className="landing-feature-description">Monitor your vocabulary growth, conversation skills, and JLPT N5 preparation progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="landing-stats-section">
        <div className="landing-stats-container">
          <div className="landing-stats-grid">
            <div>
              <div className="landing-stat-value">100+</div>
              <div className="landing-stat-description">Active Learners</div>
            </div>
            <div>
              <div className="landing-stat-value">15+</div>
              <div className="landing-stat-description">Scenarios</div>
            </div>
            <div>
              <div className="landing-stat-value">800+</div>
              <div className="landing-stat-description">JLPT Vocabulary</div>
            </div>
            <div>
              <div className="landing-stat-value">90%</div>
              <div className="landing-stat-description">Student Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-cta-container">
          <h2 className="landing-cta-title">Ready to Start Your Japanese Journey?</h2>
          <p className="landing-cta-description">
            Join thousands of learners building confidence in Japanese conversation
          </p>
          <Button 
            onClick={() => setLocation("/login")}
            size="lg"
            className="landing-cta-button"
          >
            Start Learning Today
          </Button>
        </div>
      </section>
    </div>
  );
}
