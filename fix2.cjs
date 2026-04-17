const fs = require('fs');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix calculatePacking
  content = content.replace(/calculatePacking\(item\.result\.spec\.overallDiameter, item\.result\.bom\.totalWeight\)/g, 'calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData)');
  content = content.replace(/calculatePacking\(result\.spec\.overallDiameter, result\.bom\.totalWeight\)/g, 'calculatePacking(result.spec.overallDiameter, result.bom.totalWeight, drumData)');

  // Fix calculateHPP uses in map/reduce loops
  content = content.replace(/calculateHPP\(item\.result, item\.params\)/g, 'calculateHPP(item.result, item.params, materialPrices, drumData)');
  content = content.replace(/calculateHPP\(item\.result, item\.params, loadedProjectConfig\.materialPrices\)/g, 'calculateHPP(item.result, item.params, loadedProjectConfig.materialPrices, drumData)');
  
  // Wait, what about 'getLayingUpFactor' ? 
  // It says src/components/CableDesigner.tsx(814,27): error TS2304: Cannot find name 'getLayingUpFactor'.
  
  fs.writeFileSync(file, content);
}

processFile('src/components/CableDesigner.tsx');
console.log('Fixed CableDesigner.tsx');
