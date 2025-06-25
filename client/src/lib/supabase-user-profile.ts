
import { supabase } from './supabase/client';

export interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  prefers_english?: boolean;
  jlpt_goal_level?: string;
  native_language?: string;
  timezone?: string;
  theme?: string;
  streak_days?: number;
  last_streak_date?: string;
  xp?: number;
  learning_goals?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function createUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

export async function updateStreak(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const profile = await getUserProfile(userId);
    
    if (!profile) return false;

    const lastStreakDate = profile.last_streak_date;
    const currentStreak = profile.streak_days || 0;
    
    let newStreak = currentStreak;
    
    if (lastStreakDate === today) {
      // Already updated today
      return true;
    } else if (lastStreakDate) {
      const lastDate = new Date(lastStreakDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken, restart
        newStreak = 1;
      }
    } else {
      // First time
      newStreak = 1;
    }

    await updateUserProfile(userId, {
      streak_days: newStreak,
      last_streak_date: today
    });

    return true;
  } catch (error) {
    console.error('Error updating streak:', error);
    return false;
  }
}

export async function addXP(userId: string, xpToAdd: number): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return false;

    const newXP = (profile.xp || 0) + xpToAdd;
    
    await updateUserProfile(userId, {
      xp: newXP
    });

    return true;
  } catch (error) {
    console.error('Error adding XP:', error);
    return false;
  }
}
