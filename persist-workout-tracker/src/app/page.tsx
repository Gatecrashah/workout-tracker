'use client'

import { useMemo, useEffect } from 'react'
import { ProgramOption } from '@/lib/supabase'
import { useWorkoutData } from '@/hooks/useWorkoutData'
import { useProgramSelection } from '@/hooks/useProgramSelection'
import { useExerciseCompletion } from '@/hooks/useExerciseCompletion'
import { useWorkoutCompletion } from '@/hooks/useWorkoutCompletion'
import AppLayout from '@/components/layout/AppLayout'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import ProgramSwitcher from '@/components/ui/ProgramSwitcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import WeightRepsInput from '@/components/ui/WeightRepsInput'
import { Clock, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  const { selectedProgram, selectedDate, handleProgramSelect, handleDateSelect } = useProgramSelection()
  const { programs, todayWorkout, loading, error, refetch } = useWorkoutData(selectedProgram, selectedDate)
  const exerciseCompletion = useExerciseCompletion()
  const workoutCompletion = useWorkoutCompletion()

  // Load exercise logs when workout changes
  useEffect(() => {
    if (todayWorkout?.id) {
      exerciseCompletion.loadExerciseLogsForDay(todayWorkout.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayWorkout?.id])

  // Get workout days for calendar (memoized for performance)
  const workoutDays = useMemo(() => {
    // This would be populated from your data
    return ['Monday', 'Tuesday', 'Wednesday', 'Friday'] // Example
  }, [])

  // Memoize program options for better performance
  const programOptions: ProgramOption[] = useMemo(() => 
    programs.map(p => ({ name: p.name, full_name: p.full_name })), 
    [programs]
  )

  const todayStr = useMemo(() => 
    selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    }), 
    [selectedDate]
  )

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Unable to Load Data</h2>
              <p className="text-gray-600">{error}</p>
            </div>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Exercise Completion Error Display */}
        {exerciseCompletion.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Exercise tracking error: {exerciseCompletion.error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Completion Error Display */}
        {workoutCompletion.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Workout completion error: {workoutCompletion.error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with Program Switcher and Calendar */}
        <div className="flex justify-between items-start space-x-4">
          <ProgramSwitcher
            programs={programOptions}
            selected={selectedProgram}
            onSelect={handleProgramSelect}
          />
          
          <WeeklyCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            workoutDays={workoutDays}
          />
        </div>

        {/* Today's Workout */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Today&apos;s Workout
          </h1>
          <p className="text-gray-600">{todayStr}</p>

          {todayWorkout ? (
            <div className="space-y-4">
              {/* Coach Notes */}
              {todayWorkout.coach_notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700">Coach Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-700">
                      {todayWorkout.coach_notes.split('\n\n').map((paragraph, index) => (
                        <p key={index} className={index > 0 ? 'mt-4' : ''}>
                          {paragraph.replace(/\n/g, ' ')}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Workout Sections */}
              {todayWorkout.workout_sections?.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {section.section_letter && (
                            <Badge variant="outline" className="mr-2">
                              {section.section_letter}
                            </Badge>
                          )}
                          {section.section_type}
                          {section.duration && (
                            <span className="ml-2 text-base font-normal text-gray-600">⏱️ {section.duration}</span>
                          )}
                        </CardTitle>
                        {(section.format_structure || section.format_total_sets) && (
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {section.format_structure && (
                              <span>{section.format_structure}</span>
                            )}
                            {section.format_total_sets && (
                              <span>{section.format_total_sets} sets</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Progress indicator could go here */}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.workout_components?.map((component) => (
                        <div key={component.id} className="space-y-1">
                          {/* Component header with type and notes */}
                          {(component.component_type !== 'single_exercise' || component.loading_note || component.progression_note) && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {component.component_type}
                                </Badge>
                                {component.rounds && (
                                  <span className="text-xs text-gray-600">
                                    {component.rounds} rounds
                                  </span>
                                )}
                                {component.transition && (
                                  <span className="text-xs text-gray-600">
                                    → {component.transition}
                                  </span>
                                )}
                              </div>
                              {component.loading_note && (
                                <div className="text-xs text-gray-700 mb-1">
                                  <strong>Loading Note:</strong> {component.loading_note}
                                </div>
                              )}
                              {component.progression_note && (
                                <div className="text-xs text-gray-700">
                                  <strong>Progression Note:</strong> {component.progression_note}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Exercises in this component */}
                          <div className="space-y-1">
                            {component.exercises?.map((exercise, exerciseIndex) => (
                              <div key={exercise.id} className="border-l-4 border-blue-200 pl-4 py-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <div className="flex items-center">
                                        <input
                                          type="checkbox"
                                          id={`exercise-${exercise.id}`}
                                          checked={exerciseCompletion.getExerciseLog(exercise.id)?.completed || false}
                                          onChange={() => exerciseCompletion.toggleExerciseCompletion(exercise.id)}
                                          disabled={exerciseCompletion.isLoading}
                                          className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50"
                                          aria-label={`Mark ${exercise.name} as complete`}
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 flex-1">
                                        <h4 className={`font-medium ${exerciseCompletion.getExerciseLog(exercise.id)?.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                          {exercise.name}
                                        </h4>
                                        {component.exercises && component.exercises.length > 1 && (
                                          <Badge variant="outline" className="text-xs">
                                            {exerciseIndex + 1}
                                          </Badge>
                                        )}
                                        {exerciseCompletion.getExerciseLog(exercise.id)?.completed && (
                                          <Badge variant="default" className="text-xs bg-green-500 text-white">
                                            Complete
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Exercise parameters */}
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-1">
                                      {exercise.sets_reps && (
                                        <div>{exercise.sets_reps}</div>
                                      )}
                                      {exercise.tempo && (
                                        <div>Tempo: {exercise.tempo}</div>
                                      )}
                                      {exercise.rpe && (
                                        <div>RPE: {exercise.rpe}</div>
                                      )}
                                      {exercise.duration && (
                                        <div>{exercise.duration}</div>
                                      )}
                                      {exercise.rest_after && (
                                        <div>Rest: {exercise.rest_after}</div>
                                      )}
                                    </div>

                                    {/* Exercise notes */}
                                    {(exercise.loading_note || exercise.progression_note || exercise.notes) && (
                                      <div className="space-y-1">
                                        {exercise.loading_note && (
                                          <div className="text-xs text-gray-600">
                                            <strong>Loading Note:</strong> {exercise.loading_note}
                                          </div>
                                        )}
                                        {exercise.progression_note && (
                                          <div className="text-xs text-gray-600">
                                            <strong>Progression Note:</strong> {exercise.progression_note}
                                          </div>
                                        )}
                                        {exercise.notes && (
                                          <div className="text-xs text-gray-600">
                                            <strong>Notes:</strong> {exercise.notes}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Alternatives */}
                                    {exercise.alternatives && exercise.alternatives.length > 0 && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        <strong>Alternatives:</strong> {exercise.alternatives.join(', ')}
                                      </div>
                                    )}

                                    {/* Weight and Reps Input */}
                                    <WeightRepsInput
                                      exerciseId={exercise.id}
                                      exerciseName={exercise.name}
                                      trackWeight={exercise.track_weight}
                                      sectionType={section.section_type}
                                      componentType={component.component_type}
                                      exerciseLog={exerciseCompletion.getExerciseLog(exercise.id)}
                                      onUpdate={exerciseCompletion.updateExerciseLog}
                                      isLoading={exerciseCompletion.isLoading}
                                      getPreviousExerciseLog={exerciseCompletion.getPreviousExerciseLog}
                                    />
                                  </div>
                                  
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Complete Workout Button */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Complete Workout</h3>
                    <p className="text-sm text-green-700 mb-4">
                      Mark this entire workout as complete when you&apos;re done or need to finish early.
                    </p>
                    <button
                      onClick={async () => {
                        if (todayWorkout?.id) {
                          await workoutCompletion.completeWorkout(todayWorkout.id)
                          // Refresh exercise logs to show completed state
                          if (!workoutCompletion.error) {
                            await exerciseCompletion.loadExerciseLogsForDay(todayWorkout.id)
                          }
                        }
                      }}
                      disabled={workoutCompletion.isLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {workoutCompletion.isLoading ? 'Completing...' : 'Complete Workout'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rest Day</h3>
                  <p className="text-gray-600">No workout scheduled for {todayStr}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}