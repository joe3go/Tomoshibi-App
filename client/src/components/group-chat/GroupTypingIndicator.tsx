import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GroupTypingIndicatorProps {
  personas: string[];
}

export function GroupTypingIndicator({ personas }: GroupTypingIndicatorProps) {
  if (personas.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
      <div className="flex -space-x-2">
        {personas.map(persona => (
          <Avatar key={persona} className="w-6 h-6 border-2 border-background">
            <AvatarImage src={`/avatars/${persona.toLowerCase()}.png`} />
            <AvatarFallback className="text-xs">{persona[0]}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">
          {personas.length === 1 ? `${personas[0]} is` : `${personas.length} people are`} typing
        </span>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}