import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);