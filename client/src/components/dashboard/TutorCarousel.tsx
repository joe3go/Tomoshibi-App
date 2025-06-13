
import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap } from 'lucide-react';
import type { TutorCarouselProps } from '@/types/dashboard';

const TutorCarousel = memo<TutorCarouselProps>(({ 
  personas, 
  onSelectTutor, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <Card className="content-card">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex-1 h-32 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPersonaIcon = (type: string) => {
    return type === 'teacher' ? GraduationCap : Users;
  };

  const getPersonaEmoji = (type: string) => {
    return type === 'teacher' ? '👩‍🏫' : '🧑‍🎤';
  };

  const getJlptColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-700 border-green-200';
      case 'N4': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'N3': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'N2': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'N1': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="content-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Choose Your Tutor 先生を選んでください
          </h3>
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => {
            const Icon = getPersonaIcon(persona.type);
            
            return (
              <div 
                key={persona.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => onSelectTutor(persona.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-lg">
                      {getPersonaEmoji(persona.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {persona.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {persona.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getJlptColor(persona.jlptLevel)}`}>
                    {persona.jlptLevel}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {persona.description || `Perfect for ${persona.jlptLevel} level Japanese learning`}
                </p>
                
                <Button 
                  size="sm" 
                  className="w-full btn-japanese group-hover:shadow-md transition-shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTutor(persona.id);
                  }}
                >
                  Start Conversation 会話を始める
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

TutorCarousel.displayName = 'TutorCarousel';

export default TutorCarousel;
