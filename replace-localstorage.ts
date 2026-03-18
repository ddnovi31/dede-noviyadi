import fs from 'fs';

let content = fs.readFileSync('src/components/CableDesigner.tsx', 'utf-8');

// Add import
if (!content.includes('import { safeLocalStorage }')) {
  content = content.replace(
    "import { INITIAL_DRUM_DATA, DrumData } from '../utils/drumData';",
    "import { INITIAL_DRUM_DATA, DrumData } from '../utils/drumData';\nimport { safeLocalStorage } from '../utils/safeLocalStorage';"
  );
}

// Replace localStorage with safeLocalStorage
content = content.replace(/localStorage\./g, 'safeLocalStorage.');

fs.writeFileSync('src/components/CableDesigner.tsx', content);
console.log('Replaced localStorage with safeLocalStorage');
