import type { JlptLevel } from '@/types';

export const JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export const JLPT_LEVEL_INFO: Record<JlptLevel, {
  name: string;
  description: string;
  vocabularyTarget: number;
  grammarPatterns: number;
  studyHours: number;
  color: string;
  bgColor: string;
}> = {
  N5: {
    name: 'Beginner',
    description: 'Basic Japanese for daily situations',
    vocabularyTarget: 800,
    grammarPatterns: 100,
    studyHours: 325,
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  N4: {
    name: 'Elementary',
    description: 'Enhanced communication skills',
    vocabularyTarget: 1500,
    grammarPatterns: 200,
    studyHours: 575,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  N3: {
    name: 'Intermediate',
    description: 'Everyday conversation proficiency',
    vocabularyTarget: 3750,
    grammarPatterns: 300,
    studyHours: 950,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  N2: {
    name: 'Upper Intermediate',
    description: 'Academic and business contexts',
    vocabularyTarget: 6000,
    grammarPatterns: 500,
    studyHours: 1475,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100'
  },
  N1: {
    name: 'Advanced',
    description: 'Native-level comprehension',
    vocabularyTarget: 10000,
    grammarPatterns: 800,
    studyHours: 2200,
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  }
} as const;

export const STUDY_GOALS = [
  { value: 'conversation', label: 'Improve Conversation' },
  { value: 'jlpt', label: 'Pass JLPT Exam' },
  { value: 'business', label: 'Business Japanese' },
  { value: 'travel', label: 'Travel Japanese' },
  { value: 'general', label: 'General Proficiency' },
  { value: 'anime', label: 'Anime & Media' },
  { value: 'academic', label: 'Academic Study' }
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', description: 'Gentle progression with extra support' },
  { value: 'adaptive', label: 'Adaptive', description: 'Adjusts to your learning pace' },
  { value: 'challenging', label: 'Challenging', description: 'Fast-paced with advanced content' }
] as const;