import { CableDesignParams, CalculationResult,  } from './cableCalculations';
import { CONDUCTOR_RESISTIVITY, INSTRUMENT_FACTORS } from './conductorData';
import { DrumData } from './drumData';

export const getCableDesignation = (p: CableDesignParams, r: CalculationResult | null) => {
  if (!r) return '';
  
  if (p.standard === 'SPLN 41-6 : 1981 AAC') {
    return `AAC ${p.size}`;
  }
  
  if (p.standard === 'SPLN 41-10 : 1991 (AAAC-S)') {
    return `AAAC-S ${p.size}`;
  }

  if (p.standard === 'BS EN 50288-7') {
    const formation = p.formationType || 'Pair';
    const isOs = p.hasIndividualScreen && p.hasOverallScreen ? 'IS-OS' : (p.hasOverallScreen ? 'OS' : (p.hasIndividualScreen ? 'IS' : ''));
    const armor = p.armorType !== 'Unarmored' ? `/${p.armorType}` : '';
    const mgt = p.fireguard ? '/MGT' : '';
    const sheath = p.hasOuterSheath !== false ? `/${p.sheathMaterial}` : '';
    const construction = `${p.conductorMaterial}${mgt}/${p.insulationMaterial}${isOs ? '/' + isOs : ''}${armor}${sheath}`.toUpperCase();
    const elements = formation === 'Pair' ? '2' : (formation === 'Triad' ? '3' : '1');
    const sizeStr = formation === 'Core' ? `${p.cores} x ${p.size} mm²` : `${p.formationCount || 1} x ${elements} x ${p.instrumentationSize || p.size} mm²`;
    return `${p.standard} ${construction} ${sizeStr} ${p.voltage}`;
  }

  if (p.standard.includes('NFA2X-T')) {
    return `NFA2X-T ${p.cores} x ${p.size} + ${p.earthingSize} mm² ${r.electrical.voltageRating}`;
  }
  if (p.standard.includes('NFA2X')) {
    return `NFA2X ${p.cores} x ${p.size} mm² ${r.electrical.voltageRating}`;
  }

  if (p.standard.includes('(NYA)') || p.standard.includes('(NYAF)')) {
    return `${p.conductorMaterial}/${p.insulationMaterial} ${p.cores} x ${p.size} mm² (${p.conductorType}) ${r.electrical.voltageRating}`;
  }

  const fg = p.fireguard ? '/MGT' : (p.hasMgt ? '/MGT' : '');
  const mvScreen = (p.mvScreenType && p.mvScreenType !== 'None') ? `/${p.mvScreenType}` : '';
  const overallScreen = (p.hasScreen && p.screenType && p.screenType !== 'None') ? `/${p.screenType}` : '';
  const separator = (p.hasSeparator || (p.hasScreen && p.armorType !== 'Unarmored')) ? `/${p.separatorMaterial || 'PVC'}` : '';
  const armor = p.armorType === 'Unarmored' ? '' : `/${p.armorType}`;
  const sheath = p.hasOuterSheath !== false ? `/${p.sheathMaterial}` : '';
  
  let sizeDesignation = `${p.cores} x ${p.size}`;
  if (p.hasEarthing && p.earthingCores && p.earthingCores > 0 && p.earthingSize && p.earthingSize > 0) {
    if (p.earthingCores === 1) {
      sizeDesignation += ` + ${p.earthingSize}`;
    } else {
      sizeDesignation += ` + ${p.earthingCores} x ${p.earthingSize}`;
    }
  }

  return `${p.conductorMaterial}${fg}/${p.insulationMaterial}${mvScreen}${overallScreen}${separator}${armor}${sheath} ${sizeDesignation} mm² (${p.conductorType}) ${r.electrical.voltageRating}`;
};

export const getConstructionKey = (p: CableDesignParams) => {
  return [
    p.standard,
    p.voltage,
    p.conductorMaterial,
    p.conductorType,
    p.insulationMaterial,
    p.hasInnerSheath,
    p.innerSheathMaterial,
    p.armorType,
    p.sheathMaterial,
    p.hasMgt,
    p.hasScreen,
    p.screenType,
    p.mvScreenType,
    p.fireguard,
    p.stopfire,
    p.flameRetardantCategory,
    p.formationType,
    p.hasIndividualScreen,
    p.hasOverallScreen
  ].join('|');
};

export const calculateCostBreakdown = (bom: CalculationResult['bom'], params: CableDesignParams, materialPrices: Record<string, number>, pricesOverride?: Record<string, number>) => {
  const prices = pricesOverride || { ...materialPrices, ...(params.customMaterialPrices || {}) };
  const getPrice = (mat: string, fallback: number) => prices[mat] !== undefined ? prices[mat] : fallback;
  
  const isMV = params.voltage.includes('/') && (
    params.voltage.includes('3.6/6') || 
    params.voltage.includes('6/10') || 
    params.voltage.includes('8.7/15') || 
    params.voltage.includes('12/20') || 
    params.voltage.includes('18/30')
  );
  const isInstrumentation = params.standard === 'BS EN 50288-7' || (params.standard === 'Manufacturing Specification' && params.hasScreen) || params.standard.includes('Instrument');
  
  const condPrice = (params.conductorMaterial === 'Cu' ? getPrice('Cu', 0) : (params.conductorMaterial === 'Al' ? getPrice('Al', 0) : getPrice('TCu', 0)));
  const insPrice = getPrice(params.insulationMaterial, getPrice('XLPE', 0));
  const armorWirePrice = (
    params.armorType === 'AWA' ? getPrice('AWA', getPrice('Al', 0)) : 
    params.armorType === 'SWA' ? getPrice('SWA', getPrice('SteelWire', 0)) : 
    params.armorType === 'SFA' ? getPrice('SFA', getPrice('SteelWire', 0)) : 
    params.armorType === 'RGB' ? getPrice('RGB', getPrice('SteelWire', 0)) : 
    params.armorType === 'GSWB' ? getPrice('GSWB', getPrice('SteelWire', 0)) : 
    params.armorType === 'TCWB' ? getPrice('TCWB', getPrice('TCu', 0)) : 
    getPrice('SteelWire', getPrice('Steel', 0))
  );
  const armorTapePrice = getPrice('STA', getPrice('Steel', 0));
  const sheathPrice = getPrice(params.sheathMaterial, getPrice('PVC', 0));
  const innerPrice = getPrice(params.innerSheathMaterial || 'PVC', getPrice('PVC', 0));
  const separatorPrice = getPrice(params.separatorMaterial || 'PVC', getPrice('PVC', 0));
  const innerSemiPrice = getPrice('Inner Semi Conductive', 65000);
  const outerSemiPrice = getPrice('Outer Semi Conductive', 65000);
  const screenPrice = params.screenType === 'CTS' ? getPrice('CTS', getPrice('Cu', 0)) : (params.screenType === 'CWS' ? getPrice('Cu', 0) : getPrice('Steel', 0));
  const mvScreenPrice = getPrice('Cu', 0);
  const mgtPrice = getPrice(params.fireProofMaterial || 'MGT', 120000);
  const steelWirePrice = getPrice('SteelWire', 50000);

  const breakdown: any = {
    conductor: ((bom.conductorWeight - bom.earthingConductorWeight) * condPrice) / 1000,
    insulation: ((bom.insulationWeight - bom.earthingInsulationWeight) * insPrice) / 1000,
    armorWire: bom.armorWireWeight ? (bom.armorWireWeight * armorWirePrice) / 1000 : 0,
    armorTape: bom.armorTapeWeight ? (bom.armorTapeWeight * armorTapePrice) / 1000 : 0,
    sheath: (bom.sheathWeight * sheathPrice) / 1000,
    innerCovering: (bom.innerCoveringWeight * innerPrice) / 1000,
    cablingFiller: (bom.cablingFillerWeight ? (bom.cablingFillerWeight * getPrice(params.cablingFillerType === 'Extruded' ? (params.cablingFillerMaterial || 'PVC') : (params.cablingFillerType || 'PP Yarn'), 0)) / 1000 : 0),
    screen: (!isMV && !isInstrumentation && params.hasScreen) 
      ? (params.screenType === 'CTS'
          ? (((bom.copperTapeWeight || 0) * getPrice('CTS', getPrice('Cu', 0))) + ((bom.polyesterTapeWeight || 0) * getPrice('Polyester Tape', 10000))) / 1000
          : (((bom.copperWireWeight || 0) * getPrice('Cu', 0)) + ((bom.copperTapeWeight || 0) * getPrice('CTS', getPrice('Cu', 0))) + ((bom.polyesterTapeWeight || 0) * getPrice('Polyester Tape', 10000))) / 1000)
      : (bom.screenWeight * screenPrice) / 1000,
    separator: (bom.separatorWeight * separatorPrice) / 1000,
    semiCond: ((bom.innerSemiCondWeight * innerSemiPrice) + (bom.outerSemiCondWeight * outerSemiPrice)) / 1000,
    mvScreen: (params.standard === 'IEC 60502-2' && params.mvScreenType && params.mvScreenType !== 'None')
      ? (params.mvScreenType === 'CTS' 
          ? (((bom.copperTapeWeight || 0) * getPrice('CTS', getPrice('Cu', 0))) + ((bom.polyesterTapeWeight || 0) * getPrice('Polyester Tape', 10000))) / 1000
          : (((bom.copperWireWeight || 0) * getPrice('Cu', 0)) + ((bom.copperTapeWeight || 0) * getPrice('CTS', getPrice('Cu', 0))) + ((bom.polyesterTapeWeight || 0) * getPrice('Polyester Tape', 10000))) / 1000)
      : (bom.mvScreenWeight * mvScreenPrice) / 1000,
    mgt: (bom.mgtWeight * mgtPrice) / 1000,
    isAl: bom.isAlWeight ? (bom.isAlWeight * getPrice('Aluminium Foil', getPrice('Al', 0))) / 1000 : 0,
    isDrain: bom.isDrainWeight ? (bom.isDrainWeight * getPrice('TCu', getPrice('Cu', 0))) / 1000 : 0,
    isPet: bom.isPetWeight ? (bom.isPetWeight * getPrice('Polyester Tape', 10000)) / 1000 : 0,
    binderTape: bom.binderTapeWeight ? (bom.binderTapeWeight * getPrice('Polyester Tape', 10000)) / 1000 : 0,
    binderTapeOverArmor: bom.binderTapeOverArmorWeight ? (bom.binderTapeOverArmorWeight * getPrice('Polyester Tape', 10000)) / 1000 : 0,
    osAl: bom.osAlWeight ? (bom.osAlWeight * getPrice('Aluminium Foil', getPrice('Al', 0))) / 1000 : 0,
    osDrain: bom.osDrainWeight ? (bom.osDrainWeight * getPrice('TCu', getPrice('Cu', 0))) / 1000 : 0,
    osPet: bom.osPetWeight ? (bom.osPetWeight * getPrice('Polyester Tape', 10000)) / 1000 : 0,
    masterbatch: bom.masterbatchWeight ? (bom.masterbatchWeight * getPrice('Masterbatch', 50000)) / 1000 : 0,
  };

  if (params.otherItems && params.otherItems.length > 0) {
    const totalOtherCost = params.otherItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const orderLength = params.orderLength || 1000;
    breakdown.otherItems = totalOtherCost / orderLength;
  }

  if (params.standard.includes('NFA2X-T') && bom.earthingAlWeight !== undefined && bom.earthingSteelWeight !== undefined) {
    breakdown.earthingAl = (bom.earthingAlWeight * getPrice('Al', 0)) / 1000;
    breakdown.earthingSteel = (bom.earthingSteelWeight * steelWirePrice) / 1000;
    breakdown.earthingInsulation = (bom.earthingInsulationWeight * insPrice) / 1000;
  } else {
    breakdown.earthingConductor = (bom.earthingConductorWeight * condPrice) / 1000;
    breakdown.earthingInsulation = (bom.earthingInsulationWeight * insPrice) / 1000;
  }

  return breakdown;
};

export const calculatePacking = (overallDiameter: number, totalWeight: number, drumData: DrumData[]) => {
  let standardLength = 300;
  if (overallDiameter <= 40) standardLength = 1000;
  else if (overallDiameter <= 50) standardLength = 500;

  const CLEARANCE = 100;

  const sortedDrums = [...drumData].sort((a, b) => {
    const effD_A = Math.max(0, a.diameterWithCover - CLEARANCE);
    const effD_B = Math.max(0, b.diameterWithCover - CLEARANCE);
    const volA = (Math.PI * (Math.pow(effD_A, 2) - Math.pow(a.barrelDiameter, 2)) / 4) * a.outerWidth;
    const volB = (Math.PI * (Math.pow(effD_B, 2) - Math.pow(b.barrelDiameter, 2)) / 4) * b.outerWidth;
    return volA - volB;
  });

  let selectedDrum = sortedDrums[sortedDrums.length - 1];
  for (const drum of sortedDrums) {
    const effD = Math.max(0, drum.diameterWithCover - CLEARANCE);
    if (effD <= drum.barrelDiameter) continue;
    if (drum.barrelDiameter < overallDiameter * 15) continue;
    const effectiveOD = overallDiameter + 5;
    const capacity = (drum.innerWidth * (Math.pow(effD, 2) - Math.pow(drum.barrelDiameter, 2))) / (1000 * Math.pow(effectiveOD, 2) * 1.15);
    
    if (capacity >= standardLength) {
      selectedDrum = drum;
      break;
    }
  }

  const netWeight = (totalWeight * standardLength) / 1000;
  const grossWeight = netWeight + selectedDrum.weight;
  const packingCostPerMeter = selectedDrum.price / standardLength;

  return {
    standardLength,
    selectedDrum,
    netWeight,
    grossWeight,
    packingCostPerMeter
  };
};

export function getDefaultInsulationColor(cores: number, hasEarthing: boolean, isMV: boolean, isABC: boolean, formationType: string | undefined): string {
  if (isABC) return 'Black';
  if (isMV) return 'Standard';
  
  if (formationType === 'Pair') {
      const pairs = cores / 2;
      return pairs > 1 ? 'Black-White with numbering mark' : 'Black-White';
  }
  if (formationType === 'Triad') {
      const triads = cores / 3;
      return triads > 1 ? 'Black, White, Red with numbering mark' : 'Black, White, Red';
  }
  if (formationType === 'Core') {
      return cores > 1 ? 'Black with numbering mark' : 'Black';
  }
  
  if (cores === 1) return 'Black';
  if (cores === 2) return 'Blue, Black';
  if (cores === 3) return 'Brown, Black, Grey';
  if (cores === 4) return 'Blue, Brown, Black, Grey';
  if (cores === 5) {
    if (hasEarthing) return 'Black with Numbering';
    return 'Blue, Brown, Black, Grey, Y/G';
  }
  if (cores > 5) return 'Black with Numbering';
  return 'Standard (IEC)';
}

export const calculateHPP = (res: CalculationResult, par: CableDesignParams, materialPrices: Record<string, number>, drumData: DrumData[], pricesOverride?: Record<string, number>) => {
  const breakdown = calculateCostBreakdown(res.bom, par, materialPrices, pricesOverride);
  const baseHpp = (Object.values(breakdown) as number[]).reduce((a: number, b: number) => a + (typeof b === 'number' ? b : 0), 0);
  const packing = calculatePacking(res.spec.overallDiameter, res.bom.totalWeight, drumData);
  const hppWithPacking = baseHpp + packing.packingCostPerMeter;
  const overheadFactor = 1 + (par.overhead || 0) / 100;
  return hppWithPacking * overheadFactor;
};

export function calculateSellingPrice(hpp: number, margin: number = 0) {
  // Prevent division by zero or negative price if margin >= 100
  const safeMargin = margin >= 100 ? 99.99 : margin;
  const price = hpp / (1 - safeMargin / 100);
  // Round up to nearest 100 (-2 in Excel ROUNDUP)
  return Math.ceil(price / 100) * 100;
}
