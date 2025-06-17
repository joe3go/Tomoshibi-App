import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnhancedCard } from "../EnhancedCard";
import { EnhancedButton } from "../EnhancedButton";
import { ScenarioProgressManager } from "../../lib/scenario-learning/progress-manager";
import { scenarios, getNextRecommendedScenario } from "../../data/scenarios";
import { UserLearningProgress } from "../../../../shared/scenario-types";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { 
  Target, 
  Star, 
  Trophy, 
  BookOpen, 
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Lock,
  Database,
  User
} from "lucide-react";

interface ScenarioProgressWidgetProps {
  userId: string;
  onNavigateToScenarios: () => void;
  className?: string;
}

export function ScenarioProgressWidget({ userId, onNavigateToScenarios, className = "" }: ScenarioProgressWidgetProps) {
  const [progressManager] = useState(() => new ScenarioProgressManager(userId));
  const [learningProgress, setLearningProgress] = useState<UserLearningProgress | null>(null);
  const { isAuthenticated } = useSupabaseAuth();
  const { progress: supabaseProgress, getCompletedScenarios, getTotalXP, isLoading } = useUserProgress();

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = () => {
    try {
      const progress = progressManager.getLearningProgress();
      setLearningProgress(progress);
    } catch (error) {
      console.error('Failed to load scenario progress:', error);
    }
  };

  const getStats = () => {
    // Use Supabase data if authenticated, otherwise fall back to localStorage
    if (isAuthenticated && supabaseProgress.length > 0) {
      const completedScenarios = getCompletedScenarios();
      return scenarios.reduce((acc, scenario) => {
        if (completedScenarios.some(p => p.scenario_id === scenario.id)) {
          acc.completed++;
        } else {
          acc.available++;
        }
        return acc;
      }, { completed: 0, available: scenarios.length - completedScenarios.length, locked: 0, inProgress: 0 });
    }
    
    if (!learningProgress) return { completed: 0, available: 0, locked: 0, inProgress: 0 };
    
    return scenarios.reduce((acc, scenario) => {
      if (learningProgress.completedScenarios.includes(scenario.id)) {
        acc.completed++;
      } else if (learningProgress.unlockedScenarios.includes(scenario.id)) {
        acc.available++;
      } else {
        acc.locked++;
      }
      return acc;
    }, { completed: 0, available: 0, locked: 0, inProgress: 0 });
  };

  const getNextScenario = () => {
    if (!learningProgress) return null;
    
    return getNextRecommendedScenario(
      learningProgress.completedScenarios,
      learningProgress.totalXp,
      Object.keys(learningProgress.vocabMastery).length
    );
  };

  const getProgressPercentage = () => {
    if (!learningProgress) return 0;
    return Math.round((learningProgress.completedScenarios.length / scenarios.length) * 100);
  };

  if (isLoading) {
    return (
      <EnhancedCard className={`p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading scenario progress...</span>
        </div>
      </EnhancedCard>
    );
  }

  if (!learningProgress) {
    return (
      <EnhancedCard className={`p-6 text-center ${className}`}>
        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-2">Start Scenario Learning</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Practice Japanese through real-world scenarios and track your progress.
        </p>
        <EnhancedButton onClick={onNavigateToScenarios} className="w-full">
          Explore Scenarios
        </EnhancedButton>
      </EnhancedCard>
    );
  }

  const stats = getStats();
  const nextScenario = getNextScenario();
  const progressPercentage = getProgressPercentage();

  return (
    <EnhancedCard className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Scenario Learning</h3>
            {isAuthenticated ? (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Database className="w-3 h-3" />
                Synced
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <User className="w-3 h-3" />
                Local
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">
              {isAuthenticated && supabaseProgress.length > 0 ? getTotalXP() : learningProgress.totalXp} XP
            </span>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {stats.completed} of {scenarios.length} scenarios completed
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-700">Completed</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">{stats.available}</div>
            <div className="text-xs text-blue-700">Available</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-600">{stats.locked}</div>
            <div className="text-xs text-gray-700">Locked</div>
          </div>
        </div>

        {/* Level and Badges */}
        <div className="flex items-center justify-between py-2 border-t border-border">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">Level {learningProgress.level}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {learningProgress.badges.length} badges earned
          </div>
        </div>

        {/* Next Scenario Recommendation */}
        {nextScenario ? (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-700">Recommended Next</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {nextScenario.level}
              </Badge>
            </div>
            <h4 className="font-medium text-blue-900 text-sm mb-1">
              {nextScenario.title}
            </h4>
            <p className="text-xs text-blue-700 mb-2">
              {nextScenario.category} • {nextScenario.estimatedMinutes} min
            </p>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-blue-700">{nextScenario.rewards.xp} XP</span>
            </div>
          </div>
        ) : stats.available === 0 && stats.completed < scenarios.length ? (
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <Lock className="w-4 h-4 text-orange-600 mx-auto mb-1" />
            <p className="text-xs text-orange-700">
              Complete more scenarios to unlock new challenges
            </p>
          </div>
        ) : (
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-green-700">
              Congratulations! All scenarios completed
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <EnhancedButton 
            onClick={onNavigateToScenarios}
            className="flex-1 flex items-center justify-center space-x-1"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Scenarios</span>
          </EnhancedButton>
          
          {nextScenario && (
            <EnhancedButton 
              variant="outline"
              onClick={onNavigateToScenarios}
              className="flex items-center space-x-1"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start</span>
            </EnhancedButton>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}