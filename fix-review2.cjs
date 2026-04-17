const fs = require('fs');

function fixReviewSpec(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix messengerSize
  content = content.replace(/\.messengerSize/g, '.earthingSize');
  
  // Fix wireDiameter
  content = content.replace(/item\.params\.wireDiameter/g, 'item.result.spec.phaseCore.wireDiameter'); 

  // Fix getCableDesignation missing Result
  content = content.replace(/getCableDesignation\(items\[0\]\.params\)/g, 'getCableDesignation(items[0].params, items[0].result)');
  
  // Fix armourType -> armorType
  content = content.replace(/items\[0\]\.params\.armourType/g, 'items[0].params.armorType');
  content = content.replace(/armourType !== 'None'/g, "armorType !== 'Unarmored'");

  fs.writeFileSync(file, content);
}

fixReviewSpec('src/components/designer/ReviewSpecifications.tsx');
console.log('Fixed review specs');
