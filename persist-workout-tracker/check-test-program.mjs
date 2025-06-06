import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestProgram() {
  try {
    console.log('=== CHECKING FOR TEST PROGRAM ===\n');
    
    // Check for the Test Program from sample data
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${programs?.length || 0} programs in database:`);
    programs?.forEach((program, idx) => {
      console.log(`${idx + 1}. ${program.name} (Full name: ${program.full_name})`);
    });
    
    // Look specifically for "Test Program"
    const testProgram = programs?.find(p => p.name === 'Test Program');
    
    if (testProgram) {
      console.log('\n=== FOUND TEST PROGRAM ===');
      console.log(JSON.stringify(testProgram, null, 2));
      
      // Check its days
      const { data: days, error: daysError } = await supabase
        .from('program_days')
        .select('*')
        .eq('program_id', testProgram.id);
      
      if (daysError) {
        console.error('Error fetching days:', daysError);
        return;
      }
      
      console.log(`\nTest Program has ${days?.length || 0} days:`);
      days?.forEach((day, idx) => {
        console.log(`${idx + 1}. ${day.day_name} - ${day.day_title}`);
      });
      
      // Check for Monday specifically (where the Pull-ups exercise should be)
      const mondayDay = days?.find(d => d.day_name === 'Monday');
      if (mondayDay) {
        console.log('\n=== CHECKING MONDAY WORKOUT FOR PULL-UPS ===');
        
        const { data: dayWithSections, error: dayError } = await supabase
          .from('program_days')
          .select(`
            *,
            workout_sections (
              *,
              workout_components (
                *,
                exercises (*)
              )
            )
          `)
          .eq('id', mondayDay.id)
          .single();
        
        if (dayError) {
          console.error('Error fetching Monday workout:', dayError);
          return;
        }
        
        console.log('Monday workout structure:');
        dayWithSections.workout_sections?.forEach((section, sectionIdx) => {
          console.log(`\nSection ${sectionIdx + 1}: ${section.section_type}`);
          section.workout_components?.forEach((component, componentIdx) => {
            console.log(`  Component ${componentIdx + 1}: ${component.component_type}`);
            component.exercises?.forEach((exercise, exerciseIdx) => {
              console.log(`    Exercise ${exerciseIdx + 1}: ${exercise.name}`);
              console.log(`      rest_after: ${exercise.rest_after || 'NULL'}`);
              console.log(`      sets_reps: ${exercise.sets_reps || 'NULL'}`);
              console.log(`      tempo: ${exercise.tempo || 'NULL'}`);
              console.log(`      rpe: ${exercise.rpe || 'NULL'}`);
            });
          });
        });
      }
    } else {
      console.log('\n❌ Test Program not found in database.');
      console.log('The sample workout data has not been imported yet.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTestProgram();