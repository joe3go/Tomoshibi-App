
import type { Persona } from "@/types/personas";

/**
 * Utility functions for chat functionality
 */

export const getAvatarImage = (persona: Persona | null) => {
  if (!persona?.avatar_url) return "/avatars/default.png";
  return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
};

export const getPersonaBubbleStyles = (persona: Persona | null) => {
  if (!persona) return 'bg-gray-100 text-gray-900 border border-gray-200';
  
  switch (persona.name) {
    case 'Keiko':
      return 'bg-rose-100 text-rose-900 border border-rose-200';
    case 'Aoi':
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    case 'Haruki':
      return 'bg-orange-100 text-orange-900 border border-orange-200';
    case 'Satoshi':
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-900 border border-gray-200';
  }
};

export const formatMessageTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const isRecentMessage = (timestamp: string, windowMs: number = 30000) => {
  return Date.now() - new Date(timestamp).getTime() < windowMs;
};

export const extractPersonaFromTitle = (title: string) => {
  // Extract persona name from conversation title
  const titleParts = title.split('|')[0].trim();
  const personaName = titleParts.replace(/^Chat with\s+/i, '').trim();
  return personaName;
};

export const generateFallbackPersona = (name: string): Persona => ({
  id: `fallback-${name.toLowerCase()}`,
  name,
  type: 'tutor',
  avatar_url: '/avatars/default.png',
  description: `${name} - Japanese Language Tutor`
});

export const safeFindPersona = (personas: Persona[], personaId: string | null): Persona | null => {
  if (!personaId || !personas.length) return null;
  return personas.find(p => p.id === personaId) || null;
};

export const safeMapPersonas = (personaIds: string[], allPersonas: Persona[]): Persona[] => {
  return personaIds
    .map(id => allPersonas.find(p => p.id === id))
    .filter((persona): persona is Persona => persona !== undefined);
};
