'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyCalendarProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  workoutDays?: string[] // ['Monday', 'Tuesday', 'Friday']
}

function WeeklyCalendar({ selectedDate, onDateSelect, workoutDays = [] }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])

  const generateWeek = useCallback((centerDate: Date) => {
    const week = []
    const startOfWeek = new Date(centerDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Monday start
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date)
    }
    
    setCurrentWeek(week)
  }, [])

  useEffect(() => {
    generateWeek(selectedDate)
  }, [selectedDate, generateWeek])

  // Memoize these functions to avoid recreating them on every render
  const isToday = useCallback((date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }, [])

  const isSelected = useCallback((date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }, [selectedDate])

  const hasWorkout = useCallback((date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    return workoutDays.includes(dayName)
  }, [workoutDays])

  // Memoize static data
  const dayNames = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [])

  const handlePrevWeek = useCallback(() => {
    const prevWeek = new Date(currentWeek[0])
    prevWeek.setDate(prevWeek.getDate() - 7)
    generateWeek(prevWeek)
  }, [currentWeek, generateWeek])

  const handleNextWeek = useCallback(() => {
    const nextWeek = new Date(currentWeek[6])
    nextWeek.setDate(nextWeek.getDate() + 1)
    generateWeek(nextWeek)
  }, [currentWeek, generateWeek])

  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-sm">
      <button
        onClick={handlePrevWeek}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex space-x-1">
        {currentWeek.map((date, index) => (
          <button
            key={date.toISOString()}
            onClick={() => onDateSelect(date)}
            className={`flex flex-col items-center p-2 rounded-lg min-w-[40px] text-xs transition-colors ${
              isSelected(date)
                ? 'bg-blue-600 text-white'
                : isToday(date)
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">{dayNames[index]}</span>
            <span className="text-xs">{date.getDate()}</span>
            {hasWorkout(date) && (
              <div className={`w-1 h-1 rounded-full mt-1 ${
                isSelected(date) ? 'bg-white' : 'bg-blue-500'
              }`} />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleNextWeek}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders
export default memo(WeeklyCalendar)