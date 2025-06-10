import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import harukiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";
import aoiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";

export default function TutorSelection() {
  const [, setLocation] = useLocation();

  const { data: personas, isLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  const handleTutorSelect = (personaId: number) => {
    setLocation(`/scenario-selection/${personaId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-navy">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-lantern-orange border-l-transparent rounded-full animate-spin"></div>
            <span className="text-off-white">Loading tutors...</span>
          </div>
        </div>
      </div>
    );
  }

  const getAvatarImage = (persona: any) => {
    if (persona.type === 'teacher') return harukiAvatar;
    if (persona.type === 'friend') return aoiAvatar;
    return null;
  };

  return (
    <div className="min-h-screen bg-deep-navy p-4">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 text-off-white hover:bg-kanji-glow"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-off-white">Choose Your Tutor</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-off-white mb-2">Who would you like to practice with?</h2>
          <p className="text-off-white/70">Each tutor has a unique teaching style to match your learning preferences.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {personas?.map((persona: any) => (
            <Card key={persona.id} className="glass-card border-glass-border hover:border-lantern-orange/30 transition-all duration-300 group cursor-pointer" onClick={() => handleTutorSelect(persona.id)}>
              <CardContent className="p-8 text-center">
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-lantern-orange/20 group-hover:border-lantern-orange/50 transition-all duration-300">
                  <img 
                    src={getAvatarImage(persona)} 
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Title */}
                <h3 className="text-2xl font-bold text-off-white mb-2">
                  {persona.name} {persona.type === 'teacher' ? '(陽輝)' : '(葵)'}
                </h3>
                
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    persona.type === 'teacher' 
                      ? 'bg-lantern-orange/20 text-lantern-orange' 
                      : 'bg-sakura-blue/20 text-sakura-blue'
                  }`}>
                    {persona.type === 'teacher' ? 'Formal Teacher' : 'Friendly Tutor'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-off-white/70 mb-6 leading-relaxed">
                  {persona.description}
                </p>

                {/* Teaching Style */}
                <div className="bg-deep-navy/50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-lantern-orange mb-2">Teaching Style:</h4>
                  <p className="text-sm text-off-white/80">
                    {persona.type === 'teacher' 
                      ? 'Focuses on proper grammar, cultural context, and formal expressions. Perfect for building strong foundations.'
                      : 'Emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence.'
                    }
                  </p>
                </div>

                {/* Select Button */}
                <Button 
                  className={`w-full gradient-button group-hover:scale-105 transition-transform duration-300 ${
                    persona.type === 'teacher' 
                      ? 'bg-gradient-to-r from-lantern-orange to-lantern-orange/80' 
                      : 'bg-gradient-to-r from-sakura-blue to-sakura-blue/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTutorSelect(persona.id);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Learning with {persona.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free Chat Option */}
        <Card className="glass-card border-glass-border hover:border-off-white/30 transition-all duration-300 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-off-white mb-2">Free Chat Mode</h3>
            <p className="text-off-white/70 mb-4">
              Practice open-ended conversations without specific scenarios. Great for exploring topics that interest you.
            </p>
            <Button 
              variant="outline" 
              className="border-off-white/30 text-off-white hover:bg-off-white/10"
              onClick={() => setLocation('/free-chat')}
            >
              Start Free Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}