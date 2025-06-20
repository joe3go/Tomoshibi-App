
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';

interface TutorCardProps {
  id: number;
  name: string;
  type: 'tutor' | 'native' | 'teacher' | 'friend';
  avatar_url: string | null;
  description: string;
  jlpt_level?: string;
  onSelect?: (id: number) => void;
  onChat?: (id: number) => void;
}

export default function TutorCard({
  id,
  name,
  type,
  avatar_url,
  description,
  jlpt_level = 'N5',
  onSelect,
  onChat
}: TutorCardProps) {
  return (
    <Card className="tutor-card cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>
        
        <CardTitle className="text-lg">{name}</CardTitle>
        
        <div className="flex gap-2 justify-center">
          <Badge variant="secondary">
            {type === 'teacher' ? 'Teacher' : type === 'friend' ? 'Friend' : type}
          </Badge>
          <Badge variant="outline">{jlpt_level}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>
        
        <div className="flex gap-2">
          {onSelect && (
            <Button
              onClick={() => onSelect(id)}
              className="flex-1"
              size="sm"
            >
              Select Tutor
            </Button>
          )}
          
          {onChat && (
            <Button
              onClick={() => onChat(id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
