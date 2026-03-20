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
  const phaseWireCount = parseInt(parts[1]);
  const phaseWireDia = parseFloat(parts[2].replace(',', '.'));
  const messengerAlWireCount = parseInt(parts[3]);
  const messengerAlWireDia = parseFloat(parts[4].replace(',', '.'));
  const messengerSteelWireCount = parseInt(parts[5]);
  const messengerSteelWireDia = parseFloat(parts[6].replace(',', '.'));
  const phaseInsThick = parseFloat(parts[7].replace(',', '.'));
  const messengerInsThick = parseFloat(parts[8].replace(',', '.'));

  const messengerWireCount = messengerAlWireCount + messengerSteelWireCount;
  
  // Find the block in code
  const regex = new RegExp(`'${name.replace('+', '\\+')}'\\s*:\\s*\\{[\\s\\S]*?netWeight:\\s*\\d+\\n\\s*\\},`, 'g');
  const match = regex.exec(code);
  
  if (match) {
    let block = match[0];
    
    const phaseRegex = /phase: \{ size: (\d+), wireCount: \d+, wireDiameter: [\d\.]+, condDiameter: [\d\.]+, condWeight: ([\d\.]+), insulationThickness: [\d\.]+, coreDiameter: [\d\.]+, resistance: ([\d\.]+), ampacity: (\d+), netWeight: 0 \}/;
    const messengerRegex = /messenger: \{ size: (\d+), wireCount: \d+, wireDiameter: [\d\.]+, condDiameter: [\d\.]+, condWeight: ([\d\.]+), insulationThickness: [\d\.]+, coreDiameter: [\d\.]+, resistance: ([\d\.]+), ampacity: (\d+), netWeight: 0, alWireCount: \d+, alWireDiameter: [\d\.]+, steelWireCount: \d+, steelWireDiameter: [\d\.]+, breakingLoad: ([\d\.]+) \}/;

    if (!phaseRegex.test(block)) {
      console.log(`Phase regex failed for ${name}`);
    }
    if (!messengerRegex.test(block)) {
      console.log(`Messenger regex failed for ${name}`);
    }
    
    // Update phase
    block = block.replace(phaseRegex, 
      `phase: { size: $1, wireCount: ${phaseWireCount}, wireDiameter: ${phaseWireDia}, condDiameter: ${(Math.sqrt(phaseWireCount)*phaseWireDia*1.15).toFixed(2)}, condWeight: $2, insulationThickness: ${phaseInsThick}, coreDiameter: ${((Math.sqrt(phaseWireCount)*phaseWireDia*1.15) + 2*phaseInsThick).toFixed(2)}, resistance: $3, ampacity: $4, netWeight: 0 }`);
      
    // Update messenger
    block = block.replace(messengerRegex,
      `messenger: { size: $1, wireCount: ${messengerWireCount}, wireDiameter: ${messengerAlWireDia}, condDiameter: ${(Math.sqrt(messengerWireCount)*messengerAlWireDia*1.15).toFixed(2)}, condWeight: $2, insulationThickness: ${messengerInsThick}, coreDiameter: ${((Math.sqrt(messengerWireCount)*messengerAlWireDia*1.15) + 2*messengerInsThick).toFixed(2)}, resistance: $3, ampacity: $4, netWeight: 0, alWireCount: ${messengerAlWireCount}, alWireDiameter: ${messengerAlWireDia}, steelWireCount: ${messengerSteelWireCount}, steelWireDiameter: ${messengerSteelWireDia}, breakingLoad: $5 }`);
      
    code = code.replace(match[0], block);
  } else {
    console.log(`Not found: ${name}`);
  }
}

fs.writeFileSync('src/utils/cableCalculations.ts', code);
