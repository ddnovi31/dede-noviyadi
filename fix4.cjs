const fs = require('fs');

function fix() {
  let file1 = 'src/components/CableDesigner.tsx';
  let content1 = fs.readFileSync(file1, 'utf8');

  // Insert imports
  // `MaterialDensities` from sharedData
  content1 = content1.replace(/import \{ INITIAL_DRUM_DATA/g, 'import { MaterialDensities } from \'../utils/sharedData\';\nimport { getLayingUpFactor } from \'../utils/cableCalculations\';\nimport { INITIAL_DRUM_DATA');
  
  fs.writeFileSync(file1, content1);

  let file2 = 'src/components/designer/ReviewSpecifications.tsx';
  let content2 = fs.readFileSync(file2, 'utf8');
  content2 = content2.replace(/armorType !== 'None'/g, "armorType !== 'Unarmored'");
  fs.writeFileSync(file2, content2);

  let file3 = 'src/components/designer/ReviewSummary.tsx';
  let content3 = fs.readFileSync(file3, 'utf8');
  content3 = content3.replace(/item\.params\.hasMicaTape/g, 'item.params.hasMgt');
  content3 = content3.replace(/item\.params\.screenType === 'TCWB' \? 'Tinned Copper \(TCWB\)' :/g, "item.params.armorType === 'TCWB' ? 'Tinned Copper (TCWB)' :");
  fs.writeFileSync(file3, content3);
}

fix();
console.log('Fixed fix 4');
