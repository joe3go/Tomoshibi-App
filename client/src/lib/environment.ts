
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const currentOrigin = window.location.origin;
  
  return {
    isDevelopment,
    currentOrigin,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://oyawpeylvdqfkhysnjsq.supabase.co',
    supabaseKey: isDevelopment 
      ? (import.meta.env.VITE_SUPABASE_DEV_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)
      : (import.meta.env.VITE_SUPABASE_PROD_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
    authRedirectUrl: `${currentOrigin}/auth/confirm`
  };
};

export const getRedirectDomains = () => {
  return [
    'https://74e160bc-d4e2-4a3b-9efc-feb62bffd2d8-00-1ivyxq6u5jrj5.janeway.replit.dev',
    'https://tomoshibi-joebouchabake.replit.app'
  ];
};
