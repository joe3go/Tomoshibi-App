import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import harukiAvatar from "@assets/generation-460be619-9858-4f07-b39f-29798d89bf2b_1749531152184.png";
import aoiAvatar from "@assets/generation-18a951ed-4a6f-4df5-a163-72cf1173d83d_1749531152183.png";

export default function TutorSelection() {
  const [, setLocation] = useLocation();

  const { data: personas = [], isLoading } = useQuery({
    queryKey: ["/api/personas"],
  });

  const handleTutorSelect = (personaId: number) => {
    setLocation(`/scenario-selection/${personaId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary border-l-transparent rounded-full animate-spin"></div>
            <span className="text-foreground">Loading tutors...</span>
          </div>
        </div>
      </div>
    );
  }

  const getAvatarImage = (persona: any) => {
    if (persona.type === 'teacher') return aoiAvatar; // Aoi is the female teacher
    if (persona.type === 'friend') return harukiAvatar; // Haruki is the male friend
    return aoiAvatar; // Default fallback
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between subtle-depth">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 text-foreground hover:bg-muted tomoshibi-glow"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Choose Your Tutor</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 ma-spacing">
          <h2 className="text-2xl font-bold text-foreground mb-2">Who would you like to practice with?</h2>
          <p className="text-muted-foreground">Each tutor has a unique teaching style to match your learning preferences.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {Array.isArray(personas) && personas.map((persona: any) => (
            <Card key={persona.id} className="glass-card subtle-depth hover:scale-105 transition-all duration-300 group cursor-pointer tomoshibi-glow" onClick={() => handleTutorSelect(persona.id)}>
              <CardContent className="p-8 text-center space-y-6">
                {/* Avatar */}
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/30 group-hover:border-primary/60 transition-all duration-300 shadow-xl">
                  <img 
                    src={getAvatarImage(persona)} 
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name & Title */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">
                    {persona.type === 'teacher' ? 'Aoi (葵) - Female Teacher' : 'Haruki (陽輝) - Male Friend'}
                  </h3>
                  
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    persona.type === 'teacher' 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'bg-secondary/20 text-secondary border border-secondary/30'
                  }`}>
                    {persona.type === 'teacher' ? 'Formal Teacher' : 'Friendly Tutor'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {persona.description}
                </p>

                {/* Teaching Style */}
                <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                  <h4 className="text-sm font-semibold text-primary mb-2">Teaching Style:</h4>
                  <p className="text-sm text-muted-foreground">
                    {persona.type === 'teacher' 
                      ? 'Focuses on proper grammar, cultural context, and formal expressions. Perfect for building strong foundations.'
                      : 'Emphasizes natural conversation flow, casual expressions, and practical communication. Great for building confidence.'
                    }
                  </p>
                </div>

                {/* Select Button */}
                <Button 
                  className={`w-full tomoshibi-glow group-hover:scale-105 transition-transform duration-300 ${
                    persona.type === 'teacher' 
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'bg-secondary hover:bg-secondary/90 text-foreground border border-border'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTutorSelect(persona.id);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Learning with {persona.type === 'teacher' ? 'Aoi' : 'Haruki'}
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