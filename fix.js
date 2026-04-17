const fs = require('fs');
const file = 'src/components/CableDesigner.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

// 0-indexed line array. So line 3775 is index 3774.
// Array splice: list.splice(startIndex, count);
// Total lines to delete: 4359 - 3775 + 1 = 585
lines.splice(3774, 4359 - 3775 + 1);

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed CableDesigner.tsx');
