// src/lib/importWorkoutData.ts
import { supabase } from './supabase';

interface JsonWorkoutData {
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
            exercises: Array<{
              name: string;
              sets_reps?: string;
              tempo?: string;
              rpe?: string;
              loading?: string;
              notes?: string;
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

        // 3. Delete existing sections for this day (to handle updates)
        await supabase
          .from('workout_sections')
          .delete()
          .eq('day_id', dayRecord.id);

        // 4. Process each section in the day
        for (let sectionIndex = 0; sectionIndex < dayData.sections.length; sectionIndex++) {
          const section = dayData.sections[sectionIndex];
          
          // Insert workout section
          const { data: sectionRecord, error: sectionError } = await supabase
            .from('workout_sections')
            .insert({
              day_id: dayRecord.id,
              section_type: section.section_type,
              section_letter: section.section_letter || null,
              order_index: sectionIndex
            })
            .select()
            .single();

          if (sectionError) {
            console.error(`Error inserting section:`, sectionError);
            continue;
          }

          totalSections++;

          // 5. Process each exercise in the section
          if (section.exercises && Array.isArray(section.exercises)) {
            for (let exerciseIndex = 0; exerciseIndex < section.exercises.length; exerciseIndex++) {
              const exercise = section.exercises[exerciseIndex];
              
              // Insert exercise
              const { error: exerciseError } = await supabase
                .from('exercises')
                .insert({
                  section_id: sectionRecord.id,
                  name: exercise.name,
                  sets_reps: exercise.sets_reps || null,
                  tempo: exercise.tempo || null,
                  rpe: exercise.rpe || null,
                  loading: exercise.loading || null,
                  notes: exercise.notes || null,
                  order_index: exerciseIndex
                });

              if (exerciseError) {
                console.error(`Error inserting exercise ${exercise.name}:`, exerciseError);
                continue;
              }

              totalExercises++;
            }
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully imported ${totalPrograms} programs with ${totalDays} days, ${totalSections} sections, and ${totalExercises} exercises`,
      stats: {
        programs: totalPrograms,
        days: totalDays,
        sections: totalSections,
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

// Clean up all workout data
export async function clearAllWorkoutData(): Promise<boolean> {
  try {
    // Delete in reverse order of dependencies
    await supabase.from('exercise_logs').delete().neq('id', 0);
    await supabase.from('workout_completions').delete().neq('id', 0);
    await supabase.from('exercises').delete().neq('id', 0);
    await supabase.from('workout_sections').delete().neq('id', 0);
    await supabase.from('program_days').delete().neq('id', 0);
    await supabase.from('programs').delete().neq('id', 0);
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}