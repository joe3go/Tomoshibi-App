
# Full Codebase Modular Refactor - Rollout Plan

## 🎯 Objective
Modularize the entire codebase for better maintainability while preserving 100% of existing functionality.

## 📋 Module Refactor Checklist

### ✅ COMPLETED: Dashboard Module
- [x] ProfileHeader component
- [x] StatCard component
- [x] JLPTProgressGrid component
- [x] ConversationPreviewCard component
- [x] DashboardLoading component
- [x] useUserProfile hook
- [x] useTutors hook
- [x] useConversations hook
- [x] useVocabularyStats hook
- [x] analytics.ts utilities

### ✅ COMPLETED: Chat Module
- [x] Extract shared ChatHeader component
- [x] Extract shared ChatMessage component
- [x] Extract shared ChatInput component
- [x] Extract shared TypingIndicator component
- [x] Create useChatConversation hook (shared logic)
- [x] Create useMessageSending hook
- [x] Consolidate avatar/styling utilities in chat-utilities.ts
- [x] Refactor chat.tsx to use shared components

### 📋 PENDING: Group Chat Module
- [ ] Reuse ChatHeader, ChatMessage, ChatInput from chat
- [ ] Extract GroupChatFlow component
- [ ] Extract PersonaTargeting component
- [ ] Create useGroupChatFlow hook (group-specific logic)
- [ ] Create usePersonaTargeting hook
- [ ] Create useGroupChatThrottling hook

### 📋 PENDING: Vocabulary Module
- [ ] Extract VocabularyBrowser component
- [ ] Extract VocabularyStatsCard component
- [ ] Extract WordDefinitionPopup component
- [ ] Create useVocabularyBrowser hook
- [ ] Create useWordDefinitions hook
- [ ] Consolidate vocabulary utilities

### 📋 PENDING: Scenario Learning Module
- [ ] Extract ScenarioCard component (already exists, verify reuse)
- [ ] Extract ScenarioProgressWidget component (already exists, verify reuse)
- [ ] Create useScenarioProgress hook
- [ ] Create useScenarioSelection hook
- [ ] Consolidate scenario utilities

### 📋 PENDING: Practice Groups Module
- [ ] Extract TemplateSelector component (already exists)
- [ ] Extract GroupCreation component
- [ ] Create usePracticeGroups hook
- [ ] Create useTemplateSelection hook

### 📋 PENDING: Settings Module
- [ ] Extract ProfileSettings component
- [ ] Extract PreferencesSettings component
- [ ] Create useUserSettings hook
- [ ] Create usePreferences hook

### 📋 PENDING: Authentication Module
- [ ] Extract LoginForm component
- [ ] Extract AuthGuard component
- [ ] Consolidate auth utilities

## 🔧 Shared Components to Extract
- [ ] ChatHeader (chat + group-chat)
- [ ] ChatMessage (chat + group-chat)
- [ ] ChatInput (chat + group-chat)
- [ ] TypingIndicator (chat + group-chat)
- [ ] LoadingSpinner (global)
- [ ] ErrorBoundary (global)

## 🎣 Shared Hooks to Create
- [ ] useChatConversation (shared chat logic)
- [ ] useMessageSending (shared message logic)
- [ ] useTypingState (shared typing logic)
- [ ] useErrorHandling (global error handling)

## 🛠 Utilities to Centralize
- [ ] Avatar URL formatting
- [ ] Persona styling/colors
- [ ] Message formatting
- [ ] XP calculations
- [ ] Date/time formatting
- [ ] Fallback value handling

## 🗑 Legacy Code Review
- [ ] Remove unused imports
- [ ] Remove duplicate helper functions
- [ ] Consolidate similar type definitions
- [ ] Remove commented code blocks

## ✅ Final Validation Checklist
- [ ] TypeScript compiles with no errors
- [ ] All functionality preserved
- [ ] All UI behavior unchanged
- [ ] Performance maintained or improved
- [ ] No regression in user experience

---

**Status**: 🚀 Starting chat module refactor
**Next**: Extract shared chat components and hooks
