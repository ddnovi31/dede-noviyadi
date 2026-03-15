import * as fs from 'fs';
const code = fs.readFileSync('src/components/CableDesigner.tsx', 'utf8');
const start = code.indexOf('const handleExportExcel = () => {');
const end = code.indexOf('const handleSaveProject = () => {');
fs.writeFileSync('handleExportExcel.ts', code.substring(start, end));
