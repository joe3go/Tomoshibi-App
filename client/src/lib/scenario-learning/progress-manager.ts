import { UserLearningProgress, UserScenarioProgress, ScenarioPracticeSession } from "../../../../shared/scenario-types";
import { scenarios, getAvailableScenarios } from "../../data/scenarios";

const STORAGE_KEYS = {
  LEARNING_PROGRESS: 'tomoshibi_learning_progress',
  SCENARIO_PROGRESS: 'tomoshibi_scenario_progress',
  PRACTICE_SESSIONS: 'tomoshibi_practice_sessions',
} as const;

export class ScenarioProgressManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Learning Progress Management
  getLearningProgress(): UserLearningProgress {
    const stored = localStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS);
    if (stored) {
      try {
        const progress = JSON.parse(stored);
        if (progress.userId === this.userId) {
          return progress;
        }
      } catch (error) {
        console.warn('Failed to parse learning progress:', error);
      }
    }

    // Return default progress for new user
    return this.createDefaultLearningProgress();
  }

  updateLearningProgress(updates: Partial<UserLearningProgress>): UserLearningProgress {
    const current = this.getLearningProgress();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.LEARNING_PROGRESS, JSON.stringify(updated));
    return updated;
  }

  private createDefaultLearningProgress(): UserLearningProgress {
    return {
      userId: this.userId,
      totalXp: 0,
      level: 1,
      xpToNextLevel: 1000,
      completedScenarios: [],
      unlockedScenarios: ["self-introduction", "cafe-ordering", "weather-small-talk", "shopping-convenience-store"],
      vocabMastery: {},
      badges: [],
      streaks: {
        current: 0,
        longest: 0,
        lastStudyDate: new Date().toISOString().split('T')[0]
      },
      preferences: {
        preferredPersonaType: 'teacher',
        difficultyPreference: 'medium',
        reminderFrequency: 'daily'
      }
    };
  }

  // Scenario Progress Management
  getScenarioProgress(scenarioId: string): UserScenarioProgress | null {
    const allProgress = this.getAllScenarioProgress();
    return allProgress.find(p => p.scenarioId === scenarioId) || null;
  }

  getAllScenarioProgress(): UserScenarioProgress[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SCENARIO_PROGRESS);
    if (stored) {
      try {
        const allProgress = JSON.parse(stored);
        return allProgress.filter((p: UserScenarioProgress) => p.userId === this.userId);
      } catch (error) {
        console.warn('Failed to parse scenario progress:', error);
      }
    }
    return [];
  }

  updateScenarioProgress(scenarioId: string, updates: Partial<UserScenarioProgress>): UserScenarioProgress {
    const allProgress = this.getAllScenarioProgress();
    const existingIndex = allProgress.findIndex(p => p.scenarioId === scenarioId);
    
    const updated: UserScenarioProgress = {
      userId: this.userId,
      scenarioId,
      status: 'available',
      attempts: 0,
      goalsCompleted: [],
      vocabUsed: {},
      lastAttemptAt: new Date().toISOString(),
      ...updates
    };

    if (existingIndex >= 0) {
      allProgress[existingIndex] = { ...allProgress[existingIndex], ...updated };
    } else {
      allProgress.push(updated);
    }

    // Add progress from other users back
    const stored = localStorage.getItem(STORAGE_KEYS.SCENARIO_PROGRESS);
    let otherUsersProgress: UserScenarioProgress[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        otherUsersProgress = parsed.filter((p: UserScenarioProgress) => p.userId !== this.userId);
      } catch (error) {
        console.warn('Failed to parse other users progress:', error);
      }
    }

    const allUserProgress = [...otherUsersProgress, ...allProgress];
    localStorage.setItem(STORAGE_KEYS.SCENARIO_PROGRESS, JSON.stringify(allUserProgress));
    
    return allProgress.find(p => p.scenarioId === scenarioId)!;
  }

  // Practice Session Management
  createPracticeSession(scenarioId: string, personaId: number): ScenarioPracticeSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ScenarioPracticeSession = {
      id: sessionId,
      userId: this.userId,
      scenarioId,
      personaId,
      status: 'active',
      messages: [],
      currentGoals: scenarios.find(s => s.id === scenarioId)?.goals || [],
      completedGoals: [],
      vocabUsedThisSession: {},
      score: 0,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };

    this.savePracticeSession(session);
    return session;
  }

  getPracticeSession(sessionId: string): ScenarioPracticeSession | null {
    const sessions = this.getAllPracticeSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  getAllPracticeSessions(): ScenarioPracticeSession[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PRACTICE_SESSIONS);
    if (stored) {
      try {
        const allSessions = JSON.parse(stored);
        return allSessions.filter((s: ScenarioPracticeSession) => s.userId === this.userId);
      } catch (error) {
        console.warn('Failed to parse practice sessions:', error);
      }
    }
    return [];
  }

  updatePracticeSession(sessionId: string, updates: Partial<ScenarioPracticeSession>): ScenarioPracticeSession | null {
    const sessions = this.getAllPracticeSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      return null;
    }

    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates,
      lastActivityAt: new Date().toISOString()
    };

    this.savePracticeSession(sessions[sessionIndex]);
    return sessions[sessionIndex];
  }

  private savePracticeSession(session: ScenarioPracticeSession): void {
    const allSessions = this.getAllPracticeSessions();
    const existingIndex = allSessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      allSessions[existingIndex] = session;
    } else {
      allSessions.push(session);
    }

    // Add sessions from other users back
    const stored = localStorage.getItem(STORAGE_KEYS.PRACTICE_SESSIONS);
    let otherUsersSessions: ScenarioPracticeSession[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        otherUsersSessions = parsed.filter((s: ScenarioPracticeSession) => s.userId !== this.userId);
      } catch (error) {
        console.warn('Failed to parse other users sessions:', error);
      }
    }

    const allUserSessions = [...otherUsersSessions, ...allSessions];
    localStorage.setItem(STORAGE_KEYS.PRACTICE_SESSIONS, JSON.stringify(allUserSessions));
  }

  // Goal and XP Management
  completeGoal(sessionId: string, goalText: string): boolean {
    const session = this.getPracticeSession(sessionId);
    if (!session) return false;

    if (!session.completedGoals.includes(goalText) && session.currentGoals.includes(goalText)) {
      const completedGoals = [...session.completedGoals, goalText];
      this.updatePracticeSession(sessionId, { completedGoals });
      return true;
    }
    return false;
  }

  awardXp(amount: number, reason?: string): UserLearningProgress {
    const progress = this.getLearningProgress();
    const newTotalXp = progress.totalXp + amount;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;
    const xpToNextLevel = (newLevel * 1000) - newTotalXp;

    return this.updateLearningProgress({
      totalXp: newTotalXp,
      level: newLevel,
      xpToNextLevel: xpToNextLevel
    });
  }

  awardBadge(badgeId: string, badgeName: string, description: string): UserLearningProgress {
    const progress = this.getLearningProgress();
    const existingBadge = progress.badges.find(b => b.id === badgeId);
    
    if (!existingBadge) {
      const newBadge = {
        id: badgeId,
        name: badgeName,
        description,
        earnedAt: new Date().toISOString()
      };
      
      return this.updateLearningProgress({
        badges: [...progress.badges, newBadge]
      });
    }
    
    return progress;
  }

  completeScenario(scenarioId: string): UserLearningProgress {
    const learningProgress = this.getLearningProgress();
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (!scenario || learningProgress.completedScenarios.includes(scenarioId)) {
      return learningProgress;
    }

    // Update scenario progress
    this.updateScenarioProgress(scenarioId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    // Award XP and badges
    let updatedProgress = this.awardXp(scenario.rewards.xp);
    
    if (scenario.rewards.badges) {
      for (const badgeId of scenario.rewards.badges) {
        updatedProgress = this.awardBadge(badgeId, badgeId, `Earned by completing ${scenario.title}`);
      }
    }

    // Mark scenario as completed and unlock new scenarios
    const completedScenarios = [...updatedProgress.completedScenarios, scenarioId];
    const availableScenarios = getAvailableScenarios(
      completedScenarios, 
      updatedProgress.totalXp,
      Object.keys(updatedProgress.vocabMastery).length
    );
    const allUnlocked = [
      ...updatedProgress.unlockedScenarios,
      ...availableScenarios.map(s => s.id)
    ];
    const unlockedScenarios = allUnlocked.filter((id, index) => allUnlocked.indexOf(id) === index);

    return this.updateLearningProgress({
      completedScenarios,
      unlockedScenarios
    });
  }

  // Vocabulary tracking
  trackVocabUsage(word: string, correct: boolean = true): UserLearningProgress {
    const progress = this.getLearningProgress();
    const current = progress.vocabMastery[word] || {
      encounters: 0,
      correctUsage: 0,
      lastSeen: new Date().toISOString(),
      masteryLevel: 'new' as const
    };

    const encounters = current.encounters + 1;
    const correctUsage = current.correctUsage + (correct ? 1 : 0);
    
    // Determine mastery level
    let masteryLevel: 'new' | 'learning' | 'familiar' | 'mastered';
    if (encounters >= 10 && correctUsage / encounters >= 0.8) {
      masteryLevel = 'mastered';
    } else if (encounters >= 5 && correctUsage / encounters >= 0.6) {
      masteryLevel = 'familiar';
    } else if (encounters >= 2) {
      masteryLevel = 'learning';
    } else {
      masteryLevel = 'new';
    }

    const updatedVocabMastery = {
      ...progress.vocabMastery,
      [word]: {
        encounters,
        correctUsage,
        lastSeen: new Date().toISOString(),
        masteryLevel
      }
    };

    return this.updateLearningProgress({
      vocabMastery: updatedVocabMastery
    });
  }

  // Streak management
  updateStreak(): UserLearningProgress {
    const progress = this.getLearningProgress();
    const today = new Date().toISOString().split('T')[0];
    const lastStudyDate = progress.streaks.lastStudyDate;
    
    let current = progress.streaks.current;
    let longest = progress.streaks.longest;

    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastStudyDate === yesterdayStr) {
        // Continuing streak
        current += 1;
      } else {
        // Streak broken
        current = 1;
      }
      
      longest = Math.max(longest, current);
    }

    return this.updateLearningProgress({
      streaks: {
        current,
        longest,
        lastStudyDate: today
      }
    });
  }

  // Clear all data (for testing/reset)
  clearAllProgress(): void {
    localStorage.removeItem(STORAGE_KEYS.LEARNING_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SCENARIO_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.PRACTICE_SESSIONS);
  }
}