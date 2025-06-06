# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run lint` - Run ESLint linting
- `npm start` - Start production server

## Architecture Overview

This is a Next.js 15 workout tracking application for "Persist" fitness programs with Supabase backend integration.

### Core Data Model
The app models workout programs with a hierarchical structure:
- **Programs** (e.g., "PUMP LIFT") contain multiple days
- **Program Days** (Monday, Tuesday, etc.) contain workout sections  
- **Workout Sections** (e.g., "Warm-up", "A") contain components
- **Workout Components** represent exercise groupings (single exercise, superset, circuit, etc.)
- **Exercises** are the individual movements with sets/reps/tempo/RPE

### Key Application Structure

**Data Layer:**
- `src/lib/supabase.ts` - Supabase client and TypeScript types for all database entities
- `src/lib/storage.ts` - Local storage utilities for session persistence (selected program, date, workout progress)
- `src/lib/importWorkoutData.ts` - JSON import system for bulk workout data with validation

**Pages:**
- `src/app/page.tsx` - Main workout tracker interface with program switching and daily workout display
- `src/app/admin/page.tsx` - Administrative interface for JSON data import

**Components:**
- `src/components/layout/AppLayout.tsx` - Main application layout wrapper
- `src/components/ui/WeeklyCalendar.tsx` - Date selection calendar highlighting workout days
- `src/components/ui/ProgramSwitcher.tsx` - Dropdown for switching between workout programs
- `src/components/ui/AdminJsonImport.tsx` - Interface for importing structured workout JSON data

### State Management
- Uses React state with localStorage persistence
- Selected program and date persist across sessions
- Exercise completion and weight logging implemented with database persistence

### Import System
The app includes a JSON import system (`src/lib/importWorkoutData.ts`) that can process structured workout data. The JSON format supports complex workout structures including supersets, circuits, and detailed set progressions for single lifts. The import handles:
- Component-based exercise organization (single_exercise, superset, circuit, single_lift)
- Exercise parameters (sets/reps, tempo, RPE, duration, rest periods)
- Loading and progression notes at both component and exercise levels
- Exercise alternatives and detailed formatting

### Database Schema
Uses Supabase with tables: programs, program_days, workout_sections, workout_components, exercises, exercise_logs, workout_completions. Foreign key relationships maintain data integrity across the hierarchical structure.

**Key Tables:**
- `exercise_logs` - Tracks exercise completion, weight, reps, and notes
- `workout_completions` - Records when full workout days are completed
- `exercises` - Individual exercises with `track_weight` boolean for weight logging
- `workout_components` - Groups exercises by type (superset, circuit, etc.)

### Recent Updates
- **JSON Import System**: Fixed to handle complex component structures with proper exercise extraction
- **Database Schema**: Updated `format_total_sets` to text type to preserve range values ("2-3", "3-4")
- **UI Enhancement**: Improved workout display with section duration, component types, exercise details, and notes
- **Data Structure**: Supports the full hierarchy: sections → components → exercises with proper TypeScript types

### Planned Features
- **Exercise Completion Tracking**: Checkbox interface for marking exercises complete
- **Weight Logging**: Input fields for tracking weights and reps on single lifts  
- **Workout Progress**: Real-time progress indicators and completion statistics
- **History Page**: Basic analytics and weight progression tracking
- **Authentication**: Simple single-user login system