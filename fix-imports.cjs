const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  if (file.includes('CableDesigner.tsx')) {
    // 32:  MaterialDensities,
    content = content.replace(/MaterialDensities,\n/g, ''); // Remove MaterialDensities from cableCalculations import
    content = content.replace(/import { CableDesignParams/g, 'import { MaterialDensities } from \'../utils/sharedData\';\nimport { CableDesignParams');
    
    // getLayingUpFactor is used in CableDesigner.tsx but not imported
    content = content.replace(/import { INITIAL_DRUM_DATA/g, 'import { getLayingUpFactor } from \'../utils/sharedData\';\nimport { INITIAL_DRUM_DATA');
  }

  if (file.includes('designerUtils.ts')) {
    // 1: import { CableDesignParams, CalculationResult, CONDUCTOR_RESISTIVITY, INSTRUMENT_FACTORS } from './cableCalculations';
    content = content.replace(/CONDUCTOR_RESISTIVITY, INSTRUMENT_FACTORS/g, ''); 
    content = content.replace(/import { DrumData/g, 'import { CONDUCTOR_RESISTIVITY, INSTRUMENT_FACTORS } from \'./conductorData\';\nimport { DrumData');
  }

  fs.writeFileSync(file, content);
}

fixFile('src/components/CableDesigner.tsx');
fixFile('src/utils/designerUtils.ts');
console.log('Fixed imports');
