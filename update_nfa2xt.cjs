const fs = require('fs');

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

const lines = data.split('\n');
const updates = {};

lines.forEach(line => {
  const parts = line.split(';');
  const name = parts[0].replace('NFA2X-T ', '').replace(' mm²', '').trim();
  const phaseWireCount = parseInt(parts[1]);
  const phaseWireDia = parseFloat(parts[2].replace(',', '.'));
  const alWireCount = parseInt(parts[3]);
  const alWireDia = parseFloat(parts[4].replace(',', '.'));
  const steelWireCount = parseInt(parts[5]);
  const steelWireDia = parseFloat(parts[6].replace(',', '.'));
  const phaseInsThick = parseFloat(parts[7].replace(',', '.'));
  const messInsThick = parseFloat(parts[8].replace(',', '.'));

  updates[name] = {
    phaseWireCount, phaseWireDia, alWireCount, alWireDia, steelWireCount, steelWireDia, phaseInsThick, messInsThick
  };
});

const fileContent = fs.readFileSync('src/utils/cableCalculations.ts', 'utf8');
let newContent = fileContent;

for (const [key, update] of Object.entries(updates)) {
  const escapedKey = key.replace('+', '\\+');
  const regex = new RegExp(`('${escapedKey}':\\s*\\{[\\s\\S]*?\\n\\s*\\},?)`, 'g');
  const match = regex.exec(newContent);
  if (match) {
    let block = match[0];
    
    // Update phase
    block = block.replace(/phase:\s*\{([^}]+)\}/, (m, p1) => {
      let inner = p1;
      inner = inner.replace(/wireCount:\s*\d+/, `wireCount: ${update.phaseWireCount}`);
      inner = inner.replace(/wireDiameter:\s*[\d.]+/, `wireDiameter: ${update.phaseWireDia}`);
      inner = inner.replace(/insulationThickness:\s*[\d.]+/, `insulationThickness: ${update.phaseInsThick}`);
      
      // Recalculate condDiameter
      let factor = 1;
      if (update.phaseWireCount === 7) factor = 3;
      else if (update.phaseWireCount === 19) factor = 5;
      else if (update.phaseWireCount === 37) factor = 7;
      const condDia = (update.phaseWireDia * factor).toFixed(2);
      inner = inner.replace(/condDiameter:\s*[\d.]+/, `condDiameter: ${condDia}`);
      
      // Recalculate coreDiameter
      const coreDia = (parseFloat(condDia) + 2 * update.phaseInsThick).toFixed(2);
      inner = inner.replace(/coreDiameter:\s*[\d.]+/, `coreDiameter: ${coreDia}`);
      
      return `phase: {${inner}}`;
    });

    // Update messenger
    block = block.replace(/messenger:\s*\{([^}]+)\}/, (m, p1) => {
      let inner = p1;
      const totalWires = update.alWireCount + update.steelWireCount;
      inner = inner.replace(/wireCount:\s*\d+/, `wireCount: ${totalWires}`);
      inner = inner.replace(/alWireCount:\s*\d+/, `alWireCount: ${update.alWireCount}`);
      inner = inner.replace(/alWireDiameter:\s*[\d.]+/, `alWireDiameter: ${update.alWireDia}`);
      inner = inner.replace(/steelWireCount:\s*\d+/, `steelWireCount: ${update.steelWireCount}`);
      inner = inner.replace(/steelWireDiameter:\s*[\d.]+/, `steelWireDiameter: ${update.steelWireDia}`);
      inner = inner.replace(/insulationThickness:\s*[\d.]+/, `insulationThickness: ${update.messInsThick}`);
      
      // Recalculate condDiameter
      let factor = 1;
      if (totalWires === 7) factor = 3;
      else if (totalWires === 19) factor = 5;
      else if (totalWires === 37) factor = 7;
      else if (totalWires === 33) factor = 7; // approx
      const mainDia = update.alWireCount > 0 ? update.alWireDia : update.steelWireDia;
      const condDia = (mainDia * factor).toFixed(2);
      inner = inner.replace(/condDiameter:\s*[\d.]+/, `condDiameter: ${condDia}`);
      
      // Recalculate coreDiameter
      const coreDia = (parseFloat(condDia) + 2 * update.messInsThick).toFixed(2);
      inner = inner.replace(/coreDiameter:\s*[\d.]+/, `coreDiameter: ${coreDia}`);
      
      return `messenger: {${inner}}`;
    });

    newContent = newContent.replace(match[0], block);
  } else {
    console.log(`Key ${key} not found!`);
  }
}

fs.writeFileSync('src/utils/cableCalculations.ts', newContent);
console.log('Done');
