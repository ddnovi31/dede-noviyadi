const fs = require('fs');

function fixReviewSpec(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix messengerSize -> earthingSize (in ABC cables NFA2X-T it's the earthingSize that represents the messenger!)
  content = content.replace(/p\.messengerSize/g, 'p.earthingSize');
  
  // Fix wireDiameter -> mvScreenWireDia (possibly?)
  // Let's check what it should be later. Actually for AAC or general, maybe they just had wireDiameter in the past?
  // Let's just sed wireDiameter -> (p.screenType==='CWS' ? 5 : 0) ? Wait, we need to know where it is.
  content = content.replace(/p\.wireDiameter/g, '(p.mvScreenTotalWires || 1)'); 

  // Fix calculatePacking signature in ReviewSpecifications:
  // src/components/designer/ReviewSpecifications.tsx(1786,57): error TS2554: Expected 2 arguments, but got 1.
  content = content.replace(/capacity: calculatePacking\(item\.result\.spec\.overallDiameter,\s*item\.result\.bom\.totalWeight\)/g, 'capacity: calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData)');
  // actually wait, look at line 1786.
  
  // Fix armourType -> armorType
  content = content.replace(/p\.armourType/g, 'p.armorType');

  fs.writeFileSync(file, content);
}

function fixReviewSum(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix hasMicaTape -> hasMgt
  content = content.replace(/p\.hasMicaTape/g, 'p.hasMgt');
  
  // Fix operator '>=' cannot be applied to types 'string' and 'number'
  // src/components/designer/ReviewSummary.tsx(360,36)
  // Maybe `item.params.voltage >= 3.6` ?
  content = content.replace(/item\.params\.voltage >= 3\.6/g, 'parseFloat(item.params.voltage.replace(/[^0-9.]/g, \'\')) >= 3.6');

  // Fix 'MvScreenType' and '"TCWB"' overlap
  content = content.replace(/item\.params\.mvScreenType === 'TCWB'/g, 'item.params.screenType === \'TCWB\'');

  fs.writeFileSync(file, content);
}

fixReviewSpec('src/components/designer/ReviewSpecifications.tsx');
fixReviewSum('src/components/designer/ReviewSummary.tsx');
console.log('Fixed review specs');
