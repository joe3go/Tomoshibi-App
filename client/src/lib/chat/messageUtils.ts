
/**
 * 🧩 Shared message utilities
 * ✅ Common message formatting and handling
 * 🔒 Works for both solo and group chats
 */

export function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function isRecentMessage(timestamp: string, thresholdMs: number = 30000): boolean {
  return Date.now() - new Date(timestamp).getTime() < thresholdMs;
}

export function getMessageBubbleStyles(messageType: 'user' | 'ai', personaBubbleStyles?: string): string {
  if (messageType === 'user') {
    return 'bg-blue-500 text-white';
  }
  return personaBubbleStyles || 'bg-gray-100 text-gray-900 border border-gray-200';
}
