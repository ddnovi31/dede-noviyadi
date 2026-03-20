import * as fs from 'fs';

const data = `NFA2X-T 2x35+25 mm²;7;2,52;7;2,13;0;0;1,6;1,4
NFA2X-T 2x35+35 mm²;7;2,52;6;2,73;1;2,73;1,6;1,5
NFA2X-T 2x35+50 mm²;7;2,52;6;3,26;1;3,26;1,6;1,6
NFA2X-T 2x50+50 mm²;7;3,02;6;3,26;1;3,26;1,6;1,6
NFA2X-T 2x70+50 mm²;19;2,17;6;3,26;1;3,26;1,8;1,6
NFA2X-T 2x70+70 mm²;19;2,17;6;3,85;1;3,85;1,8;1,6
NFA2X-T 3x35+25 mm²;7;2,52;7;2,13;0;0;1,6;1,4
NFA2X-T 3x35+35 mm²;7;2,52;6;2,73;1;2,73;1,6;1,5
NFA2X-T 3x35+50 mm²;7;2,52;6;3,26;1;3,26;1,6;1,6
NFA2X-T 3x50+35 mm²;7;3,02;7;2,52;0;2,73;1,6;1,6
NFA2X-T 3x50+50 mm²;7;3,02;6;3,26;1;3,26;1,6;1,6
NFA2X-T 3x70+50 mm²;19;2,17;7;3,02;0;3,26;1,8;1,6
NFA2X-T 3x70+70 mm²;19;2,17;6;3,85;1;3,85;1,8;1,6
NFA2X-T 3x95+70 mm²;19;2,52;19;2,17;0;3,85;1,8;1,6
NFA2X-T 3x95+95 mm²;19;2,50;26;2,16;7;1,68;1,8;1,6
NFA2X-T 3x120+95 mm²;19;2,82;26;2,14;7;1,68;1,8;1,6`;

let code = fs.readFileSync('src/utils/cableCalculations.ts', 'utf8');

const lines = data.split('\n');
for (const line of lines) {
  const parts = line.split(';');
  const name = parts[0].replace('NFA2X-T ', '').replace(' mm²', '').trim();
  
  const regex = new RegExp(`'${name.replace('+', '\\+')}'\\s*:\\s*\\{[\\s\\S]*?netWeight:\\s*\\d+\\n\\s*\\},`, 'g');
  const match = regex.exec(code);
  
  if (!match) {
    console.log(`Missing: ${name}`);
  }
}
