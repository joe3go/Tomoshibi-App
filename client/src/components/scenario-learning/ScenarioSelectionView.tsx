import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedCard } from "../EnhancedCard";
import { EnhancedButton } from "../EnhancedButton";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioProgressManager } from "../../lib/scenario-learning/progress-manager";
import { scenarios } from "../../data/scenarios";
import { Scenario, UserLearningProgress, UserScenarioProgress } from "../../../../shared/scenario-types";
import { Search, Filter, Star, Trophy, Target, BookOpen, Clock } from "lucide-react";

interface ScenarioSelectionViewProps {
  userId: string;
  onScenarioSelect: (scenario: Scenario) => void;
  className?: string;
}

export function ScenarioSelectionView({ userId, onScenarioSelect, className = "" }: ScenarioSelectionViewProps) {
  const [progressManager] = useState(() => new ScenarioProgressManager(userId));
  const [learningProgress, setLearningProgress] = useState<UserLearningProgress | null>(null);
  const [scenarioProgresses, setScenarioProgresses] = useState<UserScenarioProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = () => {
    const progress = progressManager.getLearningProgress();
    const allScenarioProgress = progressManager.getAllScenarioProgress();
    setLearningProgress(progress);
    setScenarioProgresses(allScenarioProgress);
  };

  const getScenarioStatus = (scenarioId: string): 'locked' | 'available' | 'in-progress' | 'completed' => {
    if (!learningProgress) return 'locked';
    
    if (learningProgress.completedScenarios.includes(scenarioId)) {
      return 'completed';
    }
    
    const scenarioProgress = scenarioProgresses.find(p => p.scenarioId === scenarioId);
    if (scenarioProgress?.status === 'in-progress') {
      return 'in-progress';
    }
    
    if (learningProgress.unlockedScenarios.includes(scenarioId)) {
      return 'available';
    }
    
    return 'locked';
  };

  const getScenarioProgress = (scenarioId: string) => {
    return scenarioProgresses.find(p => p.scenarioId === scenarioId);
  };

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      // Search filter
      if (searchTerm && !scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !scenario.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !scenario.goals.some(goal => goal.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }

      // Level filter
      if (levelFilter !== "all" && scenario.level !== levelFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const status = getScenarioStatus(scenario.id);
        if (status !== statusFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && scenario.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [scenarios, searchTerm, levelFilter, statusFilter, categoryFilter, learningProgress, scenarioProgresses]);

  const categories = useMemo(() => {
    const cats = scenarios.map(s => s.category);
    return Array.from(new Set(cats)).sort();
  }, []);

  const stats = useMemo(() => {
    if (!learningProgress) return { completed: 0, available: 0, locked: 0, inProgress: 0 };
    
    return scenarios.reduce((acc, scenario) => {
      const status = getScenarioStatus(scenario.id);
      acc[status === 'in-progress' ? 'inProgress' : status]++;
      return acc;
    }, { completed: 0, available: 0, locked: 0, inProgress: 0 });
  }, [learningProgress, scenarioProgresses]);

  const handleScenarioSelect = (scenario: Scenario) => {
    const status = getScenarioStatus(scenario.id);
    if (status === 'locked') return;
    
    onScenarioSelect(scenario);
  };

  if (!learningProgress) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your learning progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Overview */}
      <EnhancedCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Learning Journey</h2>
            <p className="text-muted-foreground">Level {learningProgress.level} • {learningProgress.totalXp} XP</p>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium">{learningProgress.badges.length} badges</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-blue-700">In Progress</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
            <div className="text-sm text-orange-700">Available</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.locked}</div>
            <div className="text-sm text-gray-700">Locked</div>
          </div>
        </div>
      </EnhancedCard>

      {/* Filters */}
      <EnhancedCard className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scenarios, goals, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="N5">N5</SelectItem>
                  <SelectItem value="N4">N4</SelectItem>
                  <SelectItem value="N3">N3</SelectItem>
                  <SelectItem value="N2">N2</SelectItem>
                  <SelectItem value="N1">N1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("");
                  setLevelFilter("all");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </EnhancedCard>

      {/* Scenarios Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Scenarios ({filteredScenarios.length})
          </h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredScenarios.length} of {scenarios.length}</span>
          </div>
        </div>
        
        {filteredScenarios.length === 0 ? (
          <EnhancedCard className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No scenarios found</h4>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms to find scenarios.
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setLevelFilter("all");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear all filters
            </Button>
          </EnhancedCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                status={getScenarioStatus(scenario.id)}
                progress={getScenarioProgress(scenario.id)}
                onSelect={handleScenarioSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}