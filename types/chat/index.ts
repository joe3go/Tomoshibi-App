/**
 * @fileoverview Chat and conversation type definitions
 * 
 * This module contains all types related to chat functionality including:
 * - Conversation management (solo and group)
 * - Message handling and persistence
 * - Group chat coordination and state management
 */

// Chat-related type exports
export * from './conversations';
export * from './messages';
export * from './group-chat';

// Re-export commonly used types
export type { GroupMessage, GroupPersona, GroupChatState, GroupConversation, GroupConversationTemplate } from './group-chat';
export type { Message } from './messages';
export type { Conversation } from './conversations';

// Re-export common types for backwards compatibility
export type { GroupMessage, GroupPersona, GroupChatState } from './group-chat';