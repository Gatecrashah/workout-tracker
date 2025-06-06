// src/lib/importWorkoutData.ts
import { supabase, ValidationResult } from './supabase';

export interface JsonWorkoutData {
  source_file: string;
  week_info?: {
    week_title: string;
    start_date: string;
    end_date: string;
  };
  programs: {
    [programName: string]: {
      full_name: string;
      days: {
        [dayName: string]: {
          date: string;
          day_title: string;
          coach_notes?: string;
          sections: Array<{
            section_type: string;
            section_letter?: string;
            duration?: string;
            format?: {
              type?: string;
              structure?: string;
              interval_seconds?: number;
              total_sets?: number;
            };
            components: Array<{
              type: string;
              rounds?: number;
              transition?: string;
              loading_note?: string;
              progression_note?: string;
              intention_note?: string;
              exercise?: {
                name: string;
                sets_reps?: string;
                tempo?: string;
                rpe?: string;
                duration?: string;
                track_weight?: boolean;
                alternatives?: string[];
                loading_note?: string;
                progression_note?: string;
                sets_structure?: Array<{
                  set_type?: string;
                  set_number?: number;
                  set_range?: string;
                  reps?: number;
                  tempo?: string;
                  rpe?: string;
                }>;
              };
              exercises?: Array<{
                name: string;
                order?: number;
                sets_reps?: string;
                tempo?: string;
                rpe?: string;
                duration?: string;
                rest_after?: string;
                alternatives?: string[];
                loading_note?: string;
                progression_note?: string;
                notes?: string;
              }>;
            }>;
          }>;
        };
      };
    };
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    programs: number;
    days: number;
    sections: number;
    components: number;
    exercises: number;
  };
  error?: string;
}

// Test database connection and schema
export async function testDatabaseConnection(): Promise<ImportResult> {
  try {
    console.log('Testing database connection...');
    
    // First, try to read from programs table
    const { data: readData, error: readError } = await supabase
      .from('programs')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('Read error:', readError);
      return {
        success: false,
        message: 'Cannot read from programs table',
        error: `${readError?.message || 'Unknown error'} - Code: ${readError?.code || 'N/A'}`
      };
    }

    console.log('Read test successful, found programs:', readData?.length || 0);

    // Try to insert a simple test program
    const testProgram = {
      name: 'TEST_PROGRAM_' + Date.now(),
      full_name: 'Test Program',
      week_title: 'Test Week',
      start_date: '2025-01-01',
      end_date: '2025-01-07'
    };

    console.log('Attempting to insert test program:', testProgram);

    const { data: insertData, error: insertError } = await supabase
      .from('programs')
      .insert(testProgram)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return {
        success: false,
        message: 'Cannot insert test program',
        error: `${insertError?.message || 'Unknown error'} - Code: ${insertError?.code || 'N/A'} - Details: ${insertError?.details || 'N/A'} - Hint: ${insertError?.hint || 'N/A'}`
      };
    }

    console.log('Insert test successful:', insertData);

    // Clean up test program
    if (insertData?.id) {
      await supabase
        .from('programs')
        .delete()
        .eq('id', insertData.id);
    }

    return {
      success: true,
      message: `Database connection and schema test successful! Found ${readData?.length || 0} existing programs.`
    };
  } catch (error) {
    console.error('Test failed with exception:', error);
    return {
      success: false,
      message: 'Database test failed with exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main import function
export async function importWorkoutData(jsonData: JsonWorkoutData[]): Promise<ImportResult> {
  try {
    // Get the first (and typically only) week data
    const weekData = jsonData[0];
    
    if (!weekData || !weekData.programs) {
      return {
        success: false,
        message: 'Invalid JSON structure',
        error: 'No programs found in JSON data'
      };
    }

    let totalPrograms = 0;
    let totalDays = 0;
    let totalSections = 0;
    let totalComponents = 0;
    let totalExercises = 0;

    // Process each program
    for (const [programName, programData] of Object.entries(weekData.programs)) {
      console.log(`Importing program: ${programName}`);
      
      // 1. Insert or update program
      const programInsertData = {
        name: programName,
        full_name: programData.full_name,
        week_title: weekData.week_info?.week_title || null,
        start_date: weekData.week_info?.start_date || null,
        end_date: weekData.week_info?.end_date || null
      };

      console.log(`Attempting to insert program data:`, programInsertData);

      // Try to get existing program first
      const { data: existingProgram } = await supabase
        .from('programs')
        .select('id')
        .eq('name', programName)
        .single();

      let programRecord;
      if (existingProgram) {
        // Update existing program
        const { data, error: programError } = await supabase
          .from('programs')
          .update(programInsertData)
          .eq('name', programName)
          .select()
          .single();
        
        if (programError) {
          console.error(`Error updating program ${programName}:`, {
            error: programError,
            code: programError?.code,
            message: programError?.message,
            details: programError?.details,
            hint: programError?.hint,
            data: programInsertData
          });
          return {
            success: false,
            message: `Failed to update program: ${programName}`,
            error: `${programError?.message || 'Unknown error'} - Code: ${programError?.code || 'N/A'}`
          };
        }
        programRecord = data;
      } else {
        // Insert new program
        const { data, error: programError } = await supabase
          .from('programs')
          .insert(programInsertData)
          .select()
          .single();
        
        if (programError) {
          console.error(`Error inserting program ${programName}:`, {
            error: programError,
            code: programError?.code,
            message: programError?.message,
            details: programError?.details,
            hint: programError?.hint,
            data: programInsertData
          });
          return {
            success: false,
            message: `Failed to insert program: ${programName}`,
            error: `${programError?.message || 'Unknown error'} - Code: ${programError?.code || 'N/A'}`
          };
        }
        programRecord = data;
      }

      totalPrograms++;

      // 2. Process each day in the program
      for (const [dayName, dayData] of Object.entries(programData.days)) {
        console.log(`  Importing day: ${dayName}`);
        
        // Insert or update program day
        const dayInsertData = {
          program_id: programRecord.id,
          day_name: dayName,
          date: dayData.date,
          day_title: dayData.day_title,
          coach_notes: dayData.coach_notes || null
        };

        // Try to get existing day first
        const { data: existingDay } = await supabase
          .from('program_days')
          .select('id')
          .eq('program_id', programRecord.id)
          .eq('day_name', dayName)
          .single();

        let dayRecord;
        if (existingDay) {
          // Update existing day
          const { data, error: dayError } = await supabase
            .from('program_days')
            .update(dayInsertData)
            .eq('id', existingDay.id)
            .select()
            .single();
          
          if (dayError) {
            console.error(`Error updating day ${dayName}:`, dayError);
            continue;
          }
          dayRecord = data;
        } else {
          // Insert new day
          const { data, error: dayError } = await supabase
            .from('program_days')
            .insert(dayInsertData)
            .select()
            .single();
          
          if (dayError) {
            console.error(`Error inserting day ${dayName}:`, dayError);
            continue;
          }
          dayRecord = data;
        }

        totalDays++;

        // 3. Delete existing data for this day (to handle updates)
        // First get the section IDs for this day
        const { data: existingSections } = await supabase
          .from('workout_sections')
          .select('id')
          .eq('day_id', dayRecord.id);

        if (existingSections && existingSections.length > 0) {
          const sectionIds = existingSections.map(s => s.id);
          
          // Get component IDs for these sections
          const { data: existingComponents } = await supabase
            .from('workout_components')
            .select('id')
            .in('section_id', sectionIds);

          if (existingComponents && existingComponents.length > 0) {
            const componentIds = existingComponents.map(c => c.id);
            
            // Delete exercises first
            await supabase
              .from('exercises')
              .delete()
              .in('component_id', componentIds);
          }

          // Delete components
          await supabase
            .from('workout_components')
            .delete()
            .in('section_id', sectionIds);

          // Delete sections
          await supabase
            .from('workout_sections')
            .delete()
            .eq('day_id', dayRecord.id);
        }

        // 4. Process each section in the day
        for (let sectionIndex = 0; sectionIndex < dayData.sections.length; sectionIndex++) {
          const section = dayData.sections[sectionIndex];
          
          // Prepare section data
          const sectionInsertData = {
            day_id: dayRecord.id,
            section_type: section.section_type,
            section_letter: section.section_letter || null,
            order_index: sectionIndex,
            duration: section.duration || null,
            format_type: section.format?.type || null,
            format_structure: section.format?.structure || null,
            format_interval_seconds: section.format?.interval_seconds || null,
            format_total_sets: section.format?.total_sets ? String(section.format.total_sets) : null
          };

          console.log(`About to insert section data:`, sectionInsertData);

          // Insert workout section
          const { data: sectionRecord, error: sectionError } = await supabase
            .from('workout_sections')
            .insert(sectionInsertData)
            .select()
            .single();

          if (sectionError) {
            console.error(`ERROR inserting section:`, sectionError);
            console.error(`Section error properties:`, Object.keys(sectionError));
            console.error(`Section error string:`, JSON.stringify(sectionError, null, 2));
            console.error(`Section data that failed:`, sectionInsertData);
            console.error(`Original section:`, section);
            return {
              success: false,
              message: `Failed to insert section: ${section.section_type}`,
              error: JSON.stringify(sectionError, null, 2)
            };
          }

          totalSections++;

          // 5. Process each component in the section
          console.log(`Processing section components:`, section.components);
          if (section.components && Array.isArray(section.components)) {
            console.log(`Found ${section.components.length} components in section ${section.section_type}`);
            
            for (let componentIndex = 0; componentIndex < section.components.length; componentIndex++) {
              const component = section.components[componentIndex];
              console.log(`Processing component ${componentIndex + 1}/${section.components.length}:`, component);
              
              // Insert workout component
              const { data: componentRecord, error: componentError } = await supabase
                .from('workout_components')
                .insert({
                  section_id: sectionRecord.id,
                  component_type: component.type,
                  order_index: componentIndex,
                  rounds: component.rounds || null,
                  transition: component.transition || null,
                  loading_note: component.loading_note || null,
                  progression_note: component.progression_note || null,
                  intention_note: component.intention_note || null
                })
                .select()
                .single();

              if (componentError) {
                console.error(`Error inserting component:`, componentError);
                continue;
              }

              totalComponents++;

              // 6. Process exercises in this component
              let exercisesToProcess = [];
              
              // Handle single exercise (component.exercise)
              if (component.exercise) {
                exercisesToProcess.push({
                  ...component.exercise,
                  order: 0
                });
              }
              
              // Handle multiple exercises (component.exercises)
              if (component.exercises && Array.isArray(component.exercises)) {
                exercisesToProcess.push(...component.exercises);
              }

              console.log(`Found ${exercisesToProcess.length} exercises in component`);
              
              for (let exerciseIndex = 0; exerciseIndex < exercisesToProcess.length; exerciseIndex++) {
                const exercise = exercisesToProcess[exerciseIndex];
                console.log(`Inserting exercise ${exerciseIndex + 1}/${exercisesToProcess.length}:`, exercise);
                
                // Handle sets_structure for single_lift type
                let setsRepsValue = exercise.sets_reps;
                if (exercise.sets_structure && Array.isArray(exercise.sets_structure)) {
                  // For now, just use the working sets info
                  const workingSets = exercise.sets_structure.filter(s => s.set_type === 'working');
                  if (workingSets.length > 0) {
                    const workingSet = workingSets[0];
                    setsRepsValue = workingSet.set_range ? 
                      `${workingSet.set_range} × ${workingSet.reps} @${workingSet.tempo || ''} RPE${workingSet.rpe || ''}` :
                      `${workingSet.reps} reps @${workingSet.tempo || ''} RPE${workingSet.rpe || ''}`;
                  }
                }
                
                // Prepare exercise data
                const exerciseInsertData = {
                  component_id: componentRecord.id,
                  name: exercise.name,
                  order_index: exercise.order || exerciseIndex,
                  sets_reps: setsRepsValue || null,
                  tempo: exercise.tempo || null,
                  rpe: exercise.rpe || null,
                  duration: exercise.duration || null,
                  rest_after: exercise.rest_after || null,
                  track_weight: exercise.track_weight ?? true,
                  alternatives: exercise.alternatives || null,
                  loading_note: exercise.loading_note || null,
                  progression_note: exercise.progression_note || null,
                  notes: exercise.notes || null
                };

                console.log(`About to insert exercise data:`, exerciseInsertData);

                // Insert exercise
                const { data: exerciseData, error: exerciseError } = await supabase
                  .from('exercises')
                  .insert(exerciseInsertData)
                  .select()
                  .single();

                if (exerciseError) {
                  console.error(`ERROR inserting exercise ${exercise.name}:`, {
                    error: exerciseError,
                    code: exerciseError?.code,
                    message: exerciseError?.message,
                    details: exerciseError?.details,
                    hint: exerciseError?.hint,
                    data: exerciseInsertData
                  });
                  continue;
                }

                console.log(`✅ Successfully inserted exercise:`, exerciseData);
                totalExercises++;
              }
            }
          } else {
            console.log(`No components found in section ${section.section_type}:`, section);
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully imported ${totalPrograms} programs with ${totalDays} days, ${totalSections} sections, ${totalComponents} components, and ${totalExercises} exercises`,
      stats: {
        programs: totalPrograms,
        days: totalDays,
        sections: totalSections,
        components: totalComponents,
        exercises: totalExercises
      }
    };

  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: 'Import failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Clean up all workout data (WARNING: This will delete ALL data)
export async function clearAllWorkoutData(confirmationKey?: string): Promise<boolean> {
  // Require explicit confirmation to prevent accidental data loss
  if (confirmationKey !== 'CONFIRM_DELETE_ALL_DATA') {
    throw new Error('Data deletion requires explicit confirmation key');
  }

  try {
    // Get count of records before deletion for safety check
    const { count: programCount } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true });

    if (!programCount || programCount === 0) {
      console.log('No data to delete');
      return true;
    }

    console.warn(`About to delete ${programCount} programs and all related data`);

    // Delete in reverse order of dependencies with explicit conditions
    // Use gt 0 instead of neq to be more explicit about what we're deleting
    const { error: exerciseLogsError } = await supabase
      .from('exercise_logs')
      .delete()
      .gt('id', 0);

    if (exerciseLogsError) throw exerciseLogsError;

    const { error: completionsError } = await supabase
      .from('workout_completions')
      .delete()
      .gt('id', 0);

    if (completionsError) throw completionsError;

    const { error: exercisesError } = await supabase
      .from('exercises')
      .delete()
      .gt('id', 0);

    if (exercisesError) throw exercisesError;

    const { error: componentsError } = await supabase
      .from('workout_components')
      .delete()
      .gt('id', 0);

    if (componentsError) throw componentsError;

    const { error: sectionsError } = await supabase
      .from('workout_sections')
      .delete()
      .gt('id', 0);

    if (sectionsError) throw sectionsError;

    const { error: daysError } = await supabase
      .from('program_days')
      .delete()
      .gt('id', 0);

    if (daysError) throw daysError;

    const { error: programsError } = await supabase
      .from('programs')
      .delete()
      .gt('id', 0);

    if (programsError) throw programsError;

    console.log('Successfully cleared all workout data');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

// Validation function
export function validateJsonStructure(data: unknown): ValidationResult {
  const results: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {}
  };

  try {
    // Check if it's an array with at least one object
    if (!Array.isArray(data) || data.length === 0) {
      results.errors.push('JSON must be an array with at least one object');
      results.isValid = false;
      return results;
    }

    const weekData = data[0];

    // Check required top-level fields
    const requiredFields = ['source_file', 'programs'];
    for (const field of requiredFields) {
      if (!weekData || typeof weekData !== 'object' || !(field in weekData)) {
        results.errors.push(`Missing required field: ${field}`);
        results.isValid = false;
      }
    }

    // Validate programs structure
    if (weekData && typeof weekData === 'object' && 'programs' in weekData && weekData.programs && typeof weekData.programs === 'object') {
      const programNames = Object.keys(weekData.programs);
      results.summary.totalPrograms = programNames.length;
      results.summary.programNames = programNames;

      let totalDays = 0;
      let totalSections = 0;
      let totalComponents = 0;
      let totalExercises = 0;

      // Check each program
      for (const [programName, program] of Object.entries(weekData.programs)) {
        if (!program || typeof program !== 'object' || !('days' in program) || !program.days || typeof program.days !== 'object') {
          results.errors.push(`Program "${programName}" missing days object`);
          results.isValid = false;
          continue;
        }

        const days = Object.keys(program.days);
        totalDays += days.length;

        // Check each day
        for (const [dayName, day] of Object.entries(program.days)) {
          if (!day || typeof day !== 'object' || !('sections' in day) || !day.sections || !Array.isArray(day.sections)) {
            results.warnings.push(`Day "${dayName}" in "${programName}" missing sections array`);
            continue;
          }

          totalSections += day.sections.length;

          // Count components and exercises
          for (const section of day.sections) {
            if (section && typeof section === 'object' && 'components' in section && section.components && Array.isArray(section.components)) {
              totalComponents += section.components.length;
              
              // Count exercises in each component
              for (const component of section.components) {
                if (component && typeof component === 'object') {
                  // Count single exercise
                  if (component.exercise) {
                    totalExercises++;
                  }
                  // Count multiple exercises
                  if (component.exercises && Array.isArray(component.exercises)) {
                    totalExercises += component.exercises.length;
                  }
                }
              }
            }
          }
        }
      }

      results.summary.totalDays = totalDays;
      results.summary.totalSections = totalSections;
      results.summary.totalComponents = totalComponents;
      results.summary.totalExercises = totalExercises;
    }

    // Check week info
    if (weekData && typeof weekData === 'object' && 'week_info' in weekData && weekData.week_info && typeof weekData.week_info === 'object') {
      const weekInfo = weekData.week_info as Record<string, unknown>;
      results.summary.weekInfo = {
        title: typeof weekInfo.week_title === 'string' ? weekInfo.week_title : undefined,
        startDate: typeof weekInfo.start_date === 'string' ? weekInfo.start_date : undefined,
        endDate: typeof weekInfo.end_date === 'string' ? weekInfo.end_date : undefined
      };
    }

    results.summary.sourceFile = weekData && typeof weekData === 'object' && 'source_file' in weekData ? (weekData.source_file as string) : undefined;

  } catch (error) {
    results.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    results.isValid = false;
  }

  return results;
}