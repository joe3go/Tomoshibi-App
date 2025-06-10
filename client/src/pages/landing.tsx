import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageCircle, BookOpen, TrendingUp, Users, Star, CheckCircle } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-deep-navy text-off-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-lantern-orange">Tomoshibi</h1>
            <span className="text-sakura-blue text-lg">灯火</span>
          </div>
          <Button
            onClick={() => setLocation("/login")}
            variant="outline"
            className="border-lantern-orange text-lantern-orange hover:bg-lantern-orange hover:text-deep-navy"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-lantern-orange rounded-full"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-sakura-blue rounded-full"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-off-white rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Floating Lantern Animation */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-24 relative animate-float">
              <div className="absolute inset-0 bg-gradient-to-b from-lantern-orange to-sakura-blue rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-16 h-20 mx-auto bg-gradient-to-b from-lantern-orange to-deep-navy rounded-lg border-2 border-lantern-orange shadow-2xl shadow-lantern-orange/30">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-off-white rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-deep-navy rounded-b-lg"></div>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Speak Japanese{" "}
              <span className="bg-gradient-to-r from-lantern-orange to-sakura-blue bg-clip-text text-transparent">
                Confidently
              </span>
            </h1>
            
            <h2 className="text-xl md:text-2xl font-medium text-gray-300 max-w-3xl mx-auto leading-relaxed">
              AI-Powered JLPT N5 Conversation Practice
            </h2>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Practice real-life Japanese with AI tutors. Get instant feedback, track progress, 
              and build confidence for the JLPT N5 exam.
            </p>

            <div className="pt-8">
              <Button
                onClick={() => setLocation("/login")}
                className="bg-gradient-to-r from-lantern-orange to-sakura-blue hover:from-lantern-orange/90 hover:to-sakura-blue/90 text-deep-navy font-semibold text-lg px-8 py-4 rounded-xl shadow-2xl shadow-lantern-orange/30 transform hover:scale-105 transition-all duration-300 hover:shadow-lantern-orange/50"
              >
                Start Learning Free
              </Button>
            </div>

            <div className="pt-4 flex justify-center items-center space-x-6 text-sm text-off-white/60">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-sakura-blue" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-lantern-orange" />
                <span>500+ learners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-gray-700 backdrop-blur-sm hover:from-gray-800/70 hover:to-gray-700/70 transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-lantern-orange to-sakura-blue rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-deep-navy" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Personalized AI Tutors</h3>
                <p className="text-gray-400 leading-relaxed">
                  Practice with AI tailored to your level. Choose between formal teacher Sensei or casual friend Yuki.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-gray-700 backdrop-blur-sm hover:from-gray-800/70 hover:to-gray-700/70 transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-sakura-blue to-lantern-orange rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-deep-navy" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">JLPT N5 Scenarios</h3>
                <p className="text-gray-400 leading-relaxed">
                  Everyday dialogues & exam prep. Practice ordering food, shopping, self-introduction and more.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 border-gray-700 backdrop-blur-sm hover:from-gray-800/70 hover:to-gray-700/70 transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-off-white to-sakura-blue rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-deep-navy" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">Real-Time Feedback</h3>
                <p className="text-gray-400 leading-relaxed">
                  Instant corrections & progress tracking. Learn from mistakes with detailed explanations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-gray-900/30 to-gray-800/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-semibold mb-8 text-white">Join hundreds of learners mastering Japanese</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-lantern-orange mb-2">500+</div>
              <div className="text-off-white/60">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-lantern-orange mb-2">10+</div>
              <div className="text-off-white/60">Conversation Scenarios</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-lantern-orange mb-2">95%</div>
              <div className="text-off-white/60">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <h3 className="text-2xl font-bold text-amber-400">Tomoshibi</h3>
            <span className="text-amber-300 text-lg">灯火</span>
          </div>
          <p className="text-gray-400 mb-6">Your First Japanese Journey</p>
          <Button
            onClick={() => setLocation("/login")}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold px-6 py-3 rounded-lg"
          >
            Get Started Today
          </Button>
        </div>
      </footer>
    </div>
  );
}

// CSS animations
const styles = `
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out;
}
`;