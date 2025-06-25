import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, BookOpen } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  default_personas: string[];
  difficulty: string;
  topic?: string;
  participant_count?: number;
}

interface TemplateSelectorProps {
  templates: Template[];
  onSelectTemplate: (templateId: string) => void;
  isLoading?: boolean;
}

export function TemplateSelector({ templates, onSelectTemplate, isLoading }: TemplateSelectorProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTopicIcon = (templateId: string) => {
    switch (templateId) {
      case 'anime-club': return <MessageCircle className="w-4 h-4" />;
      case 'study-group': return <BookOpen className="w-4 h-4" />;
      case 'cafe-hangout': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {getTopicIcon(template.topic || template.id)}
                {template.title}
              </CardTitle>
              <Badge className={getDifficultyColor(template.difficulty)}>
                {template.difficulty}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {template.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{template.participant_count || template.default_personas.length + 1} participants</span>
              </div>
              <Button 
                onClick={() => onSelectTemplate(template.id)}
                size="sm"
                className="group-hover:bg-primary group-hover:text-primary-foreground"
              >
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}