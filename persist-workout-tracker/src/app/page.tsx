'use client'

import { useMemo } from 'react'
import { ProgramOption } from '@/lib/supabase'
import { useWorkoutData } from '@/hooks/useWorkoutData'
import { useProgramSelection } from '@/hooks/useProgramSelection'
import AppLayout from '@/components/layout/AppLayout'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import ProgramSwitcher from '@/components/ui/ProgramSwitcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Circle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function HomePage() {
  const { selectedProgram, selectedDate, handleProgramSelect, handleDateSelect } = useProgramSelection()
  const { programs, todayWorkout, loading, error, refetch } = useWorkoutData(selectedProgram, selectedDate)

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
                    <p className="text-sm text-gray-700">{todayWorkout.coach_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Workout Sections */}
              {todayWorkout.workout_sections?.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {section.section_letter && (
                          <Badge variant="outline" className="mr-2">
                            {section.section_letter}
                          </Badge>
                        )}
                        {section.section_type}
                      </CardTitle>
                      {/* Progress indicator could go here */}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {section.exercises?.map((exercise) => (
                        <div key={exercise.id} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                              {exercise.sets_reps && (
                                <p className="text-sm text-gray-600 mt-1">{exercise.sets_reps}</p>
                              )}
                              {exercise.tempo && (
                                <p className="text-xs text-gray-500">Tempo: {exercise.tempo}</p>
                              )}
                              {exercise.rpe && (
                                <p className="text-xs text-gray-500">RPE: {exercise.rpe}</p>
                              )}
                            </div>
                            
                            {/* Weight logging placeholder */}
                            <div className="flex items-center space-x-2 ml-4">
                              <div className="text-xs text-gray-400">
                                Last: 135lbs × 8
                              </div>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Circle size={20} className="text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
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