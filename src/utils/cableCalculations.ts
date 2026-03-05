export type ConductorMaterial = 'Cu' | 'Al';
export type ConductorType = 're' | 'rm' | 'sm' | 'f' | 'cm';
export type InsulationMaterial = 'XLPE' | 'PVC';
export type ArmorType = 'Unarmored' | 'SWA' | 'STA' | 'AWA' | 'SFA' | 'RGB' | 'GSWB';
export type SheathMaterial = 'PVC' | 'PE' | 'LSZH';
export type MvScreenType = 'None' | 'CTS' | 'CWS';
export type CableStandard = 'IEC 60502-1' | 'IEC 60502-2' | 'SNI 04-6629.4 (NYM)' | 'SNI 04-6629.3 (NYAF)' | 'SNI 04-6629.5 (NYMHY)' | 'SNI 04-6629.5 (NYYHY)';

export interface CableDesignParams {
  id?: string;
  cores: number;
  size: number;
  conductorMaterial: ConductorMaterial;
  conductorType: ConductorType;
  insulationMaterial: InsulationMaterial;
  armorType: ArmorType;
  sheathMaterial: SheathMaterial;
  voltage: string;
  standard: CableStandard;
  braidCoverage?: number; // Percentage, e.g., 90
  mvScreenType?: MvScreenType;
  mvScreenSize?: number; // For CWS (e.g., 16, 25, 35 mm2)
  hasMgt?: boolean;
}

interface SizeData {
  size: number;
  diameter: number;
  xlpeThick: number;
  pvcThick: number;
}

const CABLE_DATA: SizeData[] = [
  { size: 1.5, diameter: 1.6, xlpeThick: 0.7, pvcThick: 0.8 },
  { size: 2.5, diameter: 2.0, xlpeThick: 0.7, pvcThick: 0.8 },
  { size: 4, diameter: 2.6, xlpeThick: 0.7, pvcThick: 1.0 },
  { size: 6, diameter: 3.1, xlpeThick: 0.7, pvcThick: 1.0 },
  { size: 10, diameter: 4.0, xlpeThick: 0.7, pvcThick: 1.0 },
  { size: 16, diameter: 5.1, xlpeThick: 0.7, pvcThick: 1.0 },
  { size: 25, diameter: 6.3, xlpeThick: 0.9, pvcThick: 1.2 },
  { size: 35, diameter: 7.5, xlpeThick: 0.9, pvcThick: 1.2 },
  { size: 50, diameter: 8.9, xlpeThick: 1.0, pvcThick: 1.4 },
  { size: 70, diameter: 10.7, xlpeThick: 1.1, pvcThick: 1.4 },
  { size: 95, diameter: 12.6, xlpeThick: 1.1, pvcThick: 1.6 },
  { size: 120, diameter: 14.2, xlpeThick: 1.2, pvcThick: 1.6 },
  { size: 150, diameter: 15.8, xlpeThick: 1.4, pvcThick: 1.8 },
  { size: 185, diameter: 17.6, xlpeThick: 1.6, pvcThick: 2.0 },
  { size: 240, diameter: 20.1, xlpeThick: 1.7, pvcThick: 2.2 },
  { size: 300, diameter: 22.5, xlpeThick: 1.8, pvcThick: 2.4 },
  { size: 400, diameter: 25.8, xlpeThick: 2.0, pvcThick: 2.6 },
  { size: 500, diameter: 28.8, xlpeThick: 2.2, pvcThick: 2.8 },
  { size: 630, diameter: 32.5, xlpeThick: 2.4, pvcThick: 2.8 },
];

const DENSITIES = {
  Cu: 8.89,
  Al: 2.7,
  XLPE: 0.92,
  PVC: 1.45,
  PE: 0.95,
  LSZH: 1.5,
  Steel: 7.85,
};

// Laying up factors for multi-core cables (approximate)
const LAYING_UP_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 2.16,
  4: 2.42,
  5: 2.7,
};

export interface CalculationResult {
  spec: {
    conductorDiameter: number;
    insulationThickness: number;
    coreDiameter: number;
    laidUpDiameter: number;
    innerCoveringThickness: number;
    diameterUnderArmor: number;
    armorThickness: number;
    diameterOverArmor: number;
    sheathThickness: number;
    overallDiameter: number;
    conductorScreenThickness?: number;
    insulationScreenThickness?: number;
    braidWireDiameter?: number;
    braidCoverage?: number;
    mvScreenDiameter?: number;
    mgtThickness?: number;
  };
  bom: {
    conductorWeight: number;
    insulationWeight: number;
    innerCoveringWeight: number;
    armorWeight: number;
    sheathWeight: number;
    semiCondWeight: number;
    mvScreenWeight: number;
    mgtWeight: number;
    totalWeight: number;
  };
  electrical: {
    maxDcResistance: number;
    currentCapacityAir: number;
    currentCapacityGround: number;
    voltageRating: string;
    testVoltage: string;
  };
  general: {
    maxOperatingTemp: number;
    shortCircuitTemp: number;
    minBendingRadius: number;
    standardReference: string;
    flameRetardant: string;
  };
}

const RESISTANCE_CU: Record<number, number> = {
  1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524, 50: 0.387, 
  70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754, 300: 0.0601, 
  400: 0.0470, 500: 0.0366, 630: 0.0283
};

const CURRENT_CAPACITY_AIR_CU: Record<number, number> = {
  1.5: 24, 2.5: 32, 4: 42, 6: 54, 10: 75, 16: 100, 25: 135, 35: 165, 50: 200, 
  70: 255, 95: 315, 120: 365, 150: 420, 185: 485, 240: 575, 300: 665, 
  400: 780, 500: 900, 630: 1050
};

const CURRENT_CAPACITY_GROUND_CU: Record<number, number> = {
  1.5: 26, 2.5: 34, 4: 44, 6: 56, 10: 78, 16: 105, 25: 140, 35: 170, 50: 205, 
  70: 260, 95: 320, 120: 370, 150: 425, 185: 490, 240: 580, 300: 670, 
  400: 785, 500: 905, 630: 1055
};

const CURRENT_CAPACITY_AIR_AL: Record<number, number> = {
  1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 103, 35: 125, 50: 152, 
  70: 194, 95: 240, 120: 278, 150: 320, 185: 370, 240: 438, 300: 506, 
  400: 594, 500: 685, 630: 800
};

const CURRENT_CAPACITY_GROUND_AL: Record<number, number> = {
  1.5: 20, 2.5: 26, 4: 34, 6: 43, 10: 59, 16: 80, 25: 107, 35: 130, 50: 156, 
  70: 198, 95: 244, 120: 282, 150: 324, 185: 374, 240: 442, 300: 510, 
  400: 598, 500: 689, 630: 804
};

export function calculateCable(params: CableDesignParams): CalculationResult {
  // Adjust params based on standard
  const effectiveParams = { ...params };
  if (params.standard === 'IEC 60502-2') {
    effectiveParams.insulationMaterial = 'XLPE';
    // Only set default if current voltage is not an MV voltage
    if (!['3.6/6 kV', '6/10 kV', '8.7/15 kV', '12/20 kV', '18/30 kV'].includes(params.voltage)) {
      effectiveParams.voltage = '6/10 kV';
    }
  } else if (params.standard.includes('NYM')) {
    effectiveParams.voltage = '300/500 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.armorType = 'Unarmored';
  } else if (params.standard.includes('NYAF')) {
    effectiveParams.voltage = '450/750 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    effectiveParams.armorType = 'Unarmored';
    effectiveParams.cores = 1;
  } else if (params.standard.includes('NYMHY')) {
    effectiveParams.voltage = '300/500 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    effectiveParams.armorType = 'Unarmored';
  } else if (params.standard.includes('NYYHY')) {
    effectiveParams.voltage = '450/750 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    effectiveParams.armorType = 'Unarmored';
  }

  const data = CABLE_DATA.find((d) => d.size === effectiveParams.size) || CABLE_DATA[0];

  // 1. Conductor
  let conductorDiameter = data.diameter;
  if (effectiveParams.conductorType === 're') {
    conductorDiameter = Math.sqrt((4 * effectiveParams.size) / Math.PI);
  } else if (effectiveParams.conductorType === 'f') {
    conductorDiameter = data.diameter * 1.1; // Flexible class 5 is approx 10% larger than stranded class 2
  } else if (effectiveParams.conductorType === 'cm') {
    conductorDiameter = data.diameter * 0.92; // Compacted stranded is approx 8% smaller
  } else if (effectiveParams.conductorType === 'sm') {
    // sm is sector shaped, diameter is not circular but we use equivalent for insulation
    conductorDiameter = data.diameter; 
  }

  const conductorWeightPerCore = effectiveParams.size * DENSITIES[effectiveParams.conductorMaterial]; // kg/km
  const totalConductorWeight = conductorWeightPerCore * effectiveParams.cores;

  // 1.5 Mica Glass Tape (MGT) - Fire Resistant
  let mgtThickness = 0;
  let mgtWeightPerCore = 0;
  let diameterOverMgt = conductorDiameter;

  if (effectiveParams.hasMgt) {
    mgtThickness = 0.2; // 2 layers of 0.1mm approx
    diameterOverMgt = conductorDiameter + (2 * mgtThickness);
    const rCond = conductorDiameter / 2;
    const rMgt = diameterOverMgt / 2;
    const mgtArea = Math.PI * (rMgt * rMgt - rCond * rCond);
    mgtWeightPerCore = mgtArea * 2.2; // Density ~2.2 for Mica Tape
  }

  const totalMgtWeight = mgtWeightPerCore * effectiveParams.cores;

  // 2. Semi-conductive and Insulation
  let conductorScreenThickness = 0;
  let insulationScreenThickness = 0;
  let insulationThickness = effectiveParams.insulationMaterial === 'XLPE' ? data.xlpeThick : data.pvcThick;

  // MV Specifics (IEC 60502-2)
  if (effectiveParams.standard === 'IEC 60502-2') {
    conductorScreenThickness = 0.5; 
    insulationScreenThickness = 0.5;
    if (effectiveParams.voltage.includes('3.6/6')) insulationThickness = 2.5;
    else if (effectiveParams.voltage.includes('6/10')) insulationThickness = 3.4;
    else if (effectiveParams.voltage.includes('8.7/15')) insulationThickness = 4.5;
    else if (effectiveParams.voltage.includes('12/20')) insulationThickness = 5.5;
    else if (effectiveParams.voltage.includes('18/30')) insulationThickness = 8.0;
  }

  const coreDiameter = diameterOverMgt + (2 * conductorScreenThickness) + (2 * insulationThickness) + (2 * insulationScreenThickness);
  
  // 2.5 Metallic Screen (MV Only)
  let mvScreenWeightPerCore = 0;
  let mvScreenThickness = 0;
  let diameterOverScreen = coreDiameter;

  if (effectiveParams.standard === 'IEC 60502-2' && effectiveParams.mvScreenType && effectiveParams.mvScreenType !== 'None') {
    if (effectiveParams.mvScreenType === 'CTS') {
      // Copper Tape Screen: typically 0.1mm thickness, overlapped
      mvScreenThickness = 0.2; // Effective thickness with overlap
      diameterOverScreen = coreDiameter + (2 * mvScreenThickness);
      const meanDiameter = coreDiameter + mvScreenThickness;
      // Area = pi * D * t * overlap_factor
      const area = Math.PI * meanDiameter * 0.1 * 1.25; // 0.1mm tape, 25% overlap
      mvScreenWeightPerCore = area * DENSITIES.Cu;
    } else if (effectiveParams.mvScreenType === 'CWS') {
      // Copper Wire Screen: specified by cross section (e.g., 16mm2)
      const screenSize = effectiveParams.mvScreenSize || 16;
      mvScreenWeightPerCore = screenSize * DENSITIES.Cu * 1.05; // 5% lay factor
      
      // Approximate thickness based on wire diameter for that size
      // For 16mm2, approx 25 wires of 0.9mm -> thickness ~ 1.0mm
      // For 25mm2, approx 30 wires of 1.0mm -> thickness ~ 1.1mm
      if (screenSize <= 16) mvScreenThickness = 1.0;
      else if (screenSize <= 25) mvScreenThickness = 1.2;
      else mvScreenThickness = 1.5;
      
      diameterOverScreen = coreDiameter + (2 * mvScreenThickness);
    }
  }

  const totalMvScreenWeight = mvScreenWeightPerCore * effectiveParams.cores;

  // Area calculations for BOM
  const rCond = conductorDiameter / 2;
  let semiCondArea = 0;
  let insulationArea = 0;

  if (conductorScreenThickness > 0) {
    // Conductor screen + Insulation screen
    const rSemi1 = rCond + conductorScreenThickness; 
    const rIns = rSemi1 + insulationThickness;
    const rSemi2 = rIns + insulationScreenThickness;
    
    const condScreenArea = Math.PI * (rSemi1 * rSemi1 - rCond * rCond);
    const insArea = Math.PI * (rIns * rIns - rSemi1 * rSemi1);
    const insScreenArea = Math.PI * (rSemi2 * rSemi2 - rIns * rIns);
    
    semiCondArea = condScreenArea + insScreenArea;
    insulationArea = insArea;
  } else {
    const rIns = rCond + insulationThickness;
    insulationArea = Math.PI * (rIns * rIns - rCond * rCond);
  }

  const insulationWeightPerCore = insulationArea * DENSITIES[effectiveParams.insulationMaterial]; // kg/km
  const totalInsulationWeight = insulationWeightPerCore * effectiveParams.cores;
  
  const semiCondWeightPerCore = semiCondArea * 1.15; // Density ~1.15 for semi-cond
  const totalSemiCondWeight = semiCondWeightPerCore * effectiveParams.cores;

  // 3. Laying up
  let laidUpDiameter = effectiveParams.cores === 1 ? diameterOverScreen : diameterOverScreen * (LAYING_UP_FACTORS[effectiveParams.cores] || 2.0);
  
  // Sector shaped reduction
  if (effectiveParams.conductorType === 'sm' && effectiveParams.cores >= 3) {
    laidUpDiameter = laidUpDiameter * 0.9; // Approx 10% reduction for sector shape
  }

  // 4. Inner Covering (Extruded)
  let innerCoveringThickness = 0;
  let innerCoveringWeight = 0;
  let diameterUnderArmor = laidUpDiameter;

  if (effectiveParams.cores > 1 && effectiveParams.armorType !== 'Unarmored') {
    if (laidUpDiameter <= 25) innerCoveringThickness = 1.0;
    else if (laidUpDiameter <= 35) innerCoveringThickness = 1.2;
    else if (laidUpDiameter <= 45) innerCoveringThickness = 1.4;
    else if (laidUpDiameter <= 60) innerCoveringThickness = 1.6;
    else innerCoveringThickness = 2.0;

    diameterUnderArmor = laidUpDiameter + 2 * innerCoveringThickness;
    const rLaidUp = laidUpDiameter / 2;
    const rUnderArmor = diameterUnderArmor / 2;
    const innerCoveringArea = Math.PI * (rUnderArmor * rUnderArmor - rLaidUp * rLaidUp);
    innerCoveringWeight = innerCoveringArea * DENSITIES.PVC; // Assuming PVC extruded inner covering
  }

  // 5. Armor
  let armorThickness = 0;
  let armorWeight = 0;
  let diameterOverArmor = diameterUnderArmor;

  if (effectiveParams.armorType === 'SWA' || effectiveParams.armorType === 'AWA') {
    // SWA Wire diameters according to IEC 60502-1
    if (diameterUnderArmor <= 10) armorThickness = 0.8;
    else if (diameterUnderArmor <= 15) armorThickness = 1.25;
    else if (diameterUnderArmor <= 25) armorThickness = 1.6;
    else if (diameterUnderArmor <= 35) armorThickness = 2.0;
    else if (diameterUnderArmor <= 60) armorThickness = 2.5;
    else armorThickness = 3.15;

    diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    
    // Approximate number of wires
    const meanArmorDiameter = diameterUnderArmor + armorThickness;
    const numWires = Math.floor((Math.PI * meanArmorDiameter) / (armorThickness * 1.05)); // 5% gap
    const wireArea = Math.PI * Math.pow(armorThickness / 2, 2);
    const armorDensity = effectiveParams.armorType === 'AWA' ? DENSITIES.Al : DENSITIES.Steel;
    armorWeight = numWires * wireArea * armorDensity * 1.05; // 5% lay factor
  } else if (effectiveParams.armorType === 'STA') {
    // STA Tape thickness
    if (diameterUnderArmor <= 30) armorThickness = 0.2;
    else if (diameterUnderArmor <= 70) armorThickness = 0.5;
    else armorThickness = 0.8;

    // 2 layers of tape, approx 25% overlap -> effective thickness ~ 2 * thickness
    diameterOverArmor = diameterUnderArmor + 4 * armorThickness;
    const meanArmorDiameter = diameterUnderArmor + 2 * armorThickness;
    // Area of tape approx = pi * D * 2 * t
    const tapeArea = Math.PI * meanArmorDiameter * 2 * armorThickness;
    armorWeight = tapeArea * DENSITIES.Steel;
  } else if (effectiveParams.armorType === 'SFA') {
    // Steel Flat & Tape Armour
    // Flat wire approx 0.8mm, Tape approx 0.2mm
    const flatThickness = 0.8;
    const tapeThickness = 0.2;
    armorThickness = flatThickness + tapeThickness;
    diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    
    const meanFlatDiameter = diameterUnderArmor + flatThickness;
    const flatArea = Math.PI * meanFlatDiameter * flatThickness * 0.9; // 90% coverage
    const meanTapeDiameter = diameterUnderArmor + 2 * flatThickness + tapeThickness;
    const tapeArea = Math.PI * meanTapeDiameter * tapeThickness * 1.2; // Overlap
    
    armorWeight = (flatArea + tapeArea) * DENSITIES.Steel;
  } else if (effectiveParams.armorType === 'RGB') {
    // Steel Wire & Tape Armour
    // Wire approx 1.25mm, Tape approx 0.2mm
    const wireDia = 1.25;
    const tapeThickness = 0.2;
    armorThickness = wireDia + tapeThickness;
    diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    
    const meanWireDiameter = diameterUnderArmor + wireDia;
    const numWires = Math.floor((Math.PI * meanWireDiameter) / (wireDia * 1.1));
    const wireArea = numWires * Math.PI * Math.pow(wireDia / 2, 2);
    const meanTapeDiameter = diameterUnderArmor + 2 * wireDia + tapeThickness;
    const tapeArea = Math.PI * meanTapeDiameter * tapeThickness * 1.2;
    
    armorWeight = (wireArea + tapeArea) * DENSITIES.Steel;
  } else if (effectiveParams.armorType === 'GSWB') {
    // Galvanized Steel Wire Braided (IEC 60092-353)
    let wireDia = 0.3;
    if (diameterUnderArmor <= 15) wireDia = 0.2;
    else wireDia = 0.3;
    
    // Braiding thickness is approx 2x wire diameter due to weave overlap
    armorThickness = wireDia * 2; 
    diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    
    const meanBraidDiameter = diameterUnderArmor + armorThickness;
    const coverageFactor = (effectiveParams.braidCoverage || 90) / 100;
    // Braiding factor formula: Area = pi * D * d * factor
    // factor is related to coverage. Standard coverage is often 90%
    const braidArea = Math.PI * meanBraidDiameter * wireDia * (coverageFactor * 1.5); 
    armorWeight = braidArea * DENSITIES.Steel;
  }

  // 6. Outer Sheath
  // IEC 60502-1 formula: ts = 0.035D + 1.0
  const fictitiousDiameter = diameterOverArmor;
  let sheathThickness = Math.max(1.4, Math.round((0.035 * fictitiousDiameter + 1.0) * 10) / 10);
  
  // Minimums for unarmored
  if (effectiveParams.armorType === 'Unarmored' && effectiveParams.cores === 1) {
    sheathThickness = Math.max(1.4, sheathThickness);
  } else if (effectiveParams.armorType === 'Unarmored' && effectiveParams.cores > 1) {
    sheathThickness = Math.max(1.8, sheathThickness);
  }

  // NYAF has no sheath
  if (effectiveParams.standard.includes('NYAF')) {
    sheathThickness = 0;
  }

  const overallDiameter = diameterOverArmor + 2 * sheathThickness;
  const rOverArmor = diameterOverArmor / 2;
  const rOverall = overallDiameter / 2;
  const sheathArea = Math.PI * (rOverall * rOverall - rOverArmor * rOverArmor);
  const sheathWeight = sheathThickness > 0 ? sheathArea * DENSITIES[effectiveParams.sheathMaterial] : 0;

  const totalWeight = totalConductorWeight + totalInsulationWeight + totalSemiCondWeight + innerCoveringWeight + armorWeight + sheathWeight + totalMvScreenWeight + totalMgtWeight;

  // Electrical
  const baseResistance = RESISTANCE_CU[effectiveParams.size] || 0;
  const maxDcResistance = effectiveParams.conductorMaterial === 'Cu' ? baseResistance : baseResistance * 1.61;
  
  const currentCapacityAir = effectiveParams.conductorMaterial === 'Cu' 
    ? CURRENT_CAPACITY_AIR_CU[effectiveParams.size] || 0 
    : CURRENT_CAPACITY_AIR_AL[effectiveParams.size] || 0;
    
  const currentCapacityGround = effectiveParams.conductorMaterial === 'Cu' 
    ? CURRENT_CAPACITY_GROUND_CU[effectiveParams.size] || 0 
    : CURRENT_CAPACITY_GROUND_AL[effectiveParams.size] || 0;

  // Test Voltage Calculation
  let testVoltage = '3.5 kV';
  let displayVoltage = effectiveParams.voltage;

  if (effectiveParams.standard === 'IEC 60502-2') {
    if (effectiveParams.voltage.includes('3.6/6')) testVoltage = '12.5 kV';
    else if (effectiveParams.voltage.includes('6/10')) testVoltage = '21 kV';
    else if (effectiveParams.voltage.includes('8.7/15')) testVoltage = '30.5 kV';
    else if (effectiveParams.voltage.includes('12/20')) testVoltage = '42 kV';
    else if (effectiveParams.voltage.includes('18/30')) testVoltage = '63 kV';
  } else if (effectiveParams.standard.includes('NYM')) {
    testVoltage = '2 kV';
  } else if (effectiveParams.standard.includes('NYAF')) {
    testVoltage = '2.5 kV';
  }

  // General
  const maxOperatingTemp = effectiveParams.insulationMaterial === 'XLPE' ? 90 : 70;
  const shortCircuitTemp = effectiveParams.insulationMaterial === 'XLPE' ? 250 : 160;
  const bendingFactor = effectiveParams.armorType === 'Unarmored' ? 8 : 12;
  const minBendingRadius = overallDiameter * bendingFactor;

  let standardRef = effectiveParams.standard;
  let flameRetardant = 'IEC 60332-1';

  if (effectiveParams.standard.includes('SNI')) {
    flameRetardant = 'SNI 04-6629.1';
  }

  // Extract braid wire diameter for spec display
  let braidWireDiameter: number | undefined;
  if (effectiveParams.armorType === 'GSWB') {
    braidWireDiameter = diameterUnderArmor <= 15 ? 0.2 : 0.3;
  }

  return {
    spec: {
      conductorDiameter: Number(conductorDiameter.toFixed(2)),
      insulationThickness: Number(insulationThickness.toFixed(2)),
      coreDiameter: Number(coreDiameter.toFixed(2)),
      laidUpDiameter: Number(laidUpDiameter.toFixed(2)),
      innerCoveringThickness: Number(innerCoveringThickness.toFixed(2)),
      diameterUnderArmor: Number(diameterUnderArmor.toFixed(2)),
      armorThickness: Number(armorThickness.toFixed(2)),
      diameterOverArmor: Number(diameterOverArmor.toFixed(2)),
      sheathThickness: Number(sheathThickness.toFixed(2)),
      overallDiameter: Number(overallDiameter.toFixed(2)),
      conductorScreenThickness: conductorScreenThickness > 0 ? conductorScreenThickness : undefined,
      insulationScreenThickness: insulationScreenThickness > 0 ? insulationScreenThickness : undefined,
      mvScreenDiameter: mvScreenThickness > 0 ? Number(diameterOverScreen.toFixed(2)) : undefined,
      mgtThickness: mgtThickness > 0 ? mgtThickness : undefined,
      braidWireDiameter,
      braidCoverage: effectiveParams.armorType === 'GSWB' ? (effectiveParams.braidCoverage || 90) : undefined,
    },
    bom: {
      conductorWeight: Number(totalConductorWeight.toFixed(1)),
      insulationWeight: Number(totalInsulationWeight.toFixed(1)),
      innerCoveringWeight: Number(innerCoveringWeight.toFixed(1)),
      armorWeight: Number(armorWeight.toFixed(1)),
      sheathWeight: Number(sheathWeight.toFixed(1)),
      semiCondWeight: Number(totalSemiCondWeight.toFixed(1)),
      mvScreenWeight: Number(totalMvScreenWeight.toFixed(1)),
      mgtWeight: Number(totalMgtWeight.toFixed(1)),
      totalWeight: Number(totalWeight.toFixed(1)),
    },
    electrical: {
      maxDcResistance: Number(maxDcResistance.toFixed(4)),
      currentCapacityAir: Number(currentCapacityAir.toFixed(0)),
      currentCapacityGround: Number(currentCapacityGround.toFixed(0)),
      voltageRating: displayVoltage,
      testVoltage: testVoltage,
    },
    general: {
      maxOperatingTemp,
      shortCircuitTemp,
      minBendingRadius: Number(minBendingRadius.toFixed(1)),
      standardReference: standardRef,
      flameRetardant: flameRetardant,
    },
  };
}

export const CABLE_SIZES = CABLE_DATA.map(d => d.size);
