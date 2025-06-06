import { useState, useCallback } from 'react'
import { supabase, ExerciseLog } from '@/lib/supabase'

export interface ExerciseCompletionData {
  exerciseId: string
  completed: boolean
  weight?: number
  reps?: number
  notes?: string
}

export interface UseExerciseCompletionReturn {
  exerciseLogs: Record<string, ExerciseLog>
  isLoading: boolean
  error: string | null
  toggleExerciseCompletion: (exerciseId: string) => Promise<void>
  updateExerciseLog: (data: ExerciseCompletionData) => Promise<void>
  getExerciseLog: (exerciseId: string) => ExerciseLog | null
  loadExerciseLogsForDay: (dayId: string) => Promise<void>
  getPreviousExerciseLog: (exerciseId: string) => Promise<ExerciseLog | null>
}

export function useExerciseCompletion(): UseExerciseCompletionReturn {
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all exercise logs for a specific workout day
  const loadExerciseLogsForDay = useCallback(async (dayId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get all exercises for this day
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
      
      if (exercisesError) {
        throw exercisesError
      }

      if (!exercises || exercises.length === 0) {
        setExerciseLogs({})
        return
      }

      const exerciseIds = exercises.map(e => e.id)

      // Get existing exercise logs for these exercises
      const { data: logs, error: logsError } = await supabase
        .from('exercise_logs')
        .select('*')
        .in('exercise_id', exerciseIds)
      
      if (logsError) {
        throw logsError
      }

      // Create a map of exercise logs by exercise_id
      const logsMap: Record<string, ExerciseLog> = {}
      logs?.forEach(log => {
        logsMap[log.exercise_id] = log
      })

      setExerciseLogs(logsMap)
    } catch (err) {
      console.error('Error loading exercise logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load exercise logs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Toggle exercise completion status
  const toggleExerciseCompletion = useCallback(async (exerciseId: string) => {
    setError(null)
    
    try {
      const existingLog = exerciseLogs[exerciseId]
      const newCompletedStatus = !existingLog?.completed

      if (existingLog) {
        // Update existing log
        const { data, error } = await supabase
          .from('exercise_logs')
          .update({ 
            completed: newCompletedStatus,
            logged_at: new Date().toISOString()
          })
          .eq('id', existingLog.id)
          .select()
          .single()

        if (error) throw error

        setExerciseLogs(prev => ({
          ...prev,
          [exerciseId]: data
        }))
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('exercise_logs')
          .insert({
            exercise_id: exerciseId,
            completed: newCompletedStatus,
            logged_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        setExerciseLogs(prev => ({
          ...prev,
          [exerciseId]: data
        }))
      }
    } catch (err) {
      console.error('Error toggling exercise completion:', err)
      setError(err instanceof Error ? err.message : 'Failed to update exercise')
    }
  }, [exerciseLogs])

  // Update exercise log with weight, reps, notes
  const updateExerciseLog = useCallback(async (data: ExerciseCompletionData) => {
    setError(null)
    
    try {
      const existingLog = exerciseLogs[data.exerciseId]
      
      const logData = {
        exercise_id: data.exerciseId,
        completed: data.completed,
        weight: data.weight || null,
        reps: data.reps || null,
        notes: data.notes || null,
        logged_at: new Date().toISOString()
      }

      if (existingLog) {
        // Update existing log
        const { data: updatedLog, error } = await supabase
          .from('exercise_logs')
          .update(logData)
          .eq('id', existingLog.id)
          .select()
          .single()

        if (error) throw error

        setExerciseLogs(prev => ({
          ...prev,
          [data.exerciseId]: updatedLog
        }))
      } else {
        // Create new log
        const { data: newLog, error } = await supabase
          .from('exercise_logs')
          .insert(logData)
          .select()
          .single()

        if (error) throw error

        setExerciseLogs(prev => ({
          ...prev,
          [data.exerciseId]: newLog
        }))
      }
    } catch (err) {
      console.error('Error updating exercise log:', err)
      setError(err instanceof Error ? err.message : 'Failed to update exercise log')
    }
  }, [exerciseLogs])

  // Get exercise log for a specific exercise
  const getExerciseLog = useCallback((exerciseId: string) => {
    return exerciseLogs[exerciseId] || null
  }, [exerciseLogs])

  // Get the most recent previous exercise log for weight/reps suggestions
  const getPreviousExerciseLog = useCallback(async (exerciseId: string): Promise<ExerciseLog | null> => {
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('exercise_id', exerciseId)
        .not('weight', 'is', null)
        .not('reps', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      return data || null
    } catch (err) {
      console.error('Error fetching previous exercise log:', err)
      return null
    }
  }, [])

  return {
    exerciseLogs,
    isLoading,
    error,
    toggleExerciseCompletion,
    updateExerciseLog,
    getExerciseLog,
    loadExerciseLogsForDay,
    getPreviousExerciseLog
  }
}