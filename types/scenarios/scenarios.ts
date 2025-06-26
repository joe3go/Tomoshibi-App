
import { z } from "zod";

// Core scenario data structure
export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']),
  prompt: z.string(),
  goals: z.array(z.string()),
  targetVocab: z.array(z.string()),
  category: z.string(),
  difficulty: z.enum(['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced']),
  estimatedMinutes: z.number(),
  prerequisites: z.array(z.string()).optional(),
  unlockConditions: z.object({
    completedScenarios: z.array(z.string()).optional(),
    minVocabUsed: z.number().optional(),
    minXp: z.number().optional(),
  }).optional(),
  rewards: z.object({
    xp: z.number(),
    badges: z.array(z.string()).optional(),
  }),
});

export type Scenario = z.infer<typeof scenarioSchema>;

// User progress tracking
export const userScenarioProgressSchema = z.object({
  userId: z.string(),
  scenarioId: z.string(),
  status: z.enum(['locked', 'available', 'in-progress', 'completed']),
  attempts: z.number(),
  bestScore: z.number().optional(),
  goalsCompleted: z.array(z.string()),
  vocabUsed: z.record(z.string(), z.number()),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  lastAttemptAt: z.string(),
});

export type UserScenarioProgress = z.infer<typeof userScenarioProgressSchema>;

// Scenario practice session
export const scenarioPracticeSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scenarioId: z.string(),
  personaId: z.number(),
  status: z.enum(['active', 'completed', 'abandoned']),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
    vocabHighlights: z.array(z.string()).optional(),
    grammarNotes: z.array(z.string()).optional(),
    corrections: z.array(z.object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
    })).optional(),
  })),
  currentGoals: z.array(z.string()),
  completedGoals: z.array(z.string()),
  vocabUsedThisSession: z.record(z.string(), z.number()),
  score: z.number(),
  feedback: z.string().optional(),
  startedAt: z.string(),
  lastActivityAt: z.string(),
  completedAt: z.string().optional(),
});

export type ScenarioPracticeSession = z.infer<typeof scenarioPracticeSessionSchema>;

// Goal completion tracking
export interface GoalCompletion {
  goalText: string;
  completed: boolean;
  evidence: string[];
  completedAt?: string;
}

// Scenario feedback
export interface ScenarioFeedback {
  overallScore: number;
  goalCompletions: GoalCompletion[];
  vocabUsage: {
    targetWordsUsed: string[];
    newWordsLearned: string[];
    correctUsage: string[];
    needsImprovement: string[];
  };
  suggestions: string[];
  encouragement: string;
}
