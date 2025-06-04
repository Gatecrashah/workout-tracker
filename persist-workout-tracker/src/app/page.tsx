'use client'

import { useEffect, useState } from 'react'
import { supabase, Program, ProgramDay, WorkoutSection, Exercise } from '@/lib/supabase'
import { storage } from '@/lib/storage'
import AppLayout from '@/components/layout/AppLayout'
import WeeklyCalendar from '@/components/ui/WeeklyCalendar'
import ProgramSwitcher from '@/components/ui/ProgramSwitcher'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

export default function HomePage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('PUMP LIFT')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [todayWorkout, setTodayWorkout] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeApp()
  }, [])

  useEffect(() => {
    if (programs.length > 0) {
      fetchTodayWorkout()
      
    }
  }, [selectedProgram, selectedDate, programs])

  async function initializeApp() {
    // Restore saved state
    const savedProgram = storage.getSelectedProgram()
    const savedDate = storage.getSelectedDate()
    
    if (savedProgram) {
      setSelectedProgram(savedProgram)
    }
    
    if (savedDate) {
      setSelectedDate(new Date(savedDate))
    }

    // Fetch programs
    await fetchPrograms()
  }

  async function fetchPrograms() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTodayWorkout() {
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
            exercises (*)
          )
        `)
        .eq('program_id', program.id)
        .eq('day_name', dayName)
        .single()

      if (dayError) {
        console.log('No workout for today:', dayError)
        setTodayWorkout(null)
        return
      }

      setTodayWorkout(dayData)
    } catch (error) {
      console.error('Error fetching today workout:', error)
      setTodayWorkout(null)
    }
  }

  const handleProgramSelect = (programName: string) => {
    setSelectedProgram(programName)
    storage.setSelectedProgram(programName)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    storage.setSelectedDate(date.toISOString())
  }

  // Get workout days for calendar
  const getWorkoutDays = () => {
    // This would be populated from your data
    return ['Monday', 'Tuesday', 'Wednesday', 'Friday'] // Example
  }

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

  const programOptions = programs.map(p => ({ name: p.name, full_name: p.full_name }))
  const todayStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  })

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
            workoutDays={getWorkoutDays()}
          />
        </div>

        {/* Today's Workout */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Today's Workout
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
              {todayWorkout.workout_sections?.map((section: any, index: number) => (
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
                      {section.exercises?.map((exercise: any) => (
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