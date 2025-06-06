'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { ProgramOption } from '@/lib/supabase'

interface ProgramSwitcherProps {
  programs: ProgramOption[]
  selected: string
  onSelect: (programName: string) => void
}

function ProgramSwitcher({ programs, selected, onSelect }: ProgramSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedProgram = useMemo(() => 
    programs.find(p => p.name === selected), 
    [programs, selected]
  )

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleSelect = useCallback((programName: string) => {
    onSelect(programName)
    setIsOpen(false)
  }, [onSelect])

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm">
          {selectedProgram?.name || 'PUMP LIFT'}
        </span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[140px]">
          {programs.map((program) => (
            <button
              key={program.name}
              onClick={() => handleSelect(program.name)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                program.name === selected ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
            >
              {program.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Export memoized component to prevent unnecessary re-renders
export default memo(ProgramSwitcher)