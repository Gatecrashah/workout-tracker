'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface ProgramSwitcherProps {
  programs: Array<{ name: string; full_name: string }>
  selected: string
  onSelect: (programName: string) => void
}

export default function ProgramSwitcher({ programs, selected, onSelect }: ProgramSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedProgram = programs.find(p => p.name === selected)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
              onClick={() => {
                onSelect(program.name)
                setIsOpen(false)
              }}
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