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

async function checkExercises() {
  try {
    console.log('=== CHECKING DATABASE FOR EXERCISES ===\n');
    
    // Check for exercises with rest_after data
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('id, name, rest_after, sets_reps, tempo, rpe')
      .limit(20);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${exercises?.length || 0} exercises in database:`);
    exercises?.forEach((ex, idx) => {
      console.log(`${idx + 1}. ${ex.name}`);
      console.log(`   rest_after: ${ex.rest_after || 'NULL'}`);
      console.log(`   sets_reps: ${ex.sets_reps || 'NULL'}`);
      console.log(`   tempo: ${ex.tempo || 'NULL'}`);
      console.log(`   rpe: ${ex.rpe || 'NULL'}`);
      console.log('');
    });
    
    // Specifically check for Pull-ups
    const { data: pullUps, error: pullError } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', '%pull%');
    
    if (pullError) {
      console.error('Error checking Pull-ups:', pullError);
      return;
    }
    
    console.log(`=== PULL-UPS EXERCISES ===`);
    console.log(`Found ${pullUps?.length || 0} exercises with 'pull' in name:`);
    pullUps?.forEach((ex, idx) => {
      console.log(`${idx + 1}. ${ex.name} (ID: ${ex.id})`);
      console.log(`   rest_after: "${ex.rest_after || 'NULL'}"`);
      console.log(`   All fields:`, JSON.stringify(ex, null, 2));
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExercises();