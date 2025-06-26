import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Toggle } from "@/components/ui/toggle";
import { EnhancedCard } from "../EnhancedCard";
import { EnhancedButton } from "../EnhancedButton";
import FuriganaText from "../FuriganaText";
import { MessageWithVocab } from "../MessageWithVocab";
import { ScenarioProgressManager } from "../../lib/scenario-learning/progress-manager";
import { Scenario, ScenarioPracticeSession, GoalCompletion } from "../../../../shared/scenario-types";
import { 
  Target, 
  Send, 
  CheckCircle, 
  Circle, 
  Star, 
  BookOpen, 
  MessageSquare,
  Lightbulb,
  Trophy,
  ArrowRight,
  Languages
} from "lucide-react";
import { bind, unbind } from 'wanakana';

interface ScenarioPracticeViewProps {
  scenario: Scenario;
  personaId: number;
  personaName: string;
  userId: string;
  onComplete: (sessionId: string, feedback: any) => void;
  onExit: () => void;
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  vocabHighlights?: string[];
  grammarNotes?: string[];
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

export function ScenarioPracticeView({ 
  scenario, 
  personaId, 
  personaName, 
  userId, 
  onComplete, 
  onExit, 
  className = "" 
}: ScenarioPracticeViewProps) {
  const [progressManager] = useState<ScenarioProgressManager | null>(() => {
    try {
      return new ScenarioProgressManager(userId);
    } catch (error) {
      console.error('Failed to create progress manager:', error);
      return null;
    }
  });
  const [session, setSession] = useState<ScenarioPracticeSession | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [goalCompletions, setGoalCompletions] = useState<GoalCompletion[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [romajiMode, setRomajiMode] = useState(false);
  const [showFurigana, setShowFurigana] = useState(() => {
    const saved = localStorage.getItem("furigana-visible");
    return saved !== null ? saved === "true" : true;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initializeSession();
  }, [scenario.id, personaId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to handle Wanakana binding
  useEffect(() => {
    const element = textareaRef.current;
    if (romajiMode && element) {
      bind(element, { IMEMode: 'toHiragana' });
      console.log('Wanakana bound to scenario textarea');
    }
    
    return () => {
      if (element) {
        try {
          unbind(element);
        } catch (e) {
          console.log('Unbind cleanup completed');
        }
      }
    };
  }, [romajiMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeSession = () => {
    if (!progressManager) {
      console.error('Progress manager not available');
      return;
    }
    
    try {
      const newSession = progressManager.createPracticeSession(scenario.id, personaId);
      setSession(newSession);
    } catch (error) {
      console.error('Failed to create practice session:', error);
      return;
    }
    
    // Initialize goal completions
    const initialGoals: GoalCompletion[] = scenario.goals.map(goal => ({
      goalText: goal,
      completed: false,
      evidence: []
    }));
    setGoalCompletions(initialGoals);

    // Add initial system message with scenario prompt
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      role: 'system',
      content: `Welcome to "${scenario.title}"! ${scenario.prompt}`,
      timestamp: new Date().toISOString()
    };

    // Add initial AI greeting
    const greeting = getPersonaGreeting();
    const aiMessage: Message = {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString()
    };

    setMessages([systemMessage, aiMessage]);
  };

  const getPersonaGreeting = (): string => {
    const greetings = {
      teacher: [
        "こんにちは！今日は一緒に日本語を練習しましょう。頑張ってください！",
        "いらっしゃいませ！このシナリオで日本語を使って会話してみましょう。",
        "こんにちは！今日のレッスンを始めましょう。自然に話してくださいね。"
      ],
      friend: [
        "やあ！今日はどうですか？一緒に日本語で話しましょう！",
        "こんにちは！楽しく日本語を練習しましょうね。",
        "お疲れさま！リラックスして日本語で話してみてください。"
      ]
    };

    const personaType = personaId === 1 ? 'teacher' : 'friend';
    const options = greetings[personaType];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleSubmitMessage = async () => {
    if (!currentMessage.trim() || !session || isSubmitting) return;

    setIsSubmitting(true);

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");

    try {
      // Simulate AI response processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate AI response with feedback
      const aiResponse = await generateAIResponse(currentMessage);
      
      // Add AI message
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        vocabHighlights: aiResponse.vocabUsed,
        grammarNotes: aiResponse.grammarNotes,
        corrections: aiResponse.corrections
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check goal completions
      checkGoalCompletions(currentMessage, aiResponse);

      // Update session
      if (session && progressManager) {
        try {
          progressManager.updatePracticeSession(session.id, {
            messages: [...messages, userMessage, aiMessage],
            score: sessionScore + aiResponse.scoreGain
          });
        } catch (updateError) {
          console.error('Failed to update session:', updateError);
        }
      }

      setSessionScore(prev => prev + (aiResponse.scoreGain || 0));

    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Add fallback response
      const fallbackMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: "すみません、もう一度言ってください。(Sorry, please say that again.)",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIResponse = async (userInput: string) => {
    // This would integrate with your existing OpenAI API
    // For now, return structured response based on scenario
    const responses = {
      "self-introduction": [
        "はじめまして！お名前は何ですか？",
        "よろしくお願いします。ご出身はどちらですか？",
        "素晴らしいですね！日本語がお上手ですね。"
      ],
      "cafe-ordering": [
        "いらっしゃいませ！何にいたしますか？",
        "コーヒーですね。サイズはいかがですか？",
        "ありがとうございます。少々お待ちください。"
      ],
      "asking-directions": [
        "はい、駅ですね。まっすぐ行って、二つ目の角を右に曲がってください。",
        "そうですね、徒歩で10分くらいです。",
        "どういたしまして。気をつけて行ってくださいね。"
      ]
    };

    const scenarioResponses = responses[scenario.id as keyof typeof responses] || [
      "そうですね。",
      "いいですね！",
      "頑張ってください！"
    ];

    const randomResponse = scenarioResponses[Math.floor(Math.random() * scenarioResponses.length)];

    // Detect vocabulary usage
    const vocabUsed = scenario.targetVocab.filter(vocab => 
      userInput.includes(vocab)
    );

    return {
      content: randomResponse,
      vocabUsed,
      grammarNotes: vocabUsed.length > 0 ? ["Good use of target vocabulary!"] : [],
      corrections: [],
      scoreGain: vocabUsed.length * 10
    };
  };

  const checkGoalCompletions = (userInput: string, aiResponse: any) => {
    setGoalCompletions(prev => prev.map(goal => {
      if (goal.completed) return goal;

      let isCompleted = false;
      const evidence = [...goal.evidence];

      // Check for specific goal patterns
      if (goal.goalText.includes("はじめまして") && userInput.includes("はじめまして")) {
        isCompleted = true;
        evidence.push("Used はじめまして in message");
      }
      
      if (goal.goalText.includes("ください") && userInput.includes("ください")) {
        isCompleted = true;
        evidence.push("Used ください correctly");
      }

      if (goal.goalText.includes("name") && userInput.includes("です")) {
        isCompleted = true;
        evidence.push("Stated name with です");
      }

      if (isCompleted && session && progressManager) {
        try {
          progressManager.completeGoal(session.id, goal.goalText);
        } catch (error) {
          console.error('Failed to complete goal:', error);
        }
      }

      return {
        ...goal,
        completed: isCompleted,
        evidence,
        completedAt: isCompleted ? new Date().toISOString() : goal.completedAt
      };
    }));
  };

  const getCompletionPercentage = () => {
    const completedGoals = goalCompletions.filter(g => g.completed).length;
    return Math.round((completedGoals / goalCompletions.length) * 100);
  };

  const handleCompleteSession = () => {
    if (!session) return;

    const feedback = {
      overallScore: sessionScore,
      goalCompletions,
      completedGoals: goalCompletions.filter(g => g.completed).length,
      totalGoals: goalCompletions.length,
      vocabUsage: scenario.targetVocab.filter(vocab =>
        messages.some(m => m.role === 'user' && m.content.includes(vocab))
      )
    };

    // Complete scenario if all goals achieved
    if (getCompletionPercentage() >= 80 && progressManager) {
      try {
        progressManager.completeScenario(scenario.id);
      } catch (error) {
        console.error('Failed to complete scenario:', error);
      }
    }

    onComplete(session.id, feedback);
  };

  const handleFuriganaToggle = () => {
    const newState = !showFurigana;
    console.log('Scenario Furigana toggle:', showFurigana, '->', newState);
    setShowFurigana(newState);
    localStorage.setItem("furigana-visible", newState.toString());
  };

  if (!progressManager) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to initialize scenario learning system.</p>
          <Button onClick={onExit}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Starting your scenario practice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full max-h-[600px] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{scenario.title}</h2>
            <p className="text-sm text-muted-foreground">Practicing with {personaName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {scenario.level}
            </Badge>
            <div className="text-sm font-medium text-primary">
              {sessionScore} XP
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{getCompletionPercentage()}%</span>
          </div>
          <Progress value={getCompletionPercentage()} className="h-2" />
        </div>
      </div>

      {/* Goals Panel */}
      <div className="flex-shrink-0 p-3 bg-muted/30 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground flex items-center space-x-1">
            <Target className="w-4 h-4" />
            <span>Goals ({goalCompletions.filter(g => g.completed).length}/{goalCompletions.length})</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {goalCompletions.map((goal, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              {goal.completed ? (
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className={goal.completed ? 'text-green-700' : 'text-foreground'}>
                {goal.goalText}
              </span>
            </div>
          ))}
        </div>

        {showHints && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
            <div className="font-medium text-blue-700 mb-1">Hint:</div>
            <p className="text-blue-600">
              Try using these words: {scenario.targetVocab.slice(0, 3).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : message.role === 'system'
                  ? 'bg-muted text-muted-foreground text-center'
                  : 'bg-card border border-border'
            }`}>
              <div className="text-sm">
                <MessageWithVocab
                  content={message.content}
                  className="vocab-enabled-scenario-message"
                >
                  <FuriganaText
                    text={message.content}
                    showFurigana={showFurigana}
                    showToggleButton={false}
                  />
                </MessageWithVocab>
              </div>
              
              {message.vocabHighlights && message.vocabHighlights.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.vocabHighlights.map((vocab, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {vocab}
                    </Badge>
                  ))}
                </div>
              )}
              
              {message.grammarNotes && message.grammarNotes.length > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  {message.grammarNotes[0]}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMessage();
              }
            }}
            placeholder="Type your response in Japanese..."
            disabled={isSubmitting}
            className="flex-1 p-3 border border-border rounded-md resize-none"
            rows={1}
            style={{ maxHeight: "120px" }}
          />
          <EnhancedButton
            onClick={handleSubmitMessage}
            disabled={!currentMessage.trim() || isSubmitting}
          >
            <Send className="w-4 h-4" />
          </EnhancedButton>
        </div>
        
        {/* Input Controls */}
        <div className="mt-2 flex items-center gap-4">
          <Toggle
            pressed={romajiMode}
            onPressedChange={setRomajiMode}
            size="sm"
            className="text-xs"
          >
            <Languages className="w-3 h-3 mr-1" />
            Hiragana
          </Toggle>
          <button
            onClick={handleFuriganaToggle}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showFurigana ? "Hide Furigana" : "Show Furigana"}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" onClick={onExit}>
            Exit Practice
          </Button>
          
          {getCompletionPercentage() >= 50 && (
            <EnhancedButton
              onClick={handleCompleteSession}
              className="flex items-center space-x-1"
            >
              <Trophy className="w-4 h-4" />
              <span>Complete Session</span>
            </EnhancedButton>
          )}
        </div>
      </div>
    </div>
  );
}