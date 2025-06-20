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
export const getSupabaseConfig = () => {
  if (isDevelopment) {
    return {
      url: import.meta.env.VITE_SUPABASE_DEV_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_DEV_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXdwZXlsdmRxZmtoeXNuanNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNDg5NzMsImV4cCI6MjA2NTcyNDk3M30.HxmDxm7QFTDCRUboGTGQIpXfnC7Tc4_-P6Z45QzmlM0',
      serviceKey: import.meta.env.VITE_SUPABASE_DEV_SERVICE_KEY || ''
    };
  } else {
    return {
      url: import.meta.env.VITE_SUPABASE_PROD_URL || 'https://gsnnydemkpllycgzmalv.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_PROD_ANON_KEY || '',
      serviceKey: import.meta.env.VITE_SUPABASE_PROD_SERVICE_KEY || ''
    };
  }
};

// Auth redirect URLs
export const getAuthRedirectUrl = (endpoint: string) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}${endpoint}`;
};