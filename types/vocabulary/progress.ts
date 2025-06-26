
import { z } from "zod";

// User learning progress
export const userLearningProgressSchema = z.object({
  userId: z.string(),
  totalXp: z.number(),
  level: z.number(),
  xpToNextLevel: z.number(),
  completedScenarios: z.array(z.string()),
  unlockedScenarios: z.array(z.string()),
  vocabMastery: z.record(z.string(), z.object({
    encounters: z.number(),
    correctUsage: z.number(),
    lastSeen: z.string(),
    masteryLevel: z.enum(['new', 'learning', 'familiar', 'mastered']),
  })),
  badges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    earnedAt: z.string(),
  })),
  streaks: z.object({
    current: z.number(),
    longest: z.number(),
    lastStudyDate: z.string(),
  }),
  preferences: z.object({
    preferredPersonaType: z.enum(['teacher', 'friend']).optional(),
    difficultyPreference: z.enum(['easy', 'medium', 'hard']).optional(),
    reminderFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
  }).optional(),
});

export type UserLearningProgress = z.infer<typeof userLearningProgressSchema>;

export interface UserProgress {
  id: string;
  user_id: string;
  scenario_id: string;
  completed: boolean;
  xp: number;
  created_at: string;
  updated_at: string;
  jlpt_level?: string;
  vocab_encountered?: number[];
  vocab_mastered?: number[];
  grammar_encountered?: number[];
  grammar_mastered?: number[];
  total_conversations?: number;
  total_messages_sent?: number;
  last_activity?: string;
}
