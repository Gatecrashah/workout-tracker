import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export function useProgramSelection() {
  const [selectedProgram, setSelectedProgram] = useLocalStorage<string>('selectedProgram', 'PUMP LIFT')
  const [selectedDate, setSelectedDate] = useLocalStorage<string>('selectedDate', new Date().toISOString())

  const handleProgramSelect = useCallback((programName: string) => {
    setSelectedProgram(programName)
  }, [setSelectedProgram])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date.toISOString())
  }, [setSelectedDate])

  const parsedSelectedDate = new Date(selectedDate)

  return {
    selectedProgram,
    selectedDate: parsedSelectedDate,
    handleProgramSelect,
    handleDateSelect
  }
}