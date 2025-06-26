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
- [x] Extract ChatHeader component (shared between chat + group-chat)
- [x] Extract ChatMessage component (shared between chat + group-chat)
- [x] Extract ChatInput component (shared between chat + group-chat)
- [x] Extract TypingIndicator component (shared between chat + group-chat)
- [x] Create useChatConversation hook
- [x] Create useMessageSending hook
- [x] Consolidate chat utilities

### ✅ COMPLETED: Group Chat Module
- [x] Extract GroupChatHeader component
- [x] Extract GroupTypingIndicator component
- [x] Create useGroupChat hook
- [x] Create useGroupConversationFlow hook
- [x] Consolidate group chat utilities

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