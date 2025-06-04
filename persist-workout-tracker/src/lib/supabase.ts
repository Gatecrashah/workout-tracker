import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types (we'll expand these later)
export type Program = {
  id: string
  name: string
  full_name: string
  week_title: string | null
  start_date: string | null
  end_date: string | null
}

export type ProgramDay = {
  id: string
  program_id: string
  day_name: string
  date: string | null
  day_title: string | null
  coach_notes: string | null
}

export type WorkoutSection = {
  id: string
  day_id: string
  section_type: string
  section_letter: string | null
  order_index: number
}

export type Exercise = {
  id: string
  section_id: string
  name: string
  sets_reps: string | null
  tempo: string | null
  rpe: string | null
  loading: string | null
  notes: string | null
  order_index: number
}