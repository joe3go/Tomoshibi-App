import { supabase } from './client';
import { UserVocab, UserProgress } from './types';

// Create tables if they don't exist
export async function initializeSupabaseTables() {
  // Create user_vocab table
  const { error: vocabError } = await supabase.rpc('create_user_vocab_table', {});
  if (vocabError && !vocabError.message.includes('already exists')) {
    console.error('Error creating user_vocab table:', vocabError);
  }

  // Create user_progress table
  const { error: progressError } = await supabase.rpc('create_user_progress_table', {});
  if (progressError && !progressError.message.includes('already exists')) {
    console.error('Error creating user_progress table:', progressError);
  }
}

// Vocabulary functions
export async function getUserVocab(userId: string): Promise<UserVocab[]> {
  const { data, error } = await supabase
    .from('user_vocab')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user vocab:', error);
    return [];
  }

  return data || [];
}

export async function addUserVocab(userId: string, vocab: Omit<UserVocab, 'id' | 'user_id' | 'created_at'>): Promise<UserVocab | null> {
  const { data, error } = await supabase
    .from('user_vocab')
    .insert({
      user_id: userId,
      ...vocab,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding vocab:', error);
    return null;
  }

  return data;
}

export async function removeUserVocab(userId: string, vocabId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_vocab')
    .delete()
    .eq('id', vocabId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing vocab:', error);
    return false;
  }

  return true;
}

// Progress functions
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }

  return data || [];
}

export async function markScenarioComplete(userId: string, scenarioId: string, xp: number = 0): Promise<UserProgress | null> {
  // First check if progress already exists
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .single();

  if (existing) {
    // Update existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        completed: true,
        xp: existing.xp + xp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return null;
    }

    return data;
  } else {
    // Create new progress entry
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        completed: true,
        xp,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating progress:', error);
      return null;
    }

    return data;
  }
}

export async function updateScenarioXP(userId: string, scenarioId: string, additionalXP: number): Promise<UserProgress | null> {
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        xp: existing.xp + additionalXP,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating XP:', error);
      return null;
    }

    return data;
  } else {
    // Create new progress entry
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        completed: false,
        xp: additionalXP,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating progress:', error);
      return null;
    }

    return data;
  }
}