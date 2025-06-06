import { useMemo } from 'react'
import { ProgramDayWithSections, ExerciseLog } from '@/lib/supabase'

export interface WorkoutProgress {
  totalExercises: number
  completedExercises: number
  completionPercentage: number
  sectionProgress: Array<{
    sectionId: string
    sectionName: string
    totalExercises: number
    completedExercises: number
    completionPercentage: number
  }>
}

export function useWorkoutProgress(
  workout: ProgramDayWithSections | null,
  exerciseLogs: Record<string, ExerciseLog>
): WorkoutProgress {
  return useMemo(() => {
    if (!workout || !workout.workout_sections) {
      return {
        totalExercises: 0,
        completedExercises: 0,
        completionPercentage: 0,
        sectionProgress: []
      }
    }

    let totalExercises = 0
    let completedExercises = 0
    const sectionProgress = []

    for (const section of workout.workout_sections) {
      let sectionTotal = 0
      let sectionCompleted = 0

      if (section.workout_components) {
        for (const component of section.workout_components) {
          if (component.exercises) {
            for (const exercise of component.exercises) {
              sectionTotal++
              totalExercises++
              
              const exerciseLog = exerciseLogs[exercise.id]
              if (exerciseLog?.completed) {
                sectionCompleted++
                completedExercises++
              }
            }
          }
        }
      }

      const sectionCompletionPercentage = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0

      sectionProgress.push({
        sectionId: section.id,
        sectionName: section.section_letter 
          ? `${section.section_letter} - ${section.section_type}` 
          : section.section_type,
        totalExercises: sectionTotal,
        completedExercises: sectionCompleted,
        completionPercentage: sectionCompletionPercentage
      })
    }

    const overallCompletionPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

    return {
      totalExercises,
      completedExercises,
      completionPercentage: overallCompletionPercentage,
      sectionProgress
    }
  }, [workout, exerciseLogs])
}