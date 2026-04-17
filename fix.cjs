const fs = require('fs');
const file = 'src/components/CableDesigner.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

lines.splice(3774, 4359 - 3775 + 1);

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed CableDesigner.tsx');
