// Local storage utilities for session persistence
export const storage = {
  // Program selection persistence
  getSelectedProgram: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedProgram')
    }
    return null
  },
  
  setSelectedProgram: (programName: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedProgram', programName)
    }
  },
  
  // Current date persistence (for navigation)
  getSelectedDate: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedDate')
    }
    return null
  },
  
  setSelectedDate: (date: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedDate', date)
    }
  },
  
  // Workout progress persistence
  getWorkoutProgress: (dayId: string) => {
    if (typeof window !== 'undefined') {
      const progress = localStorage.getItem(`workout_${dayId}`)
      return progress ? JSON.parse(progress) : {}
    }
    return {}
  },
  
  setWorkoutProgress: (dayId: string, progress: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`workout_${dayId}`, JSON.stringify(progress))
    }
  }
}