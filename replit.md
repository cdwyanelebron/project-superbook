# Project Superbook

## Overview

Project Superbook is a cross-platform mobile application designed to deliver Bible stories for Filipino children aged 5-12 years old. The app presents content with English titles and Tagalog translations, featuring a child-friendly, educational design with bright and inviting colors. The application supports iOS, Android, and web platforms through Expo/React Native.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (new architecture enabled)
- **Navigation**: React Navigation v7 with a hybrid structure:
  - Root Stack Navigator containing Main Tab Navigator
  - Bottom Tab Navigator with 3 tabs: Home, Library, Profile
  - Each tab contains its own Stack Navigator for nested navigation
  - Book Reader screens presented as full-screen modals
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: StyleSheet-based styling with a centralized theme system in `client/constants/theme.ts`
- **Animations**: React Native Reanimated for smooth, performant animations
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with tsx for development execution
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **CORS**: Dynamic origin handling based on Replit environment variables
- **Storage**: In-memory storage implementation with interface abstraction (`IStorage`) allowing easy swap to database

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`
- **Current Storage**: Memory-based (`MemStorage` class) - PostgreSQL ready when provisioned

### Build & Development
- **Development**: Parallel execution of Expo dev server and Express server
- **Static Build**: Custom build script at `scripts/build.js` for production web builds
- **Server Build**: esbuild for bundling server code to ESM format

## External Dependencies

### Core Services
- **Database**: PostgreSQL (via `DATABASE_URL` environment variable, using Drizzle ORM)
- **Expo Services**: Splash screen, blur effects, haptics, image handling, web browser integration

### Third-Party Libraries
- **React Query**: Server state management and caching
- **React Navigation**: Full navigation suite (native stack, bottom tabs)
- **AsyncStorage**: Local data persistence for bookmarks and reading progress
- **WebView**: PDF rendering for book content
- **Reanimated**: Animation library for gesture and transition effects
- **Keyboard Controller**: Enhanced keyboard handling for forms

### Content Delivery
- **Book PDFs**: Hosted on Google Drive with direct download URLs
- **Images**: Local asset images for featured books stored in `assets/generated_images/`

### Environment Configuration
- `EXPO_PUBLIC_DOMAIN`: Public domain for API calls
- `REPLIT_DEV_DOMAIN`: Development domain for Expo packager
- `REPLIT_DOMAINS`: Comma-separated list of allowed CORS origins
- `DATABASE_URL`: PostgreSQL connection string