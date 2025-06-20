// Environment configuration for development vs production
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

// Environment-specific URLs
export const getBaseUrl = () => {
  if (isDevelopment) {
    return 'http://0.0.0.0:5000';
  }
  return 'https://tomoshibi-joebouchabake.replit.app';
};

// Supabase configuration based on environment
export function getSupabaseConfig() {
  const config = {
    url: isDevelopment 
      ? import.meta.env.VITE_SUPABASE_DEV_URL || 'https://gsnnydemkpllycgzmalv.supabase.co'
      : import.meta.env.VITE_SUPABASE_PROD_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co',
    anonKey: isDevelopment 
      ? import.meta.env.VITE_SUPABASE_DEV_ANON_KEY || ''
      : import.meta.env.VITE_SUPABASE_PROD_ANON_KEY || ''
  };

  console.log('🔧 Supabase Config:', { 
    environment: isDevelopment ? 'development' : 'production',
    url: config.url,
    hasAnonKey: !!config.anonKey 
  });

  return config;
}

// Auth redirect URLs
export const getAuthRedirectUrl = (endpoint: string) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${endpoint}`;
};