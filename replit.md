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
- **Neon Database** as the serverless PostgreSQL provider
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
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Fonts**: Inter and Noto Sans JP font families

### Core Libraries
- **@neondatabase/serverless**: Database connection pooling
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

## Changelog

Changelog:
- June 16, 2025. Initial setup