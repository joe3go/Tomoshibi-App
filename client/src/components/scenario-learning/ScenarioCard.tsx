import { Badge } from "@/components/ui/badge";
import { EnhancedCard } from "../EnhancedCard";
import { EnhancedButton } from "../EnhancedButton";
import { Clock, Star, Lock, CheckCircle, PlayCircle, Target } from "lucide-react";
import { Scenario } from "../../../../shared/scenario-types";

interface ScenarioCardProps {
  scenario: Scenario;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress?: {
    attempts: number;
    bestScore?: number;
    goalsCompleted: string[];
  };
  onSelect: (scenario: Scenario) => void;
  className?: string;
}

export function ScenarioCard({ scenario, status, progress, onSelect, className = "" }: ScenarioCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'locked':
        return <Lock className="w-4 h-4 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Target className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'locked':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-white text-foreground border-border hover:border-primary/30 hover:shadow-md';
    }
  };

  const getLevelColor = () => {
    switch (scenario.level) {
      case 'N5':
        return 'bg-green-100 text-green-800';
      case 'N4':
        return 'bg-blue-100 text-blue-800';
      case 'N3':
        return 'bg-purple-100 text-purple-800';
      case 'N2':
        return 'bg-orange-100 text-orange-800';
      case 'N1':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isClickable = status !== 'locked';
  const completionPercentage = progress ? 
    Math.round((progress.goalsCompleted.length / scenario.goals.length) * 100) : 0;

  return (
    <EnhancedCard 
      className={`${getStatusColor()} transition-all duration-200 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'} ${className}`}
      onClick={() => isClickable && onSelect(scenario)}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h3 className={`font-semibold ${status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}`}>
              {scenario.title}
            </h3>
          </div>
          <Badge className={`text-xs ${getLevelColor()}`}>
            {scenario.level}
          </Badge>
        </div>

        {/* Category and Duration */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center space-x-1">
            <span>{scenario.category}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{scenario.estimatedMinutes} min</span>
          </span>
        </div>

        {/* Progress bar for in-progress scenarios */}
        {status === 'in-progress' && progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Goals preview */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium">Goals:</div>
          <div className="space-y-1">
            {scenario.goals.slice(0, 2).map((goal, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  progress?.goalsCompleted.includes(goal) 
                    ? 'bg-green-500' 
                    : status === 'locked' 
                      ? 'bg-gray-300' 
                      : 'bg-blue-300'
                }`} />
                <span className={status === 'locked' ? 'text-muted-foreground' : 'text-foreground'}>
                  {goal}
                </span>
              </div>
            ))}
            {scenario.goals.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{scenario.goals.length - 2} more goals
              </div>
            )}
          </div>
        </div>

        {/* XP Reward */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3" />
            <span>{scenario.rewards.xp} XP</span>
          </div>
          
          {/* Action button */}
          {status === 'completed' && progress?.bestScore && (
            <div className="text-xs text-green-600 font-medium">
              Best: {progress.bestScore}%
            </div>
          )}
          
          {status === 'in-progress' && (
            <div className="text-xs text-blue-600 font-medium">
              {progress?.attempts ? `Attempt ${progress.attempts}` : 'Continue'}
            </div>
          )}

          {status === 'available' && (
            <EnhancedButton 
              size="sm" 
              variant="outline"
              className="text-xs h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(scenario);
              }}
            >
              Start
            </EnhancedButton>
          )}
          
          {status === 'locked' && (
            <div className="text-xs text-muted-foreground">
              Locked
            </div>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}