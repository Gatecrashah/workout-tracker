// Simple test to isolate the import issue
const fs = require('fs');

async function testImport() {
  // Read the JSON
  const jsonData = JSON.parse(fs.readFileSync('/Users/vilikoistinen/Downloads/Persist/updatedresults3.json', 'utf8'));
  
  console.log('=== TESTING IMPORT LOGIC ===');
  
  const weekData = jsonData[0];
  let totalExercisesProcessed = 0;
  
  // Simulate the import logic
  for (const [programName, programData] of Object.entries(weekData.programs)) {
    console.log(`\nProcessing program: ${programName}`);
    
    for (const [dayName, dayData] of Object.entries(programData.days)) {
      console.log(`  Processing day: ${dayName}`);
      
      for (let sectionIndex = 0; sectionIndex < dayData.sections.length; sectionIndex++) {
        const section = dayData.sections[sectionIndex];
        console.log(`    Processing section: ${section.section_type}`);
        
        // Check if section has components
        if (section.components && Array.isArray(section.components)) {
          console.log(`      Found ${section.components.length} components`);
          
          for (let componentIndex = 0; componentIndex < section.components.length; componentIndex++) {
            const component = section.components[componentIndex];
            console.log(`        Processing component ${componentIndex + 1}: ${component.type}`);
            
            // Process exercises in this component
            let exercisesToProcess = [];
            
            // Handle single exercise (component.exercise)
            if (component.exercise) {
              exercisesToProcess.push({
                ...component.exercise,
                order: 0
              });
              console.log(`          Found single exercise: ${component.exercise.name}`);
            }
            
            // Handle multiple exercises (component.exercises)
            if (component.exercises && Array.isArray(component.exercises)) {
              exercisesToProcess.push(...component.exercises);
              console.log(`          Found ${component.exercises.length} exercises in array`);
            }
            
            console.log(`          Total exercises to process: ${exercisesToProcess.length}`);
            totalExercisesProcessed += exercisesToProcess.length;
            
            // Log first exercise details
            if (exercisesToProcess.length > 0) {
              const firstExercise = exercisesToProcess[0];
              console.log(`          First exercise: ${firstExercise.name}`);
              console.log(`          Sets/reps: ${firstExercise.sets_reps || 'N/A'}`);
            }
          }
        } else {
          console.log(`      No components found in section`);
        }
      }
      
      // Only process first day for debugging
      break;
    }
    
    // Only process first program for debugging  
    break;
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total exercises that should be processed: ${totalExercisesProcessed}`);
}

testImport().catch(console.error);