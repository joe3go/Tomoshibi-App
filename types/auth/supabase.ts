
// Authentication and user types
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  profile_image_url?: string;
  preferred_kanji_display?: string;
  sound_notifications?: boolean;
  desktop_notifications?: boolean;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}
