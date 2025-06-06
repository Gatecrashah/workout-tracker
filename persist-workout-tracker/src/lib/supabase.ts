import { createClient } from '@supabase/supabase-js'

// Environment variable validation
function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function validateSupabaseUrl(url: string): string {
  try {
    const parsedUrl = new URL(url)
    if (!parsedUrl.hostname.includes('supabase')) {
      throw new Error('URL does not appear to be a valid Supabase URL')
    }
    return url
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function validateSupabaseKey(key: string): string {
  // Basic validation for Supabase anon key format
  if (key.length < 100) {
    throw new Error('Supabase anon key appears to be too short')
  }
  if (!key.startsWith('eyJ')) {
    throw new Error('Supabase anon key does not appear to be in JWT format')
  }
  return key
}

// Get and validate environment variables
const supabaseUrl = validateSupabaseUrl(getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'))
const supabaseAnonKey = validateSupabaseKey(getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Updated types to match new schema
export type Program = {
  id: string
  name: string
  full_name: string
  week_title: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export type ProgramDay = {
  id: string
  program_id: string
  day_name: string
  date: string | null
  day_title: string | null
  coach_notes: string | null
  created_at: string
}

export type WorkoutSection = {
  id: string
  day_id: string
  section_type: string
  section_letter: string | null
  order_index: number
  duration: string | null
  format_type: string | null
  format_structure: string | null
  format_interval_seconds: number | null
  format_total_sets: number | null
  created_at: string
}

export type WorkoutComponent = {
  id: string
  section_id: string
  component_type: string // 'single_exercise', 'single_lift', 'superset', 'circuit', 'complex'
  order_index: number
  rounds: number | null
  transition: string | null
  loading_note: string | null
  progression_note: string | null
  intention_note: string | null
  created_at: string
}

export type Exercise = {
  id: string
  component_id: string
  name: string
  order_index: number
  sets_reps: string | null
  tempo: string | null
  rpe: string | null
  duration: string | null
  rest_after: string | null
  track_weight: boolean
  alternatives: string[] | null
  loading_note: string | null
  progression_note: string | null
  notes: string | null
  // For single_lift detailed structure
  set_type: string | null
  set_number: number | null
  set_range: string | null
  created_at: string
}

export type ExerciseLog = {
  id: string
  exercise_id: string
  weight: number | null
  reps: number | null
  completed: boolean
  logged_at: string
  notes: string | null
}

export type WorkoutCompletion = {
  id: string
  day_id: string
  completed_at: string
  total_exercises: number | null
  completed_exercises: number | null
  notes: string | null
}

// Extended types for UI components
export type WorkoutSectionWithExercises = WorkoutSection & {
  exercises: Exercise[]
}

export type ProgramDayWithSections = ProgramDay & {
  workout_sections: WorkoutSectionWithExercises[]
}

export type ProgramOption = {
  name: string
  full_name: string
}

// Validation result types
export type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    totalPrograms?: number
    programNames?: string[]
    totalDays?: number
    totalSections?: number
    totalComponents?: number
    totalExercises?: number
    weekInfo?: {
      title?: string
      startDate?: string
      endDate?: string
    }
    sourceFile?: string
    importStats?: {
      programs: number
      days: number
      sections: number
      components: number
      exercises: number
    }
  }
}