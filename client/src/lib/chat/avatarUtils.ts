
/**
 * 🧩 Shared avatar utilities
 * ✅ Common avatar image handling and fallbacks
 * 🔒 Works for both solo and group chats
 */
import type { GroupPersona } from "@/types/chat";

export interface AvatarPersona {
  id: string;
  name: string;
  avatar_url?: string;
}

export function getAvatarImage(persona: AvatarPersona | null): string {
  if (!persona?.avatar_url) return "/avatars/default.png";
  return persona.avatar_url.startsWith("/") ? persona.avatar_url : `/avatars/${persona.avatar_url}`;
}

export function getPersonaBubbleStyles(persona: AvatarPersona | null): string {
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
}

export function handleAvatarError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  target.src = "/avatars/default.png";
}
