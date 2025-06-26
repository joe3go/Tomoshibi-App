
import type { Persona } from "@/types/personas";

/**
 * Utility functions for group chat functionality
 */

export const isRecentMessage = (timestamp: string, windowMs: number = 30000): boolean => {
  return Date.now() - new Date(timestamp).getTime() < windowMs;
};

export const getTypingDelay = (): number => {
  // Random delay between 1-3 seconds for realistic typing simulation
  return Math.random() * 2000 + 1000;
};

export const extractGroupTopic = (title: string): string => {
  // Extract topic from group conversation title
  const parts = title.split('|');
  return parts[0]?.trim() || title;
};

export const formatParticipantsList = (personas: Persona[]): string => {
  if (personas.length === 0) return "No participants";
  if (personas.length === 1) return personas[0].name;
  if (personas.length === 2) return `${personas[0].name} and ${personas[1].name}`;
  
  const allButLast = personas.slice(0, -1).map(p => p.name).join(", ");
  const last = personas[personas.length - 1].name;
  return `${allButLast}, and ${last}`;
};

export const shouldHighlightMessage = (timestamp: string, highlightWindowMs: number = 30000): boolean => {
  return isRecentMessage(timestamp, highlightWindowMs);
};

export const getPersonaFromMessage = (
  personas: Persona[], 
  senderPersonaId: string | null
): Persona | null => {
  if (!senderPersonaId || personas.length === 0) return null;
  return personas.find(p => p.id === senderPersonaId) || null;
};

export const generateGroupPromptContext = (
  topic: string,
  participants: Persona[],
  recentMessages: any[]
): string => {
  const participantNames = participants.map(p => p.name).join(", ");
  const messageCount = recentMessages.length;
  
  return `Group conversation about "${topic}" with ${participantNames}. ${messageCount} messages exchanged so far.`;
};

export const validateGroupConversation = (conversation: any): boolean => {
  return conversation && 
         conversation.mode === 'group' && 
         conversation.id && 
         conversation.title;
};
