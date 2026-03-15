import * as fs from 'fs';

let code = fs.readFileSync('handleExportExcel.ts', 'utf8');

// 1. Conductor Weight Formula
code = code.replace(
  /const condWtCol = pushCol\(item\.result\.bom\.conductorWeight \|\| 0, fmtNum\); \/\/ Keep static for conductor weight as it's complex/,
  `const condWtCol = pushCol(null, fmtNum, \`PI()*(\${wireDiaCol}\${r}/2)^2*\${wiresCol}\${r}*\${getDensity(item.params.conductorMaterial)}*\${coreCol}\${r}\`);`
);

// 2. Earthing Core Weight Formula
code = code.replace(
  /if \(hasEarth\) \{[\s\S]*?\/\/ IS/g,
  `if (hasEarth) {
          pushCol(item.params.earthingSize || 0, fmtNum);
          if (isNFA2XT) {
            const alWiresCol = pushCol(item.result.spec.earthingCore?.wireCount || 0);
            const alDiaCol = pushCol(item.result.spec.earthingCore?.wireDiameter || 0, fmtNum);
            const stWiresCol = pushCol(item.result.spec.earthingCore?.steelWireCount || 0);
            const stDiaCol = pushCol(item.result.spec.earthingCore?.steelWireDiameter || 0, fmtNum);
            
            earthWtCol = pushCol(null, fmtNum, \`PI()*(\${alDiaCol}\${r}/2)^2*\${alWiresCol}\${r}*\${getDensity('Al')} + PI()*(\${stDiaCol}\${r}/2)^2*\${stWiresCol}\${r}*\${getDensity('SteelWire')}\`);
            if (item.result.bom.earthingAlWeight !== undefined && item.result.bom.earthingSteelWeight !== undefined) {
              earthCstCol = pushCol(null, fmtRp, \`(\${item.result.bom.earthingAlWeight}*\${materialPrices.Al}+\${item.result.bom.earthingSteelWeight}*\${materialPrices.SteelWire})/1000\`);
            } else {
              earthCstCol = pushCol(null, fmtRp, \`\${earthWtCol}\${r}*\${condPrcCol}\${r}/1000\`);
            }
          } else {
            const earthWiresCol = pushCol(item.result.spec.earthingCore?.wireCount || 0);
            const earthWireDiaCol = pushCol(item.result.spec.earthingCore?.wireDiameter || 0, fmtNum);
            earthWtCol = pushCol(null, fmtNum, \`PI()*(\${earthWireDiaCol}\${r}/2)^2*\${earthWiresCol}\${r}*\${getDensity(item.params.conductorMaterial)}\`);
            earthCstCol = pushCol(null, fmtRp, \`\${earthWtCol}\${r}*\${condPrcCol}\${r}/1000\`);
          }
          
          const earthInsThkCol = pushCol(item.result.spec.earthingCore?.insulationThickness || 0, fmtNum);
          // Insulation weight = PI * Thk * (ID + Thk) * density
          let earthCurrentDiaFormula = isNFA2XT ? \`(\${getColName(colIdx - 5)}\${r})\` : \`(\${getColName(colIdx - 3)}\${r})\`; // Approximate ID
          earthInsWtCol = pushCol(null, fmtNum, \`PI()*\${earthInsThkCol}\${r}*(\${earthCurrentDiaFormula}+\${earthInsThkCol}\${r})*\${getDensity(item.params.insulationMaterial)}\`);
          earthInsCstCol = pushCol(null, fmtRp, \`\${earthInsWtCol}\${r}*\${insPrcCol}\${r}/1000\`);
        }

        // IS`
);

// 3. Armor Formula
code = code.replace(
  /let armWtFormula = `\$\{item\.result\.bom\.armorWeight \|\| 0\}`;[\s\S]*?currentDiaFormula = `\(\$\{currentDiaFormula\}\+2\*\$\{armThkCol\}\$\{r\}\)`;/g,
  `let armWtFormula = \`\${item.result.bom.armorWeight || 0}\`;
          let diameterAddition = \`2*\${armThkCol}\${r}\`;

          if (item.params.armorType === 'STA' || item.params.armorType === 'AWA' && item.result.spec.armorThickness < 1) {
            diameterAddition = \`4*\${armThkCol}\${r}\`;
            armWtFormula = \`PI()*(\${currentDiaFormula}+2*\${armThkCol}\${r})*2*\${armThkCol}\${r}*\${getDensity(armorMat)}*1.02\`;
          } else if (item.params.armorType === 'SWA' || item.params.armorType === 'AWA') {
            const armDensity = getDensity(item.params.armorType === 'AWA' ? 'Al' : 'SteelWire');
            armWtFormula = \`INT(PI()*(\${currentDiaFormula}+\${armThkCol}\${r})/(\${armThkCol}\${r}*1.05)) * PI() * (\${armThkCol}\${r}/2)^2 * \${armDensity} * 1.05\`;
            diameterAddition = \`2*\${armThkCol}\${r}\`;
          } else if (item.params.armorType === 'SFA') {
            armWtFormula = \`(PI()*(\${currentDiaFormula}+\${armThkCol}\${r}*0.8)*\${armThkCol}\${r}*0.8*0.9*1.02 + PI()*(\${currentDiaFormula}+2*\${armThkCol}\${r}*0.8+\${armThkCol}\${r}*0.2)*\${armThkCol}\${r}*0.2*1.2*1.02)*\${getDensity('Steel')}\`;
            diameterAddition = \`2*\${armThkCol}\${r}\`;
          } else if (item.params.armorType === 'RGB') {
            armWtFormula = \`(INT(PI()*(\${currentDiaFormula}+\${armThkCol}\${r}*0.85)/(\${armThkCol}\${r}*0.85*1.1))*PI()*(\${armThkCol}\${r}*0.85/2)^2*1.05 + PI()*(\${currentDiaFormula}+2*\${armThkCol}\${r}*0.85+\${armThkCol}\${r}*0.15)*\${armThkCol}\${r}*0.15*1.2*1.02)*\${getDensity('Steel')}\`;
            diameterAddition = \`2*\${armThkCol}\${r}\`;
          } else if (item.params.armorType === 'GSWB' || item.params.armorType === 'TCWB') {
            const coverage = (item.params.braidCoverage || 90) / 100;
            const armDensity = getDensity(item.params.armorType === 'TCWB' ? 'TCu' : 'Steel');
            armWtFormula = \`PI()*(\${currentDiaFormula}+\${armThkCol}\${r}/2)*\${armThkCol}\${r}*\${coverage}*\${armDensity}\`;
            diameterAddition = \`2*\${armThkCol}\${r}\`;
          }

          armWtCol = pushCol(null, fmtNum, armWtFormula);
          const armPrcCol = pushCol(armorPrice, fmtRp);
          armCstCol = pushCol(null, fmtRp, \`\${armWtCol}\${r}*\${armPrcCol}\${r}/1000\`);
          currentDiaFormula = \`(\${currentDiaFormula}+\${diameterAddition})\`;`
);

// 4. IS and OS Headers
code = code.replace(
  /if \(isInstrumentation && sampleItem\.params\.hasIndividualScreen\) addGroup\('Indv Screen', hMScr, \['Wt \(kg\/km\)', 'Prc \(Rp\/kg\)', 'Cst \(Rp\/m\)'\]\);/g,
  `if (isInstrumentation && sampleItem.params.hasIndividualScreen) addGroup('Indv Screen', hMScr, ['Al Foil Thk', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wires', 'Drain Dia', 'Drain Wt', 'Drain Prc', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);`
);
code = code.replace(
  /if \(isInstrumentation && sampleItem\.params\.hasOverallScreen\) addGroup\('Ovrl Screen', hMScr, \['Wt \(kg\/km\)', 'Prc \(Rp\/kg\)', 'Cst \(Rp\/m\)'\]\);/g,
  `if (isInstrumentation && sampleItem.params.hasOverallScreen) addGroup('Ovrl Screen', hMScr, ['Al Foil Thk', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wires', 'Drain Dia', 'Drain Wt', 'Drain Prc', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);`
);

// 5. IS and OS Data
code = code.replace(
  /let isCstCol, isWtCol;\s*if \(isInstrumentation && sampleItem\.params\.hasIndividualScreen\) \{\s*isWtCol = pushCol\(item\.result\.bom\.isWeight \|\| 0, fmtNum\);\s*const isPrcCol = pushCol\(materialPrices\.Cu, fmtRp\);\s*isCstCol = pushCol\(null, fmtRp, \`\$\{isWtCol\}\$\{r\}\*\$\{isPrcCol\}\$\{r\}\/1000\`\);\s*\}/g,
  `let isCstCol;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) {
          pushCol(0.05, fmtNum); // Al Foil Thk
          const isAlWtCol = pushCol(item.result.bom.isAlWeight || 0, fmtNum);
          const isAlPrcCol = pushCol(materialPrices.Al, fmtRp);
          pushCol(1); // Drain Wires
          pushCol(0.8, fmtNum); // Drain Dia
          const isDrainWtCol = pushCol(item.result.bom.isDrainWeight || 0, fmtNum);
          const isDrainPrcCol = pushCol(materialPrices.TCu || materialPrices.Cu, fmtRp);
          pushCol(0.05, fmtNum); // PET Thk
          const isPetWtCol = pushCol(item.result.bom.isPetWeight || 0, fmtNum);
          const isPetPrcCol = pushCol(materialPrices.PE || 25000, fmtRp);
          isCstCol = pushCol(null, fmtRp, \`(\${isAlWtCol}\${r}*\${isAlPrcCol}\${r} + \${isDrainWtCol}\${r}*\${isDrainPrcCol}\${r} + \${isPetWtCol}\${r}*\${isPetPrcCol}\${r})/1000\`);
        }`
);

code = code.replace(
  /let osCstCol, osWtCol;\s*if \(isInstrumentation && sampleItem\.params\.hasOverallScreen\) \{\s*osWtCol = pushCol\(item\.result\.bom\.osWeight \|\| 0, fmtNum\);\s*const osPrcCol = pushCol\(materialPrices\.Cu, fmtRp\);\s*osCstCol = pushCol\(null, fmtRp, \`\$\{osWtCol\}\$\{r\}\*\$\{osPrcCol\}\$\{r\}\/1000\`\);\s*\}/g,
  `let osCstCol;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) {
          pushCol(0.05, fmtNum); // Al Foil Thk
          const osAlWtCol = pushCol(item.result.bom.osAlWeight || 0, fmtNum);
          const osAlPrcCol = pushCol(materialPrices.Al, fmtRp);
          pushCol(1); // Drain Wires
          pushCol(0.8, fmtNum); // Drain Dia
          const osDrainWtCol = pushCol(item.result.bom.osDrainWeight || 0, fmtNum);
          const osDrainPrcCol = pushCol(materialPrices.TCu || materialPrices.Cu, fmtRp);
          pushCol(0.05, fmtNum); // PET Thk
          const osPetWtCol = pushCol(item.result.bom.osPetWeight || 0, fmtNum);
          const osPetPrcCol = pushCol(materialPrices.PE || 25000, fmtRp);
          osCstCol = pushCol(null, fmtRp, \`(\${osAlWtCol}\${r}*\${osAlPrcCol}\${r} + \${osDrainWtCol}\${r}*\${osDrainPrcCol}\${r} + \${osPetWtCol}\${r}*\${osPetPrcCol}\${r})/1000\`);
        }`
);

// 6. Fix hasEarth definition
code = code.replace(
  /const hasEarth = sampleItem\.params\.hasEarthing \|\| \(sampleItem\.params\.earthingSize && sampleItem\.params\.earthingSize > 0\);/g,
  `const hasEarth = sampleItem.params.hasEarthing && sampleItem.params.earthingSize && sampleItem.params.earthingSize > 0;`
);

// 7. Total Price and Length only in Summary
code = code.replace(
  /addGroup\('Summary', hTot, \['Pack Cst', 'Base HPP', 'OH \(%\)', 'HPP\/m', 'MG \(%\)', 'Selling Price', 'Total Price'\]\);/g,
  `addGroup('Summary', hTot, ['Pack Cst', 'Base HPP', 'OH (%)', 'HPP/m', 'MG (%)', 'Selling Price']);`
);

code = code.replace(
  /const sellPrcCol = pushCol\(null, fmtRp, \`\$\{hppCol\}\$\{r\}\*\(1\+\$\{mgCol\}\$\{r\}\/100\)\`\);\s*const totPrcCol = pushCol\(null, fmtRp, \`\$\{sellPrcCol\}\$\{r\}\*\$\{item\.params\.orderLength \|\| 1000\}\`\);/g,
  `const sellPrcCol = pushCol(null, fmtRp, \`\${hppCol}\${r}*(1+\${mgCol}\${r}/100)\`);`
);

fs.writeFileSync('handleExportExcel_updated.ts', code);
