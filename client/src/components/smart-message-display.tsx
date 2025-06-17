import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import EnhancedFuriganaText from "@/components/enhanced-furigana-text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SmartMessageDisplayProps {
  content: string;
  englishTranslation?: string;
  feedback?: string;
  suggestions?: string[];
  sender: 'user' | 'ai';
  showFurigana: boolean;
  isAiResponse?: boolean;
}

export default function SmartMessageDisplay({
  content,
  englishTranslation,
  feedback,
  suggestions = [],
  sender,
  showFurigana,
  isAiResponse = false
}: SmartMessageDisplayProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check if this appears to be a mixed English/Japanese response (smart AI response to English question)
  const isMixedResponse = content.includes("Now let's practice this in Japanese:") || 
                         content.includes("Let's try using that in Japanese!");

  return (
    <div className="space-y-2">
      {/* Main message content */}
      <div className="chat-message-content">
        <EnhancedFuriganaText
          text={content}
          showFurigana={showFurigana}
          showToggleButton={false}
          enableWordHover={sender === 'ai'}
          className="text-inherit"
        />
      </div>

      {/* Feedback section */}
      {feedback && (
        <div className="chat-message-feedback">
          <p className="chat-feedback-text">✨ {feedback}</p>
        </div>
      )}

      {/* English translation toggle for AI messages */}
      {isAiResponse && englishTranslation && (
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showTranslation ? (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Hide English
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Show English
              </>
            )}
          </Button>
        </div>
      )}

      {/* English translation content */}
      {showTranslation && englishTranslation && (
        <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <HelpCircle className="w-3 h-3" />
            <span className="font-medium">English Translation:</span>
          </div>
          <p>{englishTranslation}</p>
        </div>
      )}

      {/* Learning suggestions */}
      {suggestions.length > 0 && (
        <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              💡 {showSuggestions ? 'Hide' : 'Show'} Learning Tips ({suggestions.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm">
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span className="text-blue-800 dark:text-blue-200">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Special indicator for mixed English/Japanese responses */}
      {isMixedResponse && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Smart response: English explanation + Japanese practice</span>
        </div>
      )}
    </div>
  );
}