import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface UseWorkoutCompletionReturn {
  isLoading: boolean
  error: string | null
  completeWorkout: (dayId: string) => Promise<void>
  isWorkoutCompleted: (dayId: string) => Promise<boolean>
}

export function useWorkoutCompletion(): UseWorkoutCompletionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completeWorkout = useCallback(async (dayId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if workout completion already exists
      const { data: existingCompletion, error: checkError } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('day_id', dayId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError
      }

      if (!existingCompletion) {
        // Create new workout completion record
        const { error: insertError } = await supabase
          .from('workout_completions')
          .insert({
            day_id: dayId,
            completed_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      }

      // Get all exercises for this day using proper join
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select(`
          id,
          workout_components!inner (
            workout_sections!inner (
              day_id
            )
          )
        `)
        .eq('workout_components.workout_sections.day_id', dayId)
      
      if (exercisesError) throw exercisesError

      if (!exercises || exercises.length === 0) {
        return // No exercises to complete
      }

      const exerciseIds = exercises.map(e => e.id)

      // Get existing exercise logs for these exercises
      const { data: existingLogs, error: logsError } = await supabase
        .from('exercise_logs')
        .select('exercise_id, completed')
        .in('exercise_id', exerciseIds)
      
      if (logsError) throw logsError

      // Find exercises that don't have completed logs
      const completedExerciseIds = new Set(
        existingLogs?.filter(log => log.completed).map(log => log.exercise_id) || []
      )
      
      const exercisesToComplete = exercises.filter(exercise => 
        !completedExerciseIds.has(exercise.id)
      )

      if (exercisesToComplete.length > 0) {
        const exerciseLogsToInsert = exercisesToComplete.map(exercise => ({
          exercise_id: exercise.id,
          completed: true,
          logged_at: new Date().toISOString()
        }))

        const { error: insertLogsError } = await supabase
          .from('exercise_logs')
          .insert(exerciseLogsToInsert)

        if (insertLogsError) throw insertLogsError
      }

    } catch (err) {
      console.error('Error completing workout:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete workout')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const isWorkoutCompleted = useCallback(async (dayId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('day_id', dayId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (err) {
      console.error('Error checking workout completion:', err)
      return false
    }
  }, [])

  return {
    isLoading,
    error,
    completeWorkout,
    isWorkoutCompleted
  }
}