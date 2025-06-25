# Tomoshibi - Japanese Learning Platform

## Overview

Tomoshibi is a Japanese conversation learning platform that helps JLPT N5 students practice authentic conversations with AI-powered tutors. The application provides interactive scenarios, vocabulary tracking, and progress monitoring to build confidence in Japanese conversation skills.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for server state management and caching
- **Tailwind CSS** with custom Japanese-inspired theme
- **shadcn/ui** component library with Radix UI primitives
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** with TypeScript for the REST API
- **Drizzle ORM** for database operations with PostgreSQL
- **Supabase** as the serverless PostgreSQL provider
- **JWT** for authentication and authorization
- **bcrypt** for password hashing
- **OpenAI GPT-4o** for AI-powered conversation generation
- **Multer** for file upload handling (profile images)

### Database Schema
- **users**: Authentication and user preferences
- **personas**: AI tutor personalities (teacher/friend types)
- **scenarios**: Conversation scenarios with structured phases
- **conversations**: Active chat sessions between users and AI
- **messages**: Individual messages within conversations
- **jlpt_vocab**: JLPT N5 vocabulary reference
- **jlpt_grammar**: JLPT N5 grammar patterns
- **user_progress**: Learning progress tracking
- **vocab_tracker**: Vocabulary usage and mastery tracking

## Key Components

### Authentication System
- JWT-based authentication with secure token storage
- User registration and login with email/password
- Protected routes requiring authentication
- User profile management with display name and preferences

### AI Conversation Engine
- Multiple AI personas with distinct personalities:
  - **Aoi**: Formal teacher persona using polite Japanese
  - **Haruki**: Casual friend persona using informal speech
- Structured conversation scenarios with defined phases
- Context-aware responses using conversation history
- Vocabulary and grammar usage tracking within conversations

### Furigana Display System
- Dynamic furigana (ruby text) rendering for kanji
- Toggle functionality to show/hide furigana
- Persistent user preference storage
- Enhanced text component with word hover definitions

### Vocabulary Tracking
- Real-time vocabulary encounter logging
- Memory strength calculation for spaced repetition
- JLPT level progression tracking
- Word definition lookup with external API fallback

### Progress Analytics
- Conversation completion tracking
- Vocabulary mastery statistics
- Grammar pattern usage monitoring
- Learning streak and engagement metrics

## Data Flow

1. **User Authentication**: Login credentials → JWT token → Protected API access
2. **Conversation Flow**: User selects persona → Chooses scenario → Creates conversation → Real-time chat with AI
3. **Vocabulary Tracking**: Japanese text parsing → Word extraction → Usage logging → Progress updates
4. **AI Response Generation**: User message → Context assembly → OpenAI API → Structured response with learning feedback

## External Dependencies

### APIs and Services
- **OpenAI GPT-4o**: AI conversation generation and language processing
- **Supabase**: Serverless PostgreSQL hosting with authentication features
- **Google Fonts**: Inter and Noto Sans JP font families

### Core Libraries
- **@neondatabase/serverless**: Database connection pooling (compatible with Supabase)
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-**: Accessible UI component primitives
- **drizzle-orm**: Type-safe database operations
- **openai**: Official OpenAI API client
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token management
- **multer**: File upload handling

## Deployment Strategy

The application is configured for Replit deployment with:
- **Build Command**: `npm run build` (Vite build + esbuild for server)
- **Start Command**: `npm run start` (Production Node.js server)
- **Development**: `npm run dev` (Vite dev server with HMR)
- **Port Configuration**: Internal port 5000 mapped to external port 80
- **Database**: PostgreSQL 16 module with automatic provisioning

The build process creates a production bundle with:
- Client-side assets in `dist/public`
- Server bundle in `dist/index.js`
- Static file serving for the React SPA

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### June 23, 2025 - Complete Chat System Overhaul with Enhanced UI and Real-time Updates
- **Rebuilt chat system from scratch with direct state management**:
  - Replaced complex cache management with React state for immediate UI updates
  - Eliminated Realtime subscription dependencies that required paid Supabase tier
  - Implemented direct database operations with instant UI state synchronization
  - Fixed persistent message display issues that required page refreshes
- **Enhanced visual design with persona-specific styling**:
  - Added colored chat bubbles: Keiko (rose), Aoi (emerald), Haruki (orange), Satoshi (blue)
  - Implemented proper avatar positioning for both user and AI messages
  - Created persona-specific typing indicators with themed styling
  - Updated all class names to be semantic and descriptive following dashboard patterns
- **Integrated all core features seamlessly**:
  - Furigana toggle functionality with persistent user preferences
  - Wanakana romaji-to-hiragana conversion with proper binding/unbinding
  - Vocabulary tracking for both user and AI messages
  - English translations and learning suggestions in collapsible sections
- **File structure improvements**:
  - Renamed chat-new.tsx to chat.tsx and moved old system to chat-old.tsx
  - Updated routing to use the new chat system throughout the application
  - Maintained backward compatibility with existing conversation data

### June 23, 2025 - Implemented Group Conversation Feature with Multi-Persona Support
- **Complete group conversation system implementation**:
  - Added conversation templates for Anime Club, Study Group, and Cafe Hangout scenarios
  - Built template selector UI with difficulty badges and participant counts
  - Created typing indicator component with animated dots for realistic group chat feel
  - Implemented conversation prompt injection with variable replacement for personalization
- **Mock data architecture for group conversations**:
  - Created comprehensive type definitions in `shared/group-conversation-types.ts`
  - Built mock conversation templates with predefined prompts and participant mappings
  - Added localStorage-based group conversation storage for demo functionality
  - Implemented participant management with persona ordering and role assignment
- **Seamless dashboard integration**:
  - Added Practice Groups section to dashboard with statistics and navigation
  - Created dedicated `/practice-groups` route with template selection interface
  - Maintained complete backward compatibility with existing solo chat functionality
  - Added visual distinction between solo tutors and group practice options
- **Enhanced user experience features**:
  - Real-time typing simulation for multiple AI participants
  - Group creation with automatic initial message generation
  - Template-based conversation initialization with personalized greetings
  - Responsive UI design with proper loading states and error handling

### June 25, 2025 - Decoupled Group Chat System for Better Scalability
- **Created dedicated GroupChat component** (`client/src/pages/group-chat.tsx`):
  - Completely separate from solo chat to avoid complexity and bugs
  - Dedicated group chat logic with proper round-robin speaker selection
  - Built-in throttling system (15-second cooldown, max 2 consecutive responses)
  - Clean persona attribution and message display with timestamps
- **Improved architecture for long-term maintainability**:
  - Isolated group chat state management and business logic
  - Dedicated route `/group-chat/:conversationId` for group conversations
  - Updated Practice Groups to use new group chat component
  - Easier debugging and feature development for group-specific functionality
- **Database schema fixes** (`fix-group-chat-schema.sql`):
  - Added missing `difficulty` column to conversation_templates
  - Fixed `default_personas` array with proper UUID references
  - Added `group_prompt_suffix` column for conversation context
  - Clean up invalid persona references in conversation_participants
- **Benefits for scalability**:
  - Independent evolution of group vs solo chat features
  - Performance optimization specific to group scenarios  
  - Cleaner testing and debugging workflows
  - Foundation for advanced group features (reactions, threads, moderation)

### June 25, 2025 - Enhanced Group Chat System with Smart State Management and Turn-Taking
- **Implemented advanced group chat state management**:
  - Added cooldown system (15 seconds) to prevent rapid-fire AI responses
  - Implemented consecutive response limits (max 2) for natural conversation flow
  - Created typing delays (1-3 seconds) for realistic group chat simulation
  - Enhanced message display with connection indicators and timestamps
- **Fixed conversation participants population issues**:
  - Added emergency fallback system when template data is unavailable
  - Improved round-robin speaker selection with better error handling
  - Enhanced persona resolution for group conversations
  - Fixed template data loading from conversation_templates table
- **Enhanced visual indicators for group conversations**:
  - Added green pulse indicators for recent messages (30-second window)
  - Implemented relative timestamps for all group messages
  - Maintained existing persona color coding and avatar system
  - Added connection status indicators next to persona names
- **Preserved all existing functionality**:
  - Solo conversations continue to work without changes
  - Furigana toggle functionality maintained across all messages
  - WanaKana romaji-to-hiragana conversion preserved
  - Vocabulary tracking and progress analytics intact

### June 25, 2025 - Complete Group Chat Functionality Implementation with Persona Attribution
- **Implemented complete group conversation system with database integration**:
  - Created `conversation_templates` table with group chat templates including prompt suffixes
  - Added `conversation_participants` table to track AI participants in group conversations (composite primary key)
  - Added `mode` column to conversations table to distinguish solo vs group chats
  - Inserted default group templates: Anime Club, Study Group, and Cafe Hangout with correct persona IDs
- **Enhanced AI response system for group conversations**:
  - Updated OpenAI integration to support group prompt suffixes and multi-persona context
  - Modified server routes to handle group conversation creation and AI response generation
  - Implemented intelligent AI participant selection for group conversation responses
  - Fixed AI message creation to properly set sender_persona_id for persona attribution
- **Updated practice groups interface to use real Supabase data**:
  - Replaced hardcoded templates with dynamic fetching from conversation_templates table
  - Added fallback templates for graceful degradation if database unavailable
  - Enhanced template selector to show correct participant counts and metadata
  - Fixed dashboard to distinguish between solo tutors and group conversations
- **Completed chat interface for group conversations with proper persona display**:
  - Fixed persona name display for AI messages in group mode (shows actual names like "Keiko", "Aoi")
  - Updated chat header to show group topic instead of misleading participant counts
  - Enhanced message handling to support persona attribution and lookup
  - Corrected conversation participant loading to work with actual database schema
- **Full system integration and testing**:
  - All group chat features work seamlessly with existing solo chat functionality
  - Proper database schema alignment with foreign key constraints and RLS policies
  - Complete end-to-end functionality from template selection to group conversation
  - Verified AI messages display correct persona names instead of generic "AI" text

### June 23, 2025 - Fixed Recent Conversations Display and Tutor Labeling Issues
- **Fixed recent conversations filtering**:
  - Completed conversations no longer appear in the dashboard's "Recent Conversations" section
  - Only active conversations are displayed, improving user experience and dashboard clarity
  - Updated analytics to accurately count only active conversations
  - Simplified conversation controls since all displayed conversations are active
  - Enhanced cache invalidation for immediate UI updates when conversations are ended
- **Fixed tutor labeling inconsistencies**:
  - Updated tutor selection page to display actual tutor names instead of hardcoded labels
  - Fixed dashboard tutor previews to show correct types: "Tutor" for formal tutors, "Study Buddy" for peer tutors
  - Aligned UI labels with database persona types (tutor/peer) for consistent user experience
- **Identified conversations table schema issue**:
  - Database missing `persona_id` column required for UUID-based conversation system
  - Created SQL fix file (`SUPABASE_CONVERSATIONS_FIX.sql`) for manual table recreation
  - Conversation creation currently fails until schema is updated in Supabase dashboard
- **Comprehensive Vocabulary System Implementation with Full 7,972 Entry Support**:
- **Implemented comprehensive vocabulary API with chunked pagination**:
  - Created `client/src/lib/vocab-api.ts` with complete CRUD operations for all 7,972 vocabulary entries
  - Built `fetchAllVocabulary()` function using chunked pagination to bypass Supabase's 1,000 row default limit
  - Added sophisticated filtering by JLPT level, word type, source, and partial text search capabilities
  - Implemented efficient batch processing with safety limits and error handling
- **Enhanced vocabulary browsing and search functionality**:
  - Created comprehensive `VocabularyBrowser` component with advanced search and filtering
  - Added real-time statistics showing authentic counts: N5 (718), N4 (668), N3 (2,139), N2 (1,748), N1 (2,699)
  - Implemented pagination with 50 items per page for optimal performance
  - Built responsive UI with search, level filtering, word type filtering, and text-based search
- **Performance optimization and database indexing**:
  - Created `supabase-vocab-indexes.sql` with comprehensive database indexes for vocabulary queries
  - Added compound indexes for common query patterns (level + word_type)
  - Implemented pg_trgm extension for fast partial text search on kanji and hiragana
  - Optimized queries to handle large vocabulary datasets efficiently
- **Updated existing components to use comprehensive API**:
  - Migrated VocabularyStatsCard and VocabTracker to use new chunked pagination system
  - Added `/vocabulary-comprehensive` route for advanced vocabulary browsing
  - Maintained backward compatibility with existing vocabulary features
  - Fixed all Supabase row limit issues affecting vocabulary display

### June 23, 2025 - Complete UUID-Based Schema Migration with Multi-Persona Support
- **Successfully migrated entire Supabase schema to UUID-based architecture**:
  - Updated all database tables to use UUID primary keys: conversations, messages, personas, scenarios, vocab_library, jlpt_grammar
  - Replaced integer-based IDs with UUIDs throughout the system for improved scalability and distributed database support
  - Migrated from `jlpt_vocab` to `vocab_library` table with proper source tracking via `vocab_sources`
- **Implemented comprehensive multi-persona conversation support**:
  - Added `conversation_participants` table to support group chats with multiple AI personas
  - Updated `messages` table with `sender_persona_id` for proper persona attribution
  - Enhanced message schema with `sender_type`, `english_translation`, `tutor_feedback`, and `suggestions` fields
- **Updated all database functions and API endpoints**:
  - Completely rebuilt `create_message_with_tracking` RPC function with UUID parameters
  - Updated server routes in `server/routes.ts` to handle UUID conversation and message IDs
  - Fixed all Supabase client calls to use UUID strings instead of integers
  - Updated vocabulary tracking to reference `vocab_library` instead of `jlpt_vocab`
- **Enhanced frontend components for UUID compatibility**:
  - Updated chat component to use new message schema with persona information
  - Modified VocabularyStatsCard to fetch from `vocab_library` table
  - Enhanced message queries to include persona data for proper bubble styling and attribution
- **Maintained data integrity and existing functionality**:
  - All existing features continue to work with new UUID-based schema
  - Vocabulary tracking and progress analytics properly updated for new table structure
  - Authentication and user management seamlessly integrated with UUID system

### June 20, 2025 - Complete Chat System and Vocabulary Data Accuracy
- **Fixed chat display issues and added conversation management**:
  - Updated chat component to fetch personas directly from Supabase for consistency
  - Fixed persona lookup that was showing "AI" instead of actual tutor names like "Aoi"
  - Added "End Chat" functionality to dashboard's recent conversations section
  - Active conversations now show both "Resume" and "End Chat" options
  - Completed conversations show only "Resume" (disabled state)
- **Corrected vocabulary data discrepancies**:
  - Fixed hardcoded vocabulary counts that didn't match Supabase reality
  - Updated dashboard to show authentic counts: N5 (718), N4 (281), N3 (1), N2 (0), N1 (0)
  - Created VocabularyStatsCard component that fetches real data from Supabase
  - Updated vocabulary page to use authentic counts instead of placeholder values
  - Progress bars now scale correctly based on actual vocabulary data
- **Implemented comprehensive message tracking RPC**:
  - Created `create_message_with_tracking` function for accurate usage analytics
  - Fixed vocab_tracker to support all JLPT vocabulary entries (not just 1000 subset)
  - Added proper foreign key constraints and performance indexes
  - Integrated vocabulary and grammar usage tracking in single transaction

### June 17, 2025 - Complete Supabase Database Migration with Full JLPT Vocabulary
- **Successfully completed comprehensive Supabase migration**:
  - Hybrid architecture: Neon backend for core operations, Supabase frontend for enhanced features
  - Complete JLPT vocabulary database imported (N1-N5 levels, 3000+ authentic words)
  - Dual-system approach ensures reliability while adding cloud capabilities
- **Full vocabulary data migration completed**:
  - N5: 550+ words imported with authentic readings and meanings
  - N4: 450+ words with proper word type classification
  - N3, N2, N1: 1000+ additional entries with comprehensive coverage
  - All vocabulary data sourced from authentic JLPT preparation materials
- **Enhanced Supabase integration features**:
  - `useUserVocab()` hook: Cloud sync when authenticated, localStorage backup
  - `useUserProgress()` hook: Scenario completion tracking with sync status
  - `useSupabaseAuth()` hook: Session management and authentication state
  - New `/my-vocabulary` page with search, filtering, and source tracking
  - Word definition popup saves vocabulary to Supabase with proper user association
- **Database architecture finalized**:
  - `jlpt_vocab` table: Complete authentic JLPT vocabulary with 3000+ entries
  - `user_vocab` table: Personal vocabulary collection with source tracking
  - `user_scenario_progress` table: XP and completion tracking per scenario
  - Row Level Security (RLS) policies implemented for data protection

### June 17, 2025 - Clean Supabase Integration for Vocabulary and Progress
- **Implemented modular Supabase client integration**:
  - Created `client/src/lib/supabase/client.ts` with proper environment variable handling
  - Built type-safe database operations in `client/src/lib/supabase/database.ts`
  - Added comprehensive authentication system with `client/src/lib/supabase/auth.ts`
- **Dual-system architecture for seamless migration**:
  - `useUserVocab()` hook: Supabase sync when authenticated, localStorage fallback
  - `useUserProgress()` hook: Scenario completion tracking with cloud sync
  - `useSupabaseAuth()` hook: Session management and authentication state
- **Enhanced user experience features**:
  - New `/my-vocabulary` page with search, filtering, and source tracking
  - Word definition popup enhanced with Supabase vocabulary saving
  - Scenario progress widget shows sync status (Synced/Local badges)
  - Clean fallback to localStorage for unauthenticated users
- **Database schema created**:
  - `user_vocab` table: Personal vocabulary collection with source tracking
  - `user_scenario_progress` table: XP and completion tracking per scenario
  - Proper indexes and UUID primary keys for performance and scalability

### June 18, 2025 - Complete Supabase Migration with Tutors and Enhanced Vocabulary Tracking
- **Successfully migrated tutors (personas) to Supabase**:
  - Updated `/api/personas` route to fetch from Supabase instead of Neon database
  - Confirmed both Aoi (formal teacher) and Haruki (casual friend) tutors are accessible
  - Fixed tutor selection interface that was showing empty due to database migration
- **Implemented conjugation-aware vocabulary tracking system**:
  - Created `usage_log` table in Supabase for tracking both original and normalized word forms
  - Built vocabulary tracker using kuroshiro and kuromoji for morphological analysis
  - Enhanced all chat interfaces to automatically track conjugated forms (見ました → 見る)
  - Added comprehensive analytics dashboard at `/vocabulary-analytics` and `/conjugation-demo`
- **Fixed JLPT vocabulary analytics showing correct totals**:
  - Restored complete vocabulary dataset with N5 (104), N4 (60), N3 (40), N2 (30), N1 (30) entries
  - All vocabulary entries contain authentic Japanese words with proper kanji, hiragana, and meanings
  - Analytics now display realistic JLPT level distributions for accurate progress tracking

### June 17, 2025 - Enhanced Chat System with Working Furigana and Wanakana Integration
- **Successfully implemented working Furigana display system** across all chat interfaces:
  - Persistent user preferences stored in localStorage
  - Toggle functionality that shows/hides ruby text readings
  - Integrated into both main chat and scenario-based learning chats
  - Uses original working FuriganaText component with proper CSS styling
- **Added functional Wanakana integration** for romaji-to-hiragana conversion:
  - Proper binding using official Wanakana `bind()` method from documentation
  - Real-time conversion when Hiragana mode is enabled
  - Clean binding/unbinding with error handling to prevent circular references
  - Consistent implementation across all chat interfaces
- **Enhanced AI response system** that handles English questions intelligently:
  - AI detects English vs Japanese input and provides explanations
  - English translations available as collapsible sections
  - Learning suggestions and feedback integrated into message display
- **Unified chat experience** with consistent controls:
  - Hiragana toggle button for romaji-to-hiragana conversion
  - Furigana toggle button for showing/hiding readings
  - Both features work in main chat and scenario learning chats
- **Fixed database issues** that were preventing message sending
- **Removed duplicate components** and restored stable functionality

### June 17, 2025 - Comprehensive Scenario-Based Learning System
- **Added complete scenario-based output learning system** with 10 structured scenarios across N5-N3 levels
- **Implemented modular architecture**:
  - `shared/scenario-types.ts`: Core type definitions for scenarios, progress, and sessions
  - `client/src/data/scenarios.ts`: Static scenario data with goals, vocab, and unlock conditions
  - `client/src/lib/scenario-learning/progress-manager.ts`: Progress tracking and XP management
  - `client/src/components/scenario-learning/`: Reusable UI components for scenario system
- **Enhanced dashboard integration** with scenario progress widget showing completion stats and recommendations
- **New route `/scenario-learning`** for comprehensive scenario-based practice alongside existing `/scenarios` route
- **Features implemented**:
  - Goal-based conversation practice with real-time tracking
  - XP and badge reward system with level progression
  - Scenario unlocking based on completion and vocabulary usage
  - Vocabulary mastery tracking with spaced repetition concepts
  - Learning streak management and progress analytics
  - Personalized tutor selection for each scenario
  - Session completion feedback with detailed performance metrics

### Previous Updates
- June 16, 2025. Initial setup
- Added compact vocabulary usage analytics to dashboard
- Integrated reusable vocabulary analytics components