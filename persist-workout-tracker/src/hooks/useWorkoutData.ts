import { useState, useEffect, useCallback } from 'react'
import { supabase, Program, ProgramDayWithSections } from '@/lib/supabase'

export function useWorkoutData(selectedProgram: string, selectedDate: Date) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [todayWorkout, setTodayWorkout] = useState<ProgramDayWithSections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrograms = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      setError('Failed to load workout programs. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTodayWorkout = useCallback(async () => {
    try {
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
      const program = programs.find(p => p.name === selectedProgram)
      
      if (!program) return


      // Fetch today's workout
      const { data: dayData, error: dayError } = await supabase
        .from('program_days')
        .select(`
          *,
          workout_sections (
            *,
            workout_components (
              *,
              exercises (*)
            )
          )
        `)
        .eq('program_id', program.id)
        .eq('day_name', dayName)
        .single()

      if (dayError) {
        setTodayWorkout(null)
        return
      }

      setTodayWorkout(dayData)
    } catch (error) {
      console.error('Error fetching today workout:', error)
      setTodayWorkout(null)
      // Don't set error state here as missing workout data is expected for rest days
    }
  }, [selectedProgram, selectedDate, programs])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  useEffect(() => {
    if (programs.length > 0) {
      fetchTodayWorkout()
    }
  }, [fetchTodayWorkout, programs.length])

  return {
    programs,
    todayWorkout,
    loading,
    error,
    refetch: fetchPrograms
  }
}