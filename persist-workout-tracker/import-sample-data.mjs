import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

// Simplified import function for testing
async function importSampleData() {
  try {
    // Read the sample workout data
    const sampleData = JSON.parse(readFileSync('./sample-workout.json', 'utf8'));
    console.log('=== IMPORTING SAMPLE WORKOUT DATA ===\n');
    
    const weekData = sampleData[0];
    
    // Process the Test Program
    const programData = weekData.programs["Test Program"];
    
    // 1. Insert program
    const { data: programRecord, error: programError } = await supabase
      .from('programs')
      .insert({
        name: 'Test Program',
        full_name: programData.full_name,
        week_title: weekData.week_info?.week_title || null,
        start_date: weekData.week_info?.start_date || null,
        end_date: weekData.week_info?.end_date || null
      })
      .select()
      .single();
    
    if (programError) {
      console.error('Error inserting program:', programError);
      return;
    }
    
    console.log('✅ Inserted Test Program:', programRecord.id);
    
    // 2. Process Monday day (which has the Pull-ups exercise)
    const mondayData = programData.days.Monday;
    
    const { data: dayRecord, error: dayError } = await supabase
      .from('program_days')
      .insert({
        program_id: programRecord.id,
        day_name: 'Monday',
        date: mondayData.date,
        day_title: mondayData.day_title,
        coach_notes: mondayData.coach_notes || null
      })
      .select()
      .single();
    
    if (dayError) {
      console.error('Error inserting day:', dayError);
      return;
    }
    
    console.log('✅ Inserted Monday day:', dayRecord.id);
    
    // 3. Process the Main Work section (which contains the superset with Pull-ups)
    const mainWorkSection = mondayData.sections.find(s => s.section_type === "Main Work");
    
    const { data: sectionRecord, error: sectionError } = await supabase
      .from('workout_sections')
      .insert({
        day_id: dayRecord.id,
        section_type: mainWorkSection.section_type,
        section_letter: mainWorkSection.section_letter || null,
        order_index: 1,
        duration: mainWorkSection.duration || null
      })
      .select()
      .single();
    
    if (sectionError) {
      console.error('Error inserting section:', sectionError);
      return;
    }
    
    console.log('✅ Inserted Main Work section:', sectionRecord.id);
    
    // 4. Process the superset component
    const supersetComponent = mainWorkSection.components.find(c => c.type === "superset");
    
    const { data: componentRecord, error: componentError } = await supabase
      .from('workout_components')
      .insert({
        section_id: sectionRecord.id,
        component_type: supersetComponent.type,
        order_index: 0,
        rounds: supersetComponent.rounds || null
      })
      .select()
      .single();
    
    if (componentError) {
      console.error('Error inserting component:', componentError);
      return;
    }
    
    console.log('✅ Inserted superset component:', componentRecord.id);
    
    // 5. Process the exercises (Push-ups and Pull-ups)
    for (let i = 0; i < supersetComponent.exercises.length; i++) {
      const exercise = supersetComponent.exercises[i];
      
      const { data: exerciseRecord, error: exerciseError } = await supabase
        .from('exercises')
        .insert({
          component_id: componentRecord.id,
          name: exercise.name,
          order_index: exercise.order || i,
          sets_reps: exercise.sets_reps || null,
          tempo: exercise.tempo || null,
          rpe: exercise.rpe || null,
          rest_after: exercise.rest_after || null,
          track_weight: exercise.track_weight ?? true,
          alternatives: exercise.alternatives || null
        })
        .select()
        .single();
      
      if (exerciseError) {
        console.error(`Error inserting exercise ${exercise.name}:`, exerciseError);
        return;
      }
      
      console.log(`✅ Inserted exercise: ${exercise.name} (rest_after: ${exercise.rest_after || 'NULL'})`);
    }
    
    console.log('\n🎉 Sample data imported successfully!');
    console.log('You can now test the UI by selecting "Test Program" and viewing Monday\'s workout.');
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importSampleData();