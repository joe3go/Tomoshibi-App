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

### June 17, 2025 - Successful Migration to Supabase Database
- **Completed full database migration from Neon to Supabase**:
  - All existing data preserved: 2 users, 32 conversations, 14,558 vocabulary entries
  - Updated schema alignment between code and Supabase database structure
  - Fixed grammar table column mapping (englishExplanation, exampleJapanese, exampleEnglish)
  - Verified all API endpoints working correctly with Supabase connection
- **Database performance verified**:
  - Authentication system functioning properly
  - Conversation and message retrieval working seamlessly
  - Vocabulary tracking and analytics operational
  - All user progress data intact and accessible
- **Updated project documentation** to reflect Supabase as the primary database provider

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