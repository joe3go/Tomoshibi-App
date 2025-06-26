
export const calculateTotalWords = (vocabStats: any): number => {
  if (!vocabStats) return 150;
  return Object.values(vocabStats).reduce((sum: number, count: any) => sum + (count || 0), 0);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const getAvatarImage = (persona: any): string => {
  if (persona?.avatar_url && persona.avatar_url.startsWith('/avatars/')) {
    return persona.avatar_url;
  }
  return `/avatars/${persona?.name?.toLowerCase() || 'default'}.png`;
};
