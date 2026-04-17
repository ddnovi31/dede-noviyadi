const fs = require('fs');

function fix() {
  let content = fs.readFileSync('src/components/CableDesigner.tsx', 'utf8');

  // Fix calculateCostBreakdown calls
  content = content.replace(/calculateCostBreakdown\(item\.result\.bom, item\.params\)/g, 'calculateCostBreakdown(item.result.bom, item.params, materialPrices)');
  content = content.replace(/calculateCostBreakdown\(result\.bom, params\)/g, 'calculateCostBreakdown(result.bom, params, materialPrices)');

  // Fix getLayingUpFactor import
  content = content.replace(/import { getLayingUpFactor } from '\.\.\/utils\/sharedData';\n/g, '');
  content = content.replace(/import { CableDesignParams/g, 'import { getLayingUpFactor } from \'../utils/cableCalculations\';\nimport { CableDesignParams');
  
  // Fix MaterialDensities type
  content = content.replace(/<MaterialDensities>/g, '<any>');
  content = content.replace(/as MaterialDensities/g, 'as any');
  content = content.replace(/keyof MaterialDensities/g, 'any');

  fs.writeFileSync('src/components/CableDesigner.tsx', content);

}

fix();
console.log('Fixed CableDesigner');
