const fs = require('fs');

// Read and analyze the JSON structure
const jsonData = JSON.parse(fs.readFileSync('/Users/vilikoistinen/Downloads/Persist/updatedresults3.json', 'utf8'));

console.log('=== JSON STRUCTURE ANALYSIS ===');
const weekData = jsonData[0];
console.log('Programs found:', Object.keys(weekData.programs).length);

// Analyze first program structure
const firstProgramName = Object.keys(weekData.programs)[0];
const firstProgram = weekData.programs[firstProgramName];
console.log('\nFirst program:', firstProgramName);
console.log('Days in first program:', Object.keys(firstProgram.days).length);

// Analyze first day structure  
const firstDayName = Object.keys(firstProgram.days)[0];
const firstDay = firstProgram.days[firstDayName];
console.log('\nFirst day:', firstDayName);
console.log('Sections in first day:', firstDay.sections.length);

// Analyze first section structure
const firstSection = firstDay.sections[0];
console.log('\nFirst section:');
console.log('- Type:', firstSection.section_type);
console.log('- Has components:', !!firstSection.components);
console.log('- Components count:', firstSection.components ? firstSection.components.length : 0);

if (firstSection.components && firstSection.components.length > 0) {
  const firstComponent = firstSection.components[0];
  console.log('\nFirst component:');
  console.log('- Type:', firstComponent.type);
  console.log('- Has exercise (single):', !!firstComponent.exercise);
  console.log('- Has exercises (array):', !!firstComponent.exercises);
  
  if (firstComponent.exercise) {
    console.log('- Single exercise name:', firstComponent.exercise.name);
  }
  
  if (firstComponent.exercises && Array.isArray(firstComponent.exercises)) {
    console.log('- Multiple exercises count:', firstComponent.exercises.length);
    firstComponent.exercises.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name}`);
    });
  }
}

// Count total exercises across all programs
let totalExerciseCount = 0;
for (const [programName, program] of Object.entries(weekData.programs)) {
  for (const [dayName, day] of Object.entries(program.days)) {
    for (const section of day.sections) {
      if (section.components) {
        for (const component of section.components) {
          if (component.exercise) {
            totalExerciseCount++;
          }
          if (component.exercises && Array.isArray(component.exercises)) {
            totalExerciseCount += component.exercises.length;
          }
        }
      }
    }
  }
}

console.log('\n=== TOTAL EXERCISE COUNT ===');
console.log('Total exercises found in JSON:', totalExerciseCount);