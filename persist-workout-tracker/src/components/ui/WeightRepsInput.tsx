'use client'

import React, { useState, useEffect } from 'react'
import { ExerciseLog } from '@/lib/supabase'
import { ExerciseCompletionData } from '@/hooks/useExerciseCompletion'

interface WeightRepsInputProps {
  exerciseId: string
  exerciseName: string
  trackWeight: boolean
  sectionType: string
  componentType: string
  exerciseLog: ExerciseLog | null
  onUpdate: (data: ExerciseCompletionData) => Promise<void>
  isLoading: boolean
  getPreviousExerciseLog: (exerciseId: string) => Promise<ExerciseLog | null>
}

export default function WeightRepsInput({
  exerciseId,
  exerciseName,
  trackWeight,
  sectionType,
  componentType,
  exerciseLog,
  onUpdate,
  isLoading,
  getPreviousExerciseLog
}: WeightRepsInputProps) {
  const [weight, setWeight] = useState<string>('')
  const [reps, setReps] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [previousLog, setPreviousLog] = useState<ExerciseLog | null>(null)

  // Fetch previous exercise log when component mounts
  useEffect(() => {
    if (trackWeight && !exerciseLog) {
      getPreviousExerciseLog(exerciseId).then(setPreviousLog)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId, trackWeight, exerciseLog])

  // Initialize form values from exercise log
  useEffect(() => {
    if (exerciseLog) {
      setWeight(exerciseLog.weight?.toString() || '')
      setReps(exerciseLog.reps?.toString() || '')
      setNotes(exerciseLog.notes || '')
    } else if (previousLog) {
      // Set previous values if available
      setWeight(previousLog.weight?.toString() || '')
      setReps(previousLog.reps?.toString() || '')
      setNotes('')
    }
    setHasUnsavedChanges(false)
  }, [exerciseLog, previousLog])

  // Track changes
  const handleWeightChange = (value: string) => {
    setWeight(value)
    setHasUnsavedChanges(true)
  }

  const handleRepsChange = (value: string) => {
    setReps(value)
    setHasUnsavedChanges(true)
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setHasUnsavedChanges(true)
  }

  // Save data
  const handleSave = async () => {
    const weightNum = weight ? parseFloat(weight) : undefined
    const repsNum = reps ? parseInt(reps, 10) : undefined

    await onUpdate({
      exerciseId,
      completed: exerciseLog?.completed || false,
      weight: weightNum,
      reps: repsNum,
      notes: notes || undefined
    })

    setHasUnsavedChanges(false)
  }

  // Quick weight adjustment buttons
  const handleWeightAdjust = (adjustment: number) => {
    const currentWeight = parseFloat(weight) || 0
    const newWeight = Math.max(0, currentWeight + adjustment)
    setWeight(newWeight.toString())
    setHasUnsavedChanges(true)
  }

  // Only show weight tracking for single lifts or strength intensity sections
  const shouldShowWeightTracking = trackWeight && (
    componentType === 'single_lift' || 
    (sectionType.toLowerCase().includes('strength') || sectionType.toLowerCase().includes('main work'))
  )

  if (!shouldShowWeightTracking) {
    return null
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
      <div className="space-y-3">
        {/* Weight Input */}
        <div className="flex items-center gap-2">
          <label htmlFor={`weight-${exerciseId}`} className="text-sm font-medium text-gray-700 w-16">
            Weight:
          </label>
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => handleWeightAdjust(-2.5)}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              aria-label="Decrease weight by 2.5"
            >
              -2.5
            </button>
            <input
              type="number"
              id={`weight-${exerciseId}`}
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder="kg"
              step="0.5"
              min="0"
              disabled={isLoading}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              aria-label={`Weight for ${exerciseName}`}
            />
            <span className="text-sm text-gray-500">kg</span>
            <button
              type="button"
              onClick={() => handleWeightAdjust(2.5)}
              disabled={isLoading}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
              aria-label="Increase weight by 2.5"
            >
              +2.5
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="flex items-center gap-2">
          <label htmlFor={`reps-${exerciseId}`} className="text-sm font-medium text-gray-700 w-16">
            Reps:
          </label>
          <input
            type="number"
            id={`reps-${exerciseId}`}
            value={reps}
            onChange={(e) => handleRepsChange(e.target.value)}
            placeholder="reps"
            min="0"
            disabled={isLoading}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            aria-label={`Repetitions for ${exerciseName}`}
          />
        </div>

        {/* Notes Input */}
        <div className="flex items-start gap-2">
          <label htmlFor={`notes-${exerciseId}`} className="text-sm font-medium text-gray-700 w-16 pt-1">
            Notes:
          </label>
          <textarea
            id={`notes-${exerciseId}`}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            disabled={isLoading}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
            aria-label={`Notes for ${exerciseName}`}
          />
        </div>

        {/* Previous values display */}
        {previousLog && !exerciseLog && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <span className="font-medium">Previous: </span>
            {previousLog.weight && <span>{previousLog.weight}kg </span>}
            {previousLog.reps && <span>× {previousLog.reps}</span>}
            {previousLog.logged_at && (
              <span className="ml-2 text-gray-400">
                ({new Date(previousLog.logged_at).toLocaleDateString()})
              </span>
            )}
          </div>
        )}

        {/* Save Button */}
        {hasUnsavedChanges && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {/* Success indicator */}
        {exerciseLog && !hasUnsavedChanges && (weight || reps || notes) && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Saved
          </div>
        )}
      </div>
    </div>
  )
}