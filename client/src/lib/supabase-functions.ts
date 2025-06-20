import { createClient } from '@supabase/supabase-js';

// Determine environment and URL
const isDevelopment = import.meta.env.NODE_ENV === 'development';

// Use environment-specific Supabase configuration
const supabaseUrl = isDevelopment 
  ? import.meta.env.VITE_SUPABASE_DEV_URL || 'https://gsnnydemkpllycgzmalv.supabase.co'
  : import.meta.env.VITE_SUPABASE_PROD_URL || 'https://gsnnydemkpllycgzmalv.supabase.co';

const supabaseKey = isDevelopment
  ? import.meta.env.VITE_SUPABASE_DEV_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbnN5ZGVta3BsbHljZ3ptYWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzY2NjksImV4cCI6MjA2NTk1MjY2OX0.tY9VGo8GOHNRlwMqRgBXR-TrnJ_k1H1BrnVz0jWFhGU'
  : import.meta.env.VITE_SUPABASE_PROD_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbnN5ZGVta3BsbHljZ3ptYWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzY2NjksImV4cCI6MjA2NTk1MjY2OX0.tY9VGo8GOHNRlwMqRgBXR-TrnJ_k1H1BrnVz0jWFhGU';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Get current authenticated user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Auth state change listener
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}

// Get vocabulary statistics
export async function getVocabStats(userId: string) {
  const { data, error } = await supabase
    .from('vocab_tracker')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}