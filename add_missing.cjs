const fs = require('fs');

const fileContent = fs.readFileSync('src/utils/cableCalculations.ts', 'utf8');

const newSizes = `
  '3x35+35': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.73, condDiameter: 8.19, condWeight: 96.21, insulationThickness: 1.5, coreDiameter: 11.19, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.73, steelWireCount: 1, steelWireDiameter: 2.73, breakingLoad: 11.90 },
    netWeight: 600
  },
  '3x35+50': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.78, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.98, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 700
  },`;

const updatedContent = fileContent.replace(
  /'3x35\+25': \{[\s\S]*?\n  \},/,
  match => match + newSizes
);

fs.writeFileSync('src/utils/cableCalculations.ts', updatedContent);
console.log('Done');
