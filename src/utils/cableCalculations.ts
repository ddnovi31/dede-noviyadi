import { evaluate } from 'mathjs';
import { KHA_DATA, KHA_CORRECTION_FACTORS, NYM_KHA_DATA, NYMHY_DATA } from './khaData';
import { MV_KHA_DATA } from './mvKhaData';
import { MARINE_KHA_DATA } from './marineKhaData';

export type ConductorMaterial = string;
export type ConductorType = 're' | 'rm' | 'sm' | 'f' | 'cm';
export type InsulationMaterial = string;
export type ArmorType = 'Unarmored' | 'SWA' | 'STA' | 'AWA' | 'SFA' | 'RGB' | 'GSWB' | 'TCWB' | 'CWB';
export type SheathMaterial = string;
export type FlameRetardantCategory = 'None' | 'Cat.A' | 'Cat.B' | 'Cat.C';
export type MvScreenType = 'None' | 'CTS' | 'CWS';
export type ScreenType = 'None' | 'CTS' | 'CWS';
export type CableStandard = 'IEC 60502-1' | 'IEC 60502-2' | 'IEC 60092-353' | 'SNI 04-6629.4 (NYM)' | 'SNI 04-6629.3 (NYAF)' | 'SNI 04-6629.3 (NYA)' | 'SNI 04-6629.5 (NYMHY)' | 'SPLN D3. 010-1 : 2014 (NFA2X)' | 'SPLN D3. 010-1 : 2015 (NFA2X-T)' | 'BS EN 50288-7' | 'SPLN 43-4 (NYCY)' | 'LiYCY';
export type FormationType = 'Core' | 'Pair' | 'Triad';
export type DesignMode = 'standard' | 'advance';

export interface CableDesignParams {
  id?: string;
  projectName?: string;
  mode?: DesignMode;
  cores: number;
  size: number;
  conductorMaterial: ConductorMaterial;
  conductorType: ConductorType;
  insulationMaterial: InsulationMaterial;
  armorType: ArmorType;
  staOverlap?: number;
  sheathMaterial: SheathMaterial;
  innerSheathMaterial?: SheathMaterial;
  voltage: string;
  standard: CableStandard;
  braidCoverage?: number; // Percentage, e.g., 90
  mvScreenType?: MvScreenType;
  mvScreenSize?: number; // For CWS (e.g., 16, 25, 35 mm2)
  hasMgt?: boolean;
  hasInnerSheath?: boolean;
  hasScreen?: boolean;
  screenType?: ScreenType;
  screenSize?: number;
  hasSeparator?: boolean;
  separatorMaterial?: SheathMaterial;
  fireguard?: boolean;
  stopfire?: boolean;
  flameRetardantCategory?: FlameRetardantCategory;
  overhead?: number; // Percentage, e.g., 10 for 10%
  margin?: number; // Percentage, e.g., 20 for 20%
  hasEarthing?: boolean;
  earthingCores?: number;
  earthingSize?: number;
  cablingModel?: 'Auto' | 'Single Circle' | 'Groove';
  orderLength?: number; // In meters
  ambientTemperature?: number; // In degrees Celsius
  
  // Instrumentation specific
  formationType?: FormationType;
  formationCount?: number;
  instrumentationSize?: number;
  hasIndividualScreen?: boolean;
  hasOverallScreen?: boolean;
  
  // Custom Material Prices
  customMaterialPrices?: Record<string, number>;
  
  // Manual Overrides
  manualWireCount?: number;
  manualWireDiameter?: number;
  manualInsulationThickness?: number;
  manualInnerSheathThickness?: number;
  manualSheathThickness?: number;
  manualConductorDiameter?: number;
  manualArmorThickness?: number;
  manualArmorWireDiameter?: number;
  manualArmorTapeThickness?: number;
  manualArmorFlatThickness?: number;
  manualBraidWireDiameter?: number;
  manualGswbCarriers?: number;
  manualGswbWiresPerCarrier?: number;
  manualGswbLayPitch?: number;
  manualConductorScreenThickness?: number;
  manualInsulationScreenThickness?: number;
  manualMgtThickness?: number;
  manualScreenThickness?: number;
  manualMvScreenThickness?: number;
  manualSeparatorThickness?: number;
  
  // Screen Wire Overrides
  manualScreenWireCount?: number;
  manualScreenWireDiameter?: number;
  manualMvScreenWireCount?: number;
  manualMvScreenWireDiameter?: number;
  
  // IS/OS Overrides
  manualIsAluminiumThickness?: number;
  manualIsAluminiumOverlap?: number;
  manualIsDrainWireCount?: number;
  manualIsDrainWireDiameter?: number;
  manualIsDrainWireSize?: number;
  manualIsPolyesterThickness?: number;
  manualIsPolyesterOverlap?: number;
  
  manualOsAluminiumThickness?: number;
  manualOsAluminiumOverlap?: number;
  manualOsDrainWireCount?: number;
  manualOsDrainWireDiameter?: number;
  manualOsDrainWireSize?: number;
  manualOsPolyesterThickness?: number;
  manualOsPolyesterOverlap?: number;
  
  // Earthing Overrides
  manualEarthingWireCount?: number;
  manualEarthingWireDiameter?: number;
  manualEarthingSteelWireCount?: number;
  manualEarthingSteelWireDiameter?: number;
  manualEarthingConductorDiameter?: number;
  manualEarthingInsulationThickness?: number;

  // Formula Overrides (Intermediate Diameters)
  manualLaidUpDiameter?: number;
  manualDiameterUnderArmor?: number;
  manualDiameterOverArmor?: number;
  manualOverallDiameter?: number;
  manualTotalWeight?: number;

  // Custom Formulas for Material Weights
  customFormulas?: Record<string, string>;
}

interface SizeData {
  size: number;
  diameter: number;
  xlpeThick: number;
  pvcThick: number;
}

export const CABLE_DATA: SizeData[] = [
  { size: 0.5, diameter: 0.9, xlpeThick: 0.5, pvcThick: 0.6 },
  { size: 0.75, diameter: 1.1, xlpeThick: 0.5, pvcThick: 0.6 },
  { size: 1, diameter: 1.3, xlpeThick: 0.5, pvcThick: 0.6 },
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

export interface MaterialDensities {
  Cu: number;
  Al: number;
  XLPE: number;
  PVC: number;
  PE: number;
  LSZH: number;
  Steel: number;
  SteelWire: number;
  SemiCond: number;
  MGT: number;
  TCu: number;
  'PVC-FR': number;
  'PVC-FR Cat.A': number;
  'PVC-FR Cat.B': number;
  'PVC-FR Cat.C': number;
  SHF1: number;
  SHF2: number;
  EPR: number;
  HEPR: number;
  TCWB: number;
  CTS: number;
  CWS: number;
  STA: number;
  SWA: number;
  AWA: number;
  GSWB: number;
  SFA: number;
  RGB: number;
}

const DEFAULT_DENSITIES: MaterialDensities = {
  Cu: 8.89,
  Al: 2.7,
  XLPE: 0.92,
  PVC: 1.45,
  PE: 0.95,
  LSZH: 1.5,
  Steel: 7.85,
  SteelWire: 7.85,
  SemiCond: 1.15,
  MGT: 2.2,
  TCu: 8.89,
  'PVC-FR': 1.55,
  'PVC-FR Cat.A': 1.55,
  'PVC-FR Cat.B': 1.55,
  'PVC-FR Cat.C': 1.55,
  SHF1: 1.5,
  SHF2: 1.6,
  EPR: 1.3,
  HEPR: 1.3,
  TCWB: 8.89,
  CTS: 8.89,
  CWS: 8.89,
  STA: 7.85,
  SWA: 7.85,
  AWA: 2.7,
  GSWB: 7.85,
  SFA: 7.85,
  RGB: 7.85,
};

// Laying up factors for multi-core cables (approximate)
const LAYING_UP_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 2.15,
  4: 2.41,
  5: 2.7,
  7: 3.0,
  10: 3.7,
  12: 4.15,
  14: 4.41,
  19: 5.0,
  24: 5.7,
  30: 6.41,
  37: 7.0,
  48: 8.0,
  61: 9.0,
  80: 10.5,
};

interface ABCData {
  size: number;
  wireCount: number;
  wireDiameter: number;
  condDiameter: number;
  condWeight: number;
  insulationThickness: number;
  coreDiameter: number;
  resistance: number;
  ampacity: number;
  netWeight: number;
  breakingLoad?: number;
}

interface ABCMessengerData extends ABCData {
  alWireCount: number;
  alWireDiameter: number;
  steelWireCount: number;
  steelWireDiameter: number;
}

/**
 * Returns the weight addition factor (PENAMBAHAN BERAT) based on n.
 * n is wire count for insulation or core count for inner sheath.
 */
export const getWeightAdditionFactor = (n: number): number => {
  if (n <= 1) return 0;
  if (n === 2) return 0.113;
  if (n === 3) return 0.081;
  if (n === 4) return 0.064;
  if (n === 5) return 0.05;
  if (n >= 6 && n <= 12) return 0.045;
  if (n >= 13 && n <= 18) return 0.035;
  if (n >= 19 && n <= 24) return 0.028;
  if (n >= 25 && n <= 27) return 0.027;
  if (n >= 28 && n <= 31) return 0.026;
  if (n >= 32 && n <= 36) return 0.025;
  if (n >= 37 && n <= 46) return 0.023;
  if (n >= 47 && n <= 56) return 0.022;
  if (n >= 57 && n <= 66) return 0.021;
  if (n >= 67 && n <= 79) return 0.02;
  if (n >= 80 && n <= 91) return 0.019;
  return 0.019;
};

const NFA2X_DATA: Record<string, ABCData> = {
  '2x10': { size: 10, wireCount: 7, wireDiameter: 1.35, condDiameter: 4.05, condWeight: 27.61, insulationThickness: 1.20, coreDiameter: 6.45, resistance: 3.08, ampacity: 54, netWeight: 100.4, breakingLoad: 3.22 },
  '2x16': { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 72, netWeight: 144.2, breakingLoad: 5.15 },
  '4x10': { size: 10, wireCount: 7, wireDiameter: 1.35, condDiameter: 4.05, condWeight: 27.61, insulationThickness: 1.20, coreDiameter: 6.45, resistance: 3.08, ampacity: 54, netWeight: 200.8, breakingLoad: 6.44 },
  '4x16': { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 72, netWeight: 288.4, breakingLoad: 10.30 },
  '4x25': { size: 25, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.39, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.19, resistance: 1.20, ampacity: 102, netWeight: 437.8, breakingLoad: 16.10 },
  '4x35': { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 603.7, breakingLoad: 22.54 },
};

export const NFA2XT_DATA: Record<string, { phase: ABCData, messenger: ABCMessengerData, netWeight: number }> = {
  '2x25+25': {
    phase: { size: 25, wireCount: 7, wireDiameter: 2.12, condDiameter: 6.36, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.16, resistance: 1.20, ampacity: 105, netWeight: 0 },
    messenger: { size: 25, wireCount: 7, wireDiameter: 2.12, condDiameter: 6.36, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.16, resistance: 1.38, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.12, steelWireCount: 1, steelWireDiameter: 2.12, breakingLoad: 8.52 },
    netWeight: 320
  },
  '2x35+25': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 25, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.48, condWeight: 68.73, insulationThickness: 1.4, coreDiameter: 9.28, resistance: 1.38, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.13, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 8.52 },
    netWeight: 410
  },
  '2x35+35': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.73, condDiameter: 8.31, condWeight: 96.21, insulationThickness: 1.5, coreDiameter: 11.31, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.73, steelWireCount: 1, steelWireDiameter: 2.73, breakingLoad: 11.90 },
    netWeight: 500
  },
  '2x35+50': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 600
  },
  '2x50+35': {
    phase: { size: 50, wireCount: 7, wireDiameter: 3.02, condDiameter: 9.06, condWeight: 137.4, insulationThickness: 1.60, coreDiameter: 12.35, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.52, steelWireCount: 1, steelWireDiameter: 2.52, breakingLoad: 11.90 },
    netWeight: 560
  },
  '2x50+50': {
    phase: { size: 50, wireCount: 7, wireDiameter: 3.02, condDiameter: 9.19, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.39, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 900
  },
  '2x70+50': {
    phase: { size: 70, wireCount: 19, wireDiameter: 2.17, condDiameter: 10.88, condWeight: 192.4, insulationThickness: 1.8, coreDiameter: 14.48, resistance: 0.443, ampacity: 191, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 800
  },
  '2x70+70': {
    phase: { size: 70, wireCount: 19, wireDiameter: 2.17, condDiameter: 10.88, condWeight: 192.4, insulationThickness: 1.8, coreDiameter: 14.48, resistance: 0.443, ampacity: 191, netWeight: 0 },
    messenger: { size: 70, wireCount: 7, wireDiameter: 3.85, condDiameter: 11.71, condWeight: 192.4, insulationThickness: 1.6, coreDiameter: 14.91, resistance: 0.418, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.85, steelWireCount: 1, steelWireDiameter: 3.85, breakingLoad: 24.03 },
    netWeight: 950
  },
  '2x95+70': {
    phase: { size: 95, wireCount: 19, wireDiameter: 2.52, condDiameter: 12.60, condWeight: 261.3, insulationThickness: 1.80, coreDiameter: 16.20, resistance: 0.320, ampacity: 235, netWeight: 0 },
    messenger: { size: 70, wireCount: 7, wireDiameter: 3.85, condDiameter: 11.55, condWeight: 192.4, insulationThickness: 1.60, coreDiameter: 14.80, resistance: 0.418, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.85, steelWireCount: 1, steelWireDiameter: 3.85, breakingLoad: 24.03 },
    netWeight: 1100
  },
  '2x120+95': {
    phase: { size: 120, wireCount: 19, wireDiameter: 2.84, condDiameter: 14.20, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.85, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 95, wireCount: 19, wireDiameter: 2.52, condDiameter: 12.60, condWeight: 261.3, insulationThickness: 1.80, coreDiameter: 16.20, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 18, alWireDiameter: 2.52, steelWireCount: 1, steelWireDiameter: 2.52, breakingLoad: 32.64 },
    netWeight: 1400
  },
  '3x35+25': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.48, condWeight: 96.21, insulationThickness: 1.4, coreDiameter: 9.28, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.13, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 11.90 },
    netWeight: 545
  },
  '3x35+35': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.73, condDiameter: 8.31, condWeight: 96.21, insulationThickness: 1.5, coreDiameter: 11.31, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.73, steelWireCount: 1, steelWireDiameter: 2.73, breakingLoad: 11.90 },
    netWeight: 600
  },
  '3x35+50': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 700
  },
  '3x50+35': {
    phase: { size: 50, wireCount: 7, wireDiameter: 3.02, condDiameter: 9.19, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.39, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.67, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 10.87, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.52, steelWireCount: 0, steelWireDiameter: 2.73, breakingLoad: 17.00 },
    netWeight: 750
  },
  '3x70+50': {
    phase: { size: 70, wireCount: 19, wireDiameter: 2.17, condDiameter: 10.88, condWeight: 192.4, insulationThickness: 1.8, coreDiameter: 14.48, resistance: 0.443, ampacity: 191, netWeight: 0 },
    messenger: { size: 70, wireCount: 7, wireDiameter: 3.02, condDiameter: 9.19, condWeight: 192.4, insulationThickness: 1.6, coreDiameter: 12.39, resistance: 0.418, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 3.02, steelWireCount: 0, steelWireDiameter: 3.26, breakingLoad: 24.03 },
    netWeight: 1050
  },
  '3x70+70': {
    phase: { size: 70, wireCount: 19, wireDiameter: 2.17, condDiameter: 10.88, condWeight: 192.4, insulationThickness: 1.8, coreDiameter: 14.48, resistance: 0.443, ampacity: 196, netWeight: 0 },
    messenger: { size: 70, wireCount: 7, wireDiameter: 3.85, condDiameter: 11.71, condWeight: 192.4, insulationThickness: 1.6, coreDiameter: 14.91, resistance: 0.418, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.85, steelWireCount: 1, steelWireDiameter: 3.85, breakingLoad: 24.03 },
    netWeight: 1200
  },
  '3x95+70': {
    phase: { size: 95, wireCount: 19, wireDiameter: 2.52, condDiameter: 12.63, condWeight: 261.3, insulationThickness: 1.8, coreDiameter: 16.23, resistance: 0.320, ampacity: 235, netWeight: 0 },
    messenger: { size: 95, wireCount: 19, wireDiameter: 2.17, condDiameter: 10.88, condWeight: 261.3, insulationThickness: 1.6, coreDiameter: 14.08, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 19, alWireDiameter: 2.17, steelWireCount: 0, steelWireDiameter: 3.85, breakingLoad: 32.64 },
    netWeight: 1550
  },
  '3x120+95': {
    phase: { size: 120, wireCount: 19, wireDiameter: 2.82, condDiameter: 14.14, condWeight: 330.1, insulationThickness: 1.8, coreDiameter: 17.74, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 95, wireCount: 33, wireDiameter: 2.14, condDiameter: 14.14, condWeight: 261.3, insulationThickness: 1.6, coreDiameter: 17.34, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 26, alWireDiameter: 2.14, steelWireCount: 7, steelWireDiameter: 1.68, breakingLoad: 32.64 },
    netWeight: 1950
  },
  '3x50+50': {
    phase: { size: 50, wireCount: 7, wireDiameter: 3.02, condDiameter: 9.19, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.39, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 900
  },
  '3x95+95': {
    phase: { size: 95, wireCount: 19, wireDiameter: 2.5, condDiameter: 12.53, condWeight: 261.3, insulationThickness: 1.8, coreDiameter: 16.13, resistance: 0.320, ampacity: 235, netWeight: 0 },
    messenger: { size: 95, wireCount: 33, wireDiameter: 2.16, condDiameter: 14.27, condWeight: 261.3, insulationThickness: 1.6, coreDiameter: 17.47, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 26, alWireDiameter: 2.16, steelWireCount: 7, steelWireDiameter: 1.68, breakingLoad: 32.64 },
    netWeight: 1700
  },
  '3x120+120': {
    phase: { size: 120, wireCount: 19, wireDiameter: 2.84, condDiameter: 14.20, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.85, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.85, condDiameter: 14.25, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.85, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 18, alWireDiameter: 2.85, steelWireCount: 1, steelWireDiameter: 2.85, breakingLoad: 40.0 },
    netWeight: 2100
  },
  '3x25+16': {
    phase: { size: 25, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.39, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.19, resistance: 1.20, ampacity: 105, netWeight: 0 },
    messenger: { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 1.71, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 5.15 },
    netWeight: 450
  },
  '3x35+16': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 1.71, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 5.15 },
    netWeight: 520
  },
  '3x150+120': {
    phase: { size: 150, wireCount: 37, wireDiameter: 2.25, condDiameter: 15.75, condWeight: 412.6, insulationThickness: 2.00, coreDiameter: 19.75, resistance: 0.206, ampacity: 315, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.75, condDiameter: 13.75, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.35, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 19, alWireDiameter: 2.75, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 35.0 },
    netWeight: 2400
  },
  '3x185+150': {
    phase: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 2.00, coreDiameter: 21.64, resistance: 0.164, ampacity: 360, netWeight: 0 },
    messenger: { size: 150, wireCount: 37, wireDiameter: 2.25, condDiameter: 15.75, condWeight: 412.6, insulationThickness: 1.80, coreDiameter: 19.35, resistance: 0.206, ampacity: 0, netWeight: 0, alWireCount: 37, alWireDiameter: 2.25, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 42.0 },
    netWeight: 2900
  },
  '3x185+185': {
    phase: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 2.00, coreDiameter: 21.64, resistance: 0.164, ampacity: 360, netWeight: 0 },
    messenger: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 1.80, coreDiameter: 21.24, resistance: 0.164, ampacity: 0, netWeight: 0, alWireCount: 37, alWireDiameter: 2.52, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 50.0 },
    netWeight: 3300
  },
  '3x240+120': {
    phase: { size: 240, wireCount: 61, wireDiameter: 2.25, condDiameter: 20.25, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.25, resistance: 0.125, ampacity: 425, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.75, condDiameter: 13.75, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.35, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 19, alWireDiameter: 2.75, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 35.0 },
    netWeight: 3100
  },
  '3x240+240': {
    phase: { size: 240, wireCount: 61, wireDiameter: 2.23, condDiameter: 20.07, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.07, resistance: 0.125, ampacity: 425, netWeight: 0 },
    messenger: { size: 240, wireCount: 61, wireDiameter: 2.23, condDiameter: 20.07, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.07, resistance: 0.125, ampacity: 0, netWeight: 0, alWireCount: 61, alWireDiameter: 2.23, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 60.0 },
    netWeight: 3800
  }
};

export interface NYCYData {
  size: number;
  screenSize: number;
  insulationThick: number;
  innerSheathEkstrusi: number;
  innerSheathPita: number;
  outerSheathThick: number;
  khaTanah: number;
  khaUdara: number;
}

export interface NYA_NYAFData {
  size: number;
  khaTanah: number;
  khaUdara: number;
}

export const NYCY_DATA: Record<string, NYCYData> = {
  '1x1.5/1.5': { size: 1.5, screenSize: 1.5, insulationThick: 0.8, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 37, khaUdara: 26 },
  '1x2.5/2.5': { size: 2.5, screenSize: 2.5, insulationThick: 0.8, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 50, khaUdara: 35 },
  '1x4/4': { size: 4, screenSize: 4, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 65, khaUdara: 46 },
  '1x6/6': { size: 6, screenSize: 6, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 83, khaUdara: 58 },
  '1x10/10': { size: 10, screenSize: 10, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 110, khaUdara: 80 },
  '1x16/16': { size: 16, screenSize: 16, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 145, khaUdara: 105 },
  '1x25/16': { size: 25, screenSize: 16, insulationThick: 1.2, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 190, khaUdara: 140 },
  '1x35/16': { size: 35, screenSize: 16, insulationThick: 1.2, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 235, khaUdara: 175 },
  '1x50/25': { size: 50, screenSize: 25, insulationThick: 1.4, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 280, khaUdara: 215 },
  '1x70/35': { size: 70, screenSize: 35, insulationThick: 1.4, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 350, khaUdara: 270 },
  '1x95/50': { size: 95, screenSize: 50, insulationThick: 1.6, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 420, khaUdara: 335 },
  '1x120/70': { size: 120, screenSize: 70, insulationThick: 1.6, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 480, khaUdara: 390 },
  '1x150/70': { size: 150, screenSize: 70, insulationThick: 1.8, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 540, khaUdara: 445 },
  '1x185/95': { size: 185, screenSize: 95, insulationThick: 2.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 620, khaUdara: 510 },
  '1x240/120': { size: 240, screenSize: 120, insulationThick: 2.2, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.9, khaTanah: 720, khaUdara: 620 },
  '1x300/150': { size: 300, screenSize: 150, insulationThick: 2.4, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 2.0, khaTanah: 820, khaUdara: 710 },
  '1x400/185': { size: 400, screenSize: 185, insulationThick: 2.6, innerSheathEkstrusi: 1.2, innerSheathPita: 0.4, outerSheathThick: 2.1, khaTanah: 960, khaUdara: 850 },
  '1x500/240': { size: 500, screenSize: 240, insulationThick: 2.8, innerSheathEkstrusi: 1.2, innerSheathPita: 0.4, outerSheathThick: 2.3, khaTanah: 1110, khaUdara: 1000 },
  '2x1.5/1.5': { size: 1.5, screenSize: 1.5, insulationThick: 0.8, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 30, khaUdara: 21 },
  '2x2.5/2.5': { size: 2.5, screenSize: 2.5, insulationThick: 0.8, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 41, khaUdara: 29 },
  '2x4/4': { size: 4, screenSize: 4, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 53, khaUdara: 38 },
  '2x6/6': { size: 6, screenSize: 6, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 66, khaUdara: 48 },
  '2x10/10': { size: 10, screenSize: 10, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 88, khaUdara: 66 },
  '2x16/16': { size: 16, screenSize: 16, insulationThick: 1.0, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 115, khaUdara: 90 },
  '2x25/16': { size: 25, screenSize: 16, insulationThick: 1.2, innerSheathEkstrusi: 1.0, innerSheathPita: 0.4, outerSheathThick: 1.8, khaTanah: 150, khaUdara: 120 },
};

export const NYA_NYAF_DATA: Record<string, NYA_NYAFData> = {
  '1.5': { size: 1.5, khaTanah: 15, khaUdara: 24 },
  '2.5': { size: 2.5, khaTanah: 19, khaUdara: 32 },
  '4': { size: 4, khaTanah: 25, khaUdara: 43 },
  '6': { size: 6, khaTanah: 33, khaUdara: 54 },
  '10': { size: 10, khaTanah: 45, khaUdara: 73 },
  '16': { size: 16, khaTanah: 61, khaUdara: 98 },
  '25': { size: 25, khaTanah: 83, khaUdara: 129 },
  '35': { size: 35, khaTanah: 103, khaUdara: 158 },
  '50': { size: 50, khaTanah: 132, khaUdara: 197 },
  '70': { size: 70, khaTanah: 162, khaUdara: 245 },
  '95': { size: 95, khaTanah: 207, khaUdara: 290 },
  '120': { size: 120, khaTanah: 235, khaUdara: 345 },
  '150': { size: 150, khaTanah: 0, khaUdara: 390 },
  '185': { size: 185, khaTanah: 0, khaUdara: 445 },
  '240': { size: 240, khaTanah: 0, khaUdara: 525 },
  '300': { size: 300, khaTanah: 0, khaUdara: 605 },
  '400': { size: 400, khaTanah: 0, khaUdara: 725 },

};

function getLayingUpFactor(cores: number): number {
  if (cores <= 1) return 1;
  if (LAYING_UP_FACTORS[cores]) return LAYING_UP_FACTORS[cores];
  
  // Linear interpolation for missing values
  const sortedCores = Object.keys(LAYING_UP_FACTORS).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < sortedCores.length - 1; i++) {
    if (cores > sortedCores[i] && cores < sortedCores[i+1]) {
      const c1 = sortedCores[i];
      const c2 = sortedCores[i+1];
      const f1 = LAYING_UP_FACTORS[c1];
      const f2 = LAYING_UP_FACTORS[c2];
      return f1 + (f2 - f1) * (cores - c1) / (c2 - c1);
    }
  }
  
  // Fallback to formula for very large core counts
  return 1.15 * Math.sqrt(cores);
}

/**
 * Calculates the laying up diameter for mixed core configurations (e.g., 3+1, 3+2, 4+1).
 * It calculates two geometric models:
 * 1. Single Circle: All cores push each other into a circular arrangement.
 * 2. Groove: Large cores touch each other, small cores sit in the outer interstices.
 * The cable naturally assumes the most compact configuration, so it returns the minimum of the two.
 */
function calculateMixedLayingUpDiameter(D: number, d: number, nB: number, nS: number, model: 'Auto' | 'Single Circle' | 'Groove' = 'Auto'): number {
  if (nB === 0 && nS === 0) return 0;
  if (nB === 0) return d * getLayingUpFactor(nS);
  if (nS === 0) return D * getLayingUpFactor(nB);

  const R = D / 2;
  const r = d / 2;

  // 1. Single Circle Model (all cores push each other into a circular arrangement)
  let N_BB = 0;
  let N_BS = 0;
  let N_SS = 0;

  if (nS === 1) {
    // nB-S (e.g., 2+1, 3+1, 4+1)
    N_BB = nB - 1;
    N_BS = 2;
    N_SS = 0;
  } else if (nB === 3 && nS === 2) {
    // 3+2 (B-B-S-B-S)
    N_BB = 1;
    N_BS = 4;
    N_SS = 0;
  } else if (nB === 3 && nS === 3) {
    // 3+3 (B-S-B-S-B-S)
    N_BB = 0;
    N_BS = 6;
    N_SS = 0;
  } else {
    // Fallback for other mixed configurations
    if (nB >= nS) {
      N_BS = 2 * nS;
      N_BB = nB - nS;
      N_SS = 0;
    } else {
      N_BS = 2 * nB;
      N_SS = nS - nB;
      N_BB = 0;
    }
  }

  let minRc = Math.max(R, r, (R+r)/2) + 1e-6;
  if (N_BB > 0) minRc = Math.max(minRc, R + 1e-6);
  if (N_BS > 0) minRc = Math.max(minRc, (R+r)/2 + 1e-6);
  if (N_SS > 0) minRc = Math.max(minRc, r + 1e-6);

  let maxRc = (nB * D + nS * d) / 2; // Perimeter approximation
  if (maxRc < minRc) maxRc = minRc + 10;

  const f = (Rc: number) => {
    let sum = 0;
    if (N_BB > 0) sum += N_BB * Math.asin(Math.min(1, R / Rc));
    if (N_BS > 0) sum += N_BS * Math.asin(Math.min(1, (R + r) / (2 * Rc)));
    if (N_SS > 0) sum += N_SS * Math.asin(Math.min(1, r / Rc));
    return sum - Math.PI;
  };

  let low = minRc;
  let high = maxRc;
  let Rc = (low + high) / 2;

  for (let i = 0; i < 50; i++) {
    Rc = (low + high) / 2;
    const val = f(Rc);
    if (Math.abs(val) < 1e-6) break;
    if (val > 0) {
      low = Rc; // sum > pi, meaning Rc is too small
    } else {
      high = Rc; // sum < pi, meaning Rc is too large
    }
  }

  const singleCircleDia = 2 * (Rc + Math.max(R, r));

  // 2. Groove Model (large cores touch each other, small cores sit in the outer interstices)
  let grooveDia = Infinity;
  if (nS <= nB && nB >= 2) {
    // Circumcircle radius of the large cores touching each other
    const R_nB = nB === 2 ? R : R / Math.sin(Math.PI / nB);
    
    // Distance from center to the center of a small core in the groove
    const cosTerm = nB === 2 ? 0 : Math.cos(Math.PI / nB);
    const y_small = R_nB * cosTerm + Math.sqrt(Math.pow(R + r, 2) - Math.pow(R, 2));
    
    // The overall radius is the maximum of the large cores' outer edge and the small cores' outer edge
    const maxRadius = Math.max(R_nB + R, y_small + r);
    grooveDia = 2 * maxRadius;
  }

  if (model === 'Single Circle') return singleCircleDia;
  if (model === 'Groove') return grooveDia === Infinity ? singleCircleDia : grooveDia;
  
  // Auto: The cable will naturally assume the most compact configuration
  return Math.min(singleCircleDia, grooveDia);
}

export interface CoreSpec {
  conductorDiameter: number;
  wireCount: number;
  wireDiameter: number;
  insulationThickness: number;
  coreDiameter: number;
  alWireCount?: number;
  alWireDiameter?: number;
  steelWireCount?: number;
  steelWireDiameter?: number;
}

export interface WeightDetail {
  weight: number;
  formula: string;
}

export interface CalculationResult {
  spec: {
    phaseCore: CoreSpec;
    earthingCore?: CoreSpec;
    conductorDiameter: number;
    wireCount?: number;
    insulationThickness: number;
    coreDiameter: number;
    laidUpDiameter: number;
    innerCoveringThickness: number;
    diameterUnderArmor: number;
    armorThickness: number;
    armorWireDiameter?: number;
    armorTapeThickness?: number;
    armorFlatThickness?: number;
    staOverlap?: number;
    gswbCarriers?: number;
    gswbWiresPerCarrier?: number;
    gswbLayPitch?: number;
    gswbCoverage?: number;
    diameterOverArmor: number;
    sheathThickness: number;
    overallDiameter: number;
    conductorScreenThickness?: number;
    insulationScreenThickness?: number;
    braidWireDiameter?: number;
    braidCoverage?: number;
    mvScreenDiameter?: number;
    mgtThickness?: number;
    screenThickness?: number;
    separatorThickness?: number;
    overallDiameterMin?: number;
    overallDiameterMax?: number;
    // New fields
    pairTriadDiameter?: number;
    aluminiumThickness?: number;
    drainWireSize?: number;
    polyesterTapeThickness?: number;
    diameterAfterIS?: number;
    diameterAfterOS?: number;
    breakingLoad?: number;
  };
  bom: {
    conductorWeight: number;
    insulationWeight: number;
    innerCoveringWeight: number;
    screenWeight: number;
    separatorWeight: number;
    armorWeight: number;
    armorWireWeight?: number;
    armorTapeWeight?: number;
    sheathWeight: number;
    semiCondWeight: number;
    mvScreenWeight: number;
    mgtWeight: number;
    earthingConductorWeight: number;
    earthingAlWeight?: number;
    earthingSteelWeight?: number;
    earthingInsulationWeight: number;
    isWeight?: number;
    osWeight?: number;
    isAlWeight?: number;
    isDrainWeight?: number;
    isPetWeight?: number;
    osAlWeight?: number;
    osDrainWeight?: number;
    osPetWeight?: number;
    isMultiplier?: number;
    totalWeight: number;
  };
  weights?: {
    conductor: WeightDetail;
    mgt?: WeightDetail;
    conductorScreen?: WeightDetail;
    insulation: WeightDetail;
    insulationScreen?: WeightDetail;
    metallicScreen?: WeightDetail;
    innerSheath?: WeightDetail;
    armor?: WeightDetail;
    separator?: WeightDetail;
    outerSheath: WeightDetail;
    earthing?: WeightDetail;
  };
  electrical: {
    maxDcResistance: number;
    currentCapacityAir: number;
    currentCapacityGround: number;
    voltageRating: string;
    testVoltage: string;
    shortCircuitCapacity: number;
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
  0.5: 36, 0.75: 24.5, 1: 18.1, 1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524, 50: 0.387, 
  70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754, 300: 0.0601, 
  400: 0.047, 500: 0.0366, 630: 0.0283, 800: 0.0221, 1000: 0.0176
};

const RESISTANCE_TCU: Record<number, number> = {
  0.5: 36.70, 0.75: 24.80, 1: 18.20, 1.5: 12.20, 2.5: 7.56, 4: 4.70, 6: 3.11, 10: 1.84, 16: 1.16, 25: 0.73, 35: 0.53, 50: 0.39, 
  70: 0.27, 95: 0.20, 120: 0.15, 150: 0.13, 185: 0.10, 240: 0.08, 300: 0.06, 
  400: 0.05, 500: 0.04, 630: 0.03
};

const RESISTANCE_CU_CLASS5: Record<number, number> = {
  0.5: 39, 0.75: 26, 1: 19.5, 1.5: 13.3, 2.5: 7.98, 4: 4.95, 6: 3.3, 10: 1.91, 16: 1.21, 25: 0.78, 35: 0.554, 50: 0.386, 
  70: 0.272, 95: 0.206, 120: 0.161, 150: 0.129, 185: 0.106, 240: 0.0801, 300: 0.0641, 
  400: 0.0486, 500: 0.0384, 630: 0.0287
};

const RESISTANCE_AL: Record<number, number> = {
  4: 7.41, 6: 4.61, 10: 3.08, 16: 1.91, 25: 1.2, 35: 0.868, 50: 0.641, 70: 0.443, 95: 0.32, 120: 0.253, 150: 0.206, 185: 0.164, 
  240: 0.125, 300: 0.1, 400: 0.0778, 500: 0.0605, 630: 0.0469
};

const RESISTANCE_TCU_CLASS5: Record<number, number> = {
  0.5: 40.1, 0.75: 26.7, 1: 20.0, 1.5: 13.7, 2.5: 8.21, 4: 5.09, 6: 3.39, 10: 1.95, 16: 1.24, 
  25: 0.795, 35: 0.565, 50: 0.393, 70: 0.277, 95: 0.210, 120: 0.164, 150: 0.132, 
  185: 0.108, 240: 0.0817, 300: 0.0654, 400: 0.0495, 500: 0.0391, 630: 0.0292
};

const CLASS5_CONSTRUCTION: Record<number, { wireCount: number, wireDiameter: number }> = {
  0.5: { wireCount: 16, wireDiameter: 0.20 },
  0.75: { wireCount: 24, wireDiameter: 0.20 },
  1: { wireCount: 32, wireDiameter: 0.20 },
  1.5: { wireCount: 30, wireDiameter: 0.25 },
  2.5: { wireCount: 50, wireDiameter: 0.25 },
  4: { wireCount: 56, wireDiameter: 0.30 },
  6: { wireCount: 84, wireDiameter: 0.30 },
  10: { wireCount: 80, wireDiameter: 0.40 },
  16: { wireCount: 126, wireDiameter: 0.40 },
  25: { wireCount: 196, wireDiameter: 0.40 },
  35: { wireCount: 276, wireDiameter: 0.40 },
  50: { wireCount: 396, wireDiameter: 0.40 },
  70: { wireCount: 360, wireDiameter: 0.50 },
  95: { wireCount: 475, wireDiameter: 0.50 },
  120: { wireCount: 608, wireDiameter: 0.50 },
  150: { wireCount: 756, wireDiameter: 0.50 },
  185: { wireCount: 925, wireDiameter: 0.50 },
  240: { wireCount: 1221, wireDiameter: 0.50 },
  300: { wireCount: 1525, wireDiameter: 0.50 },
  400: { wireCount: 2035, wireDiameter: 0.50 },
  500: { wireCount: 2540, wireDiameter: 0.50 },
  630: { wireCount: 3200, wireDiameter: 0.50 },
};

const CURRENT_CAPACITY_AIR_CU: Record<number, number> = {
  1.5: 24, 2.5: 32, 4: 42, 6: 54, 10: 75, 16: 100, 25: 135, 35: 165, 50: 200, 
  70: 255, 95: 315, 120: 365, 150: 420, 185: 485, 240: 575, 300: 665, 
  400: 780, 500: 900, 630: 1050
};

const CURRENT_CAPACITY_AIR_CU_MV: Record<number, number> = {
  16: 125, 25: 163, 35: 198, 50: 238, 70: 296, 95: 361, 120: 417, 150: 473, 
  185: 543, 240: 641, 300: 735, 400: 845
};

const CURRENT_CAPACITY_GROUND_CU: Record<number, number> = {
  1.5: 26, 2.5: 34, 4: 44, 6: 56, 10: 78, 16: 105, 25: 140, 35: 170, 50: 205, 
  70: 260, 95: 320, 120: 370, 150: 425, 185: 490, 240: 580, 300: 670, 
  400: 785, 500: 905, 630: 1055
};

const CURRENT_CAPACITY_GROUND_CU_MV: Record<number, number> = {
  16: 109, 25: 140, 35: 166, 50: 196, 70: 239, 95: 285, 120: 323, 150: 361, 
  185: 406, 240: 469, 300: 526, 400: 590
};

const CURRENT_CAPACITY_AIR_AL: Record<number, number> = {
  1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 103, 35: 125, 50: 152, 
  70: 194, 95: 240, 120: 278, 150: 320, 185: 370, 240: 438, 300: 506, 
  400: 594, 500: 685, 630: 800
};

const CURRENT_CAPACITY_AIR_AL_MV: Record<number, number> = {
  16: 97, 25: 127, 35: 154, 50: 184, 70: 230, 95: 280, 120: 324, 150: 368, 
  185: 424, 240: 502, 300: 577, 400: 673
};

const CURRENT_CAPACITY_GROUND_AL: Record<number, number> = {
  1.5: 20, 2.5: 26, 4: 34, 6: 43, 10: 59, 16: 80, 25: 107, 35: 130, 50: 156, 
  70: 198, 95: 244, 120: 282, 150: 324, 185: 374, 240: 442, 300: 510, 
  400: 598, 500: 689, 630: 804
};

const CURRENT_CAPACITY_GROUND_AL_MV: Record<number, number> = {
  16: 84, 25: 108, 35: 129, 50: 152, 70: 186, 95: 221, 120: 252, 150: 281, 
  185: 317, 240: 367, 300: 414, 400: 470
};

export function calculateCable(params: CableDesignParams, customDensities?: MaterialDensities, scrapFactors?: Record<string, number>): CalculationResult {
  const densities = customDensities || DEFAULT_DENSITIES;
  
  const applyScrap = (weight: number, material: string) => {
    if (!scrapFactors) return weight;
    const scrap = scrapFactors[material] || 0;
    return weight * (1 + scrap / 100);
  };

  // Adjust params based on standard
  const effectiveParams = { ...params };

  // Instrumentation specific mapping
  if (params.standard === 'BS EN 50288-7') {
    if (params.formationType === 'Pair') {
      effectiveParams.cores = (params.formationCount || 1) * 2;
      effectiveParams.size = params.instrumentationSize || params.size;
    } else if (params.formationType === 'Triad') {
      effectiveParams.cores = (params.formationCount || 1) * 3;
      effectiveParams.size = params.instrumentationSize || params.size;
    }
  }

  let innerCoveringThickness = effectiveParams.manualInnerSheathThickness;
  let sheathThickness = effectiveParams.manualSheathThickness;
  if (params.standard === 'IEC 60502-2') {
    effectiveParams.insulationMaterial = 'XLPE';
    // Only set default if current voltage is not an MV voltage
    if (!['3.6/6 kV', '6/10 kV', '8.7/15 kV', '12/20 kV', '18/30 kV'].includes(params.voltage)) {
      effectiveParams.voltage = '6/10 kV';
    }
  } else {
    // LV Cables: No screens by default
    effectiveParams.mvScreenType = 'None';
    // Conductor screen and insulation screen are for MV only
    if (!effectiveParams.manualConductorScreenThickness) effectiveParams.manualConductorScreenThickness = 0;
    if (!effectiveParams.manualInsulationScreenThickness) effectiveParams.manualInsulationScreenThickness = 0;
    
    if (params.standard.includes('(NYA)') || params.standard.includes('(NYAF)') || params.standard.includes('NFA2X') || params.standard === 'SPLN 43-4 (NYCY)') {
      effectiveParams.armorType = 'Unarmored';
      effectiveParams.hasInnerSheath = params.standard === 'SPLN 43-4 (NYCY)';
      effectiveParams.hasScreen = params.standard === 'SPLN 43-4 (NYCY)';
      if (params.standard === 'SPLN 43-4 (NYCY)') {
        effectiveParams.screenType = 'CWS';
      }
      effectiveParams.manualSheathThickness = 0;
    }
  }

  if (params.standard.includes('(NYM)')) {
    effectiveParams.voltage = '300/500 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.innerSheathMaterial = 'PVC';
    effectiveParams.armorType = 'Unarmored';
  } else if (params.standard.includes('(NYAF)')) {
    effectiveParams.voltage = '450/750 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    effectiveParams.armorType = 'Unarmored';
    effectiveParams.cores = 1;
  } else if (params.standard.includes('(NYA)')) {
    effectiveParams.voltage = '450/750 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.armorType = 'Unarmored';
    effectiveParams.cores = 1;
    if (effectiveParams.size <= 10) {
      effectiveParams.conductorType = 're';
    } else {
      effectiveParams.conductorType = 'rm';
    }
  } else if (params.standard.includes('(NYMHY)')) {
    effectiveParams.voltage = '300/500 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    effectiveParams.armorType = 'Unarmored';
    effectiveParams.hasInnerSheath = false;
  } else if (params.standard === 'SPLN 43-4 (NYCY)') {
    effectiveParams.voltage = '0.6/1 kV';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.innerSheathMaterial = 'PVC';
    effectiveParams.hasInnerSheath = true;
    effectiveParams.hasScreen = true;
    effectiveParams.screenType = 'CWS';
    // Conductor type based on size
    if (effectiveParams.size <= 4) {
      effectiveParams.conductorType = 're';
    } else {
      effectiveParams.conductorType = 'rm';
    }
  } else if (params.standard === 'IEC 60092-353') {
    effectiveParams.voltage = '0.6/1 kV';
    effectiveParams.insulationMaterial = 'XLPE';
    effectiveParams.sheathMaterial = 'SHF1';
  } else if (params.standard.includes('NFA2X')) {
    effectiveParams.conductorMaterial = 'Al';
    effectiveParams.insulationMaterial = 'XLPE';
    effectiveParams.voltage = '0.6/1 kV';
    effectiveParams.armorType = 'Unarmored';
    effectiveParams.hasInnerSheath = false;
    effectiveParams.sheathMaterial = 'PVC'; // Usually no sheath for ABC, but we'll use this for weight if needed or set thickness to 0
    if (params.standard.includes('NFA2X-T')) {
      effectiveParams.hasEarthing = true;
      effectiveParams.earthingCores = 1;
      // Messenger size logic based on table
      if (effectiveParams.size === 35) effectiveParams.earthingSize = 35;
      else if (effectiveParams.size === 50) effectiveParams.earthingSize = 50;
      else if (effectiveParams.size === 70) effectiveParams.earthingSize = 70;
      else if (effectiveParams.size === 95) effectiveParams.earthingSize = 95;
      else if (effectiveParams.size === 120) effectiveParams.earthingSize = 95;
      else effectiveParams.earthingSize = effectiveParams.size; // Fallback
    } else {
      effectiveParams.hasEarthing = false;
    }
  } else if (params.standard === 'BS EN 50288-7') {
    effectiveParams.insulationMaterial = 'PE'; // Default for instrumentation
    if (!['300 V', '300/500 V'].includes(params.voltage)) {
      effectiveParams.voltage = '300/500 V';
    }
    effectiveParams.formationType = params.formationType || 'Pair';
    
    // IS/OS Logic: Jika IS aktif, otomatis aktifkan OS
    if (params.hasIndividualScreen) {
      effectiveParams.hasOverallScreen = true;
    }
  } else if (params.standard === 'LiYCY') {
    effectiveParams.voltage = '300/500 V';
    effectiveParams.insulationMaterial = 'PVC';
    effectiveParams.sheathMaterial = 'PVC';
    effectiveParams.conductorType = 'f';
    if (effectiveParams.armorType !== 'TCWB' && effectiveParams.armorType !== 'CWB') {
      effectiveParams.armorType = 'TCWB'; // Default for LiYCY
    }
    effectiveParams.hasInnerSheath = false;
    effectiveParams.hasSeparator = true;
    effectiveParams.separatorMaterial = 'Polyester Tape';
  }

  // Aluminum size constraint: min 10mm2
  if (effectiveParams.conductorMaterial === 'Al' && effectiveParams.size < 10) {
    effectiveParams.size = 10;
  }

  // Instrumentation 300V constraint: max 1.5mm2
  if (params.standard === 'BS EN 50288-7' && effectiveParams.voltage === '300 V' && effectiveParams.size > 1.5) {
    effectiveParams.size = 1.5;
  }

  const data = CABLE_DATA.find((d) => d.size === effectiveParams.size) || CABLE_DATA[0];

  // 1. Conductor
  let conductorDiameter = effectiveParams.manualConductorDiameter || data.diameter;
  let wireCount = effectiveParams.manualWireCount || (effectiveParams.conductorType === 're' ? 1 : 7);
  let wireDiameter = effectiveParams.manualWireDiameter || Math.sqrt((4 * effectiveParams.size) / (Math.PI * (effectiveParams.manualWireCount || (effectiveParams.conductorType === 're' ? 1 : 7))));

  if (effectiveParams.conductorType === 'f' && !effectiveParams.manualWireCount) {
    const class5 = CLASS5_CONSTRUCTION[effectiveParams.size];
    if (class5) {
      wireCount = class5.wireCount;
      wireDiameter = class5.wireDiameter;
    } else {
      wireCount = Math.ceil(effectiveParams.size / 0.2);
      wireDiameter = Math.sqrt((4 * effectiveParams.size) / (Math.PI * wireCount));
    }
  } else if (effectiveParams.manualWireCount && effectiveParams.manualWireDiameter) {
    // If both are provided, we trust them but maybe update diameter?
    // conductorDiameter = ... (handled below)
  }

  let maxDcResistance = 0;
  if (effectiveParams.conductorMaterial === 'Cu') {
    if (effectiveParams.conductorType === 'f') {
      maxDcResistance = RESISTANCE_CU_CLASS5[effectiveParams.size] || (RESISTANCE_CU[effectiveParams.size] || 0);
    } else {
      maxDcResistance = RESISTANCE_CU[effectiveParams.size] || 0;
    }
  } else if (effectiveParams.conductorMaterial === 'TCu') {
    if (effectiveParams.conductorType === 'f') {
      maxDcResistance = RESISTANCE_TCU_CLASS5[effectiveParams.size] || (RESISTANCE_TCU[effectiveParams.size] || 0);
    } else {
      maxDcResistance = RESISTANCE_TCU[effectiveParams.size] || 0;
    }
  } else if (effectiveParams.conductorMaterial === 'Al') {
    maxDcResistance = RESISTANCE_AL[effectiveParams.size] || (RESISTANCE_CU[effectiveParams.size] || 0) * 1.61;
  } else {
    maxDcResistance = (RESISTANCE_CU[effectiveParams.size] || 0) * 1.61;
  }
  let conductorWeightPerCore = effectiveParams.size * densities[effectiveParams.conductorMaterial];

  // Helper function to find KHA
  const getKhaValue = (cores: number, size: number, material: string, insulation: string, installation: 'air' | 'ground') => {
    const type = `${cores} Core`;
    const khaEntry = KHA_DATA.find(entry => entry.type === type && entry.size === size);
    if (!khaEntry) return 0;

    const key = `${insulation.toLowerCase()}In${installation.charAt(0).toUpperCase() + installation.slice(1)}${material.charAt(0).toUpperCase() + material.slice(1)}`;
    return (khaEntry as any)[key] || 0;
  };

  // Helper function to find MV KHA
  const getMvKhaValue = (cores: number, size: number, material: string, armorType: string, installation: 'air' | 'ground') => {
    const isArmoured = armorType !== 'Unarmored';
    const type = `${cores} Core ${isArmoured ? 'Armoured' : 'Unarmoured'}`;
    const khaEntry = MV_KHA_DATA.find(entry => entry.type === type && entry.size === size);
    if (!khaEntry) return 0;

    const key = `${installation}${material === 'Cu' ? 'Cu' : 'Al'}` as keyof typeof khaEntry;
    return (khaEntry as any)[key] || 0;
  };

  // Helper function to find correction factor
  const getCorrectionFactor = (cores: number, installation: 'air' | 'ground') => {
    const factorEntry = KHA_CORRECTION_FACTORS.find(entry => entry.cores === cores);
    if (!factorEntry) return 1;
    return installation === 'air' ? factorEntry.air : factorEntry.ground;
  };

  // Helper function to find Marine KHA
  const getMarineKhaValue = (cores: number, size: number, conductorType: 'class2' | 'class5') => {
    const data = conductorType === 'class2' ? MARINE_KHA_DATA.class2 : MARINE_KHA_DATA.class5;
    const entry = data.find(e => e.size === size);
    if (!entry) return 0;

    const key = `n${cores}` as keyof typeof entry;
    if (key in entry) {
      return entry[key] as number;
    }

    // Calculation if core is not in table
    const n1 = entry.n1;
    return n1 / Math.pow(cores, 1 / 3);
  };

  let currentCapacityAir = 0;
  let currentCapacityGround = 0;

  // Try to get KHA from new data
  if (effectiveParams.standard === 'IEC 60502-2') {
    currentCapacityAir = getMvKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.armorType, 'air');
    currentCapacityGround = getMvKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.armorType, 'ground');
  } else if (effectiveParams.standard === 'IEC 60092-353') {
    const conductorType = effectiveParams.conductorType === 'f' ? 'class5' : 'class2';
    currentCapacityAir = getMarineKhaValue(effectiveParams.cores, effectiveParams.size, conductorType);
    currentCapacityGround = 0; // Marine cables are typically rated for air
  } else if (effectiveParams.standard.includes('SNI 04-6629.4 (NYM)')) {
    const nymEntry = NYM_KHA_DATA.find(e => e.size === effectiveParams.size);
    if (nymEntry) {
      const key30 = `cores${effectiveParams.cores}_30` as keyof typeof nymEntry;
      const key40 = `cores${effectiveParams.cores}_40` as keyof typeof nymEntry;
      currentCapacityAir = (nymEntry as any)[key30] || 0;
      currentCapacityGround = (nymEntry as any)[key40] || 0;
    } else {
      const baseKhaAir = getKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.insulationMaterial, 'air');
      const correctionAir = getCorrectionFactor(effectiveParams.cores, 'air');
      currentCapacityAir = baseKhaAir * correctionAir;
      currentCapacityGround = baseKhaAir * correctionAir * 0.82; // Approx for 40°C
    }
  } else if (effectiveParams.standard.includes('SNI 04-6629.5 (NYMHY)')) {
    const nymhyEntry = NYMHY_DATA.find(e => e.size === effectiveParams.size && e.cores === effectiveParams.cores);
    if (nymhyEntry) {
      currentCapacityAir = nymhyEntry.kha;
      currentCapacityGround = 0;
    } else {
      const baseKhaAir = getKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.insulationMaterial, 'air');
      const correctionAir = getCorrectionFactor(effectiveParams.cores, 'air');
      currentCapacityAir = baseKhaAir * correctionAir;
      currentCapacityGround = 0;
    }
  } else {
    const baseKhaAir = getKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.insulationMaterial, 'air');
    const baseKhaGround = getKhaValue(effectiveParams.cores, effectiveParams.size, effectiveParams.conductorMaterial, effectiveParams.insulationMaterial, 'ground');
    
    const correctionAir = getCorrectionFactor(effectiveParams.cores, 'air');
    const correctionGround = getCorrectionFactor(effectiveParams.cores, 'ground');

    currentCapacityAir = baseKhaAir * correctionAir;
    currentCapacityGround = baseKhaGround * correctionGround;
  }

  // ABC Specific Data Overrides
  const abcKey = `${effectiveParams.cores}x${effectiveParams.size}`;
  const abcTKey = `${effectiveParams.cores}x${effectiveParams.size}+${effectiveParams.earthingSize}`;
  let abcData: ABCData | null = null;
  let abcTData: { phase: ABCData, messenger: ABCMessengerData, netWeight: number } | null = null;

  if (effectiveParams.standard.includes('NFA2X-T')) {
    abcTData = NFA2XT_DATA[abcTKey];
    if (abcTData) {
      conductorDiameter = abcTData.phase.condDiameter;
      wireCount = abcTData.phase.wireCount;
      wireDiameter = abcTData.phase.wireDiameter;
      conductorWeightPerCore = abcTData.phase.condWeight;
      maxDcResistance = abcTData.phase.resistance;
      currentCapacityAir = abcTData.phase.ampacity;
    }
  } else if (effectiveParams.standard.includes('NFA2X')) {
    abcData = NFA2X_DATA[abcKey];
    if (abcData) {
      conductorDiameter = abcData.condDiameter;
      wireCount = abcData.wireCount;
      wireDiameter = abcData.wireDiameter;
      conductorWeightPerCore = abcData.condWeight;
      maxDcResistance = abcData.resistance;
      currentCapacityAir = abcData.ampacity;
    }
  }

  if (!effectiveParams.manualConductorDiameter && !abcData && !abcTData) {
    if (effectiveParams.conductorType === 're') {
      conductorDiameter = Math.sqrt((4 * effectiveParams.size) / Math.PI);
    } else if (effectiveParams.conductorType === 'f') {
      conductorDiameter = data.diameter * 1.1; 
    } else if (effectiveParams.conductorType === 'cm') {
      conductorDiameter = data.diameter * 0.92; 
    } else if (effectiveParams.conductorType === 'sm') {
      conductorDiameter = data.diameter; 
    }
  }

  // Earthing Conductor
  const earthingCores = (effectiveParams.hasEarthing !== false) ? (effectiveParams.earthingCores || 0) : 0;
  const earthingSize = effectiveParams.earthingSize || 0;
  const earthingData = CABLE_DATA.find((d) => d.size === earthingSize) || CABLE_DATA[0];
  
  let earthingConductorDiameter = 0;
  let earthingWireCount = 0;
  let earthingWireDiameter = 0;
  let earthingAlWireCount: number | undefined;
  let earthingAlWireDiameter: number | undefined;
  let earthingSteelWireCount: number | undefined;
  let earthingSteelWireDiameter: number | undefined;

  if (earthingCores > 0) {
    if (abcTData) {
      earthingConductorDiameter = effectiveParams.manualEarthingConductorDiameter || abcTData.messenger.condDiameter;
      earthingAlWireCount = effectiveParams.manualEarthingWireCount || abcTData.messenger.alWireCount;
      earthingAlWireDiameter = effectiveParams.manualEarthingWireDiameter || abcTData.messenger.alWireDiameter;
      earthingSteelWireCount = effectiveParams.manualEarthingSteelWireCount ?? abcTData.messenger.steelWireCount;
      earthingSteelWireDiameter = effectiveParams.manualEarthingSteelWireDiameter || abcTData.messenger.steelWireDiameter;
      earthingWireCount = earthingAlWireCount + earthingSteelWireCount;
      earthingWireDiameter = earthingAlWireDiameter;
    } else {
      earthingWireCount = effectiveParams.manualEarthingWireCount || (effectiveParams.conductorType === 're' ? 1 : 7);
      if (effectiveParams.conductorType === 'f' && !effectiveParams.manualEarthingWireCount) {
        const class5 = CLASS5_CONSTRUCTION[earthingSize];
        if (class5) {
          earthingWireCount = class5.wireCount;
          earthingWireDiameter = class5.wireDiameter;
        } else {
          earthingWireCount = Math.ceil(earthingSize / 0.2);
          earthingWireDiameter = Math.sqrt((4 * earthingSize) / (Math.PI * earthingWireCount));
        }
      } else {
        earthingWireDiameter = effectiveParams.manualEarthingWireDiameter || Math.sqrt((4 * earthingSize) / (Math.PI * earthingWireCount));
      }

      if (effectiveParams.manualEarthingConductorDiameter) {
        earthingConductorDiameter = effectiveParams.manualEarthingConductorDiameter;
      } else if (effectiveParams.conductorType === 're') {
        earthingConductorDiameter = Math.sqrt((4 * earthingSize) / Math.PI);
      } else if (effectiveParams.conductorType === 'f') {
        earthingConductorDiameter = earthingData.diameter * 1.1;
      } else if (effectiveParams.conductorType === 'cm') {
        earthingConductorDiameter = earthingData.diameter * 0.92;
      } else {
        earthingConductorDiameter = earthingData.diameter;
      }
    }
  }
  
  let earthingConductorWeightPerCore = abcTData 
    ? abcTData.messenger.condWeight
    : (effectiveParams.standard.includes('NFA2X-T') 
      ? (earthingSize * (6/7) * densities.Al + earthingSize * (1/7) * densities.Steel) * 1.05 // 6 Al + 1 Steel mix with lay factor
      : earthingSize * densities[effectiveParams.conductorMaterial]);
  
  let earthingAlWeight = 0;
  let earthingSteelWeight = 0;

  if (effectiveParams.standard.includes('NFA2X-T') && abcTData) {
    // Calculate split weights based on wire counts
    const alArea = earthingAlWireCount! * (Math.PI * Math.pow(earthingAlWireDiameter! / 2, 2));
    const steelArea = earthingSteelWireCount! * (Math.PI * Math.pow(earthingSteelWireDiameter! / 2, 2));
    const alWeightPerCore = alArea * densities.Al * 1.05; // 5% lay factor
    const steelWeightPerCore = steelArea * densities.Steel * 1.05;
    earthingAlWeight = alWeightPerCore * earthingCores;
    earthingSteelWeight = steelWeightPerCore * earthingCores;
    earthingConductorWeightPerCore = alWeightPerCore + steelWeightPerCore;
  }

  const totalConductorWeight = (conductorWeightPerCore * effectiveParams.cores) + (earthingConductorWeightPerCore * earthingCores);

  // 1.5 Mica Glass Tape (MGT) - Fire Resistant
  let mgtThickness = effectiveParams.manualMgtThickness || 0;
  let mgtWeightPerCore = 0;
  let diameterOverMgt = conductorDiameter;

  if (!effectiveParams.manualMgtThickness && (effectiveParams.hasMgt || effectiveParams.fireguard)) {
    mgtThickness = 0.2; // 2 layers of 0.1mm approx
    if (effectiveParams.fireguard) mgtThickness += 0.1;
  }

  if (mgtThickness > 0) {
    diameterOverMgt = conductorDiameter + (2 * mgtThickness);
    const rCond = conductorDiameter / 2;
    const rMgt = diameterOverMgt / 2;
    const mgtArea = Math.PI * (rMgt * rMgt - rCond * rCond);
    mgtWeightPerCore = mgtArea * densities.MGT; // Density for Mica Tape
  }

  const totalMgtWeight = (mgtWeightPerCore * effectiveParams.cores) + (earthingCores > 0 ? (mgtWeightPerCore * (earthingConductorDiameter / conductorDiameter)) * earthingCores : 0);

  // 2. Semi-conductive and Insulation
  let conductorScreenThickness = effectiveParams.manualConductorScreenThickness || 0;
  let insulationScreenThickness = effectiveParams.manualInsulationScreenThickness || 0;
  let insulationThickness = effectiveParams.manualInsulationThickness;

  if (params.standard === 'LiYCY') {
    if (insulationThickness === undefined || !effectiveParams.manualInsulationThickness) {
      const size = effectiveParams.size;
      if (size <= 1.50) insulationThickness = 0.40;
      else if (size <= 4.00) insulationThickness = 0.50;
      else insulationThickness = 0.60; // Default for larger
    }
  } else if (params.standard === 'BS EN 50288-7') {
    if (insulationThickness === undefined || !effectiveParams.manualInsulationThickness) {
      const is300V = effectiveParams.voltage === '300 V';
      const is300_500V = effectiveParams.voltage === '300/500 V';
      const size = effectiveParams.size;

      if (is300V) {
        if (size <= 0.5) insulationThickness = 0.40;
        else if (size <= 0.75) insulationThickness = 0.40;
        else if (size <= 1.25) insulationThickness = 0.40;
        else if (size <= 1.5) insulationThickness = 0.50;
        else {
          // 300V only up to 1.5mm2, default to 0.50 or throw error? 
          // Assuming default to 0.50 for now as per table limit
          insulationThickness = 0.50;
        }
      } else if (is300_500V) {
        if (size <= 0.5) insulationThickness = 0.60;
        else if (size <= 0.75) insulationThickness = 0.60;
        else if (size <= 1.25) insulationThickness = 0.60;
        else if (size <= 1.5) insulationThickness = 0.60;
        else if (size <= 2.5) insulationThickness = 0.70;
        else insulationThickness = 0.70; // Default for larger
      } else {
        // Fallback
        insulationThickness = 0.60;
      }
    }
  } else if (effectiveParams.insulationMaterial === 'XLPE') {
    insulationThickness = insulationThickness || data.xlpeThick;
  } else {
    insulationThickness = insulationThickness || data.pvcThick;
  }

  // SNI 04-6629.4 (NYM) specific values
  if (effectiveParams.standard.includes('SNI 04-6629.4 (NYM)')) {
    const size = effectiveParams.size;
    const cores = effectiveParams.cores;
    
    // Insulation Thickness
    if (insulationThickness === undefined || !effectiveParams.manualInsulationThickness) {
      if (size === 1.5) insulationThickness = 0.7;
      else if (size <= 6) insulationThickness = 0.8;
      else if (size <= 16) insulationThickness = 1.0;
      else if (size <= 35) insulationThickness = 1.2;
    }

    // Inner Sheath Thickness (Tebal penutup bagian dalam)
    if (innerCoveringThickness === undefined) {
      if (size <= 4) {
        if (cores === 5 && size === 4) innerCoveringThickness = 0.6;
        else innerCoveringThickness = 0.4;
      } else if (size === 6) {
        if (cores >= 4) innerCoveringThickness = 0.6;
        else innerCoveringThickness = 0.4;
      } else if (size === 10) {
        innerCoveringThickness = 0.6;
      } else if (size === 16) {
        if (cores >= 3) innerCoveringThickness = 0.8;
        else innerCoveringThickness = 0.6;
      } else if (size === 25) {
        if (cores >= 4) innerCoveringThickness = 1.0;
        else innerCoveringThickness = 0.8;
      } else if (size === 35) {
        if (cores === 5) innerCoveringThickness = 1.2;
        else innerCoveringThickness = 1.0;
      }
    }

    // Outer Sheath Thickness (Tebal selubung)
    if (sheathThickness === undefined) {
      if (size <= 2.5) {
        sheathThickness = 1.2;
      } else if (size === 4) {
        if (cores >= 4) sheathThickness = 1.4;
        else sheathThickness = 1.2;
      } else if (size === 6) {
        if (cores >= 3) sheathThickness = 1.4;
        else sheathThickness = 1.2;
      } else if (size <= 16) {
        if (cores === 5 && size === 16) sheathThickness = 1.6;
        else sheathThickness = 1.4;
      } else if (size === 25) {
        if (cores === 2) sheathThickness = 1.4;
        else sheathThickness = 1.6;
      } else if (size === 35) {
        sheathThickness = 1.6;
      }
    }
  }

  // SNI 04-6629.5 (NYMHY) specific values
  if (effectiveParams.standard.includes('SNI 04-6629.5 (NYMHY)')) {
    const size = effectiveParams.size;
    const cores = effectiveParams.cores;
    const nymhyEntry = NYMHY_DATA.find(e => e.size === size && e.cores === cores);
    
    // Insulation Thickness
    if (insulationThickness === undefined || !effectiveParams.manualInsulationThickness) {
      if (nymhyEntry) {
        insulationThickness = nymhyEntry.ins;
      } else {
        if (size <= 1.0) insulationThickness = 0.6;
        else if (size === 1.5) insulationThickness = 0.7;
        else if (size === 2.5) insulationThickness = 0.8;
      }
    }

    // NYMHY has no inner sheath
    if (!effectiveParams.manualInnerSheathThickness) {
      innerCoveringThickness = 0;
    }

    // Outer Sheath Thickness
    if (sheathThickness === undefined || !effectiveParams.manualSheathThickness) {
      if (nymhyEntry) {
        sheathThickness = nymhyEntry.sheath;
      } else {
        if (cores === 2) {
          if (size <= 1.5) sheathThickness = 0.8;
          else if (size === 2.5) sheathThickness = 1.0;
        } else if (cores === 3) {
          if (size <= 1.0) sheathThickness = 0.8;
          else if (size === 1.5) sheathThickness = 0.9;
          else if (size === 2.5) sheathThickness = 1.1;
        } else if (cores === 4) {
          if (size === 0.75) sheathThickness = 0.8;
          else if (size === 1.0) sheathThickness = 0.9;
          else if (size === 1.5) sheathThickness = 1.0;
          else if (size === 2.5) sheathThickness = 1.1;
        } else if (cores === 5) {
          if (size <= 1.0) sheathThickness = 0.9;
          else if (size === 1.5) sheathThickness = 1.1;
          else if (size === 2.5) sheathThickness = 1.2;
        }
      }
    }
  }

  if (!effectiveParams.manualInsulationThickness) {
    // ABC Insulation Thickness from table
    if (abcTData) {
      insulationThickness = abcTData.phase.insulationThickness;
    } else if (abcData) {
      insulationThickness = abcData.insulationThickness;
    } else if (effectiveParams.standard.includes('SNI 04-6629') && !effectiveParams.standard.includes('NYM')) {
      if (effectiveParams.size === 1.5) insulationThickness = 0.7;
      else if (effectiveParams.size <= 6) insulationThickness = 0.8;
      else if (effectiveParams.size <= 16) insulationThickness = 1.0;
      else if (effectiveParams.size <= 35) insulationThickness = 1.2;
    }

    // MV Specifics (IEC 60502-2)
    if (effectiveParams.standard === 'IEC 60502-2') {
      if (!effectiveParams.manualConductorScreenThickness) conductorScreenThickness = 0.5; 
      if (!effectiveParams.manualInsulationScreenThickness) insulationScreenThickness = 0.5;
      if (effectiveParams.voltage.includes('3.6/6')) insulationThickness = 2.5;
      else if (effectiveParams.voltage.includes('6/10')) insulationThickness = 3.4;
      else if (effectiveParams.voltage.includes('8.7/15')) insulationThickness = 4.5;
      else if (effectiveParams.voltage.includes('12/20')) insulationThickness = 5.5;
      else if (effectiveParams.voltage.includes('18/30')) insulationThickness = 8.0;
    }

    // IEC 60092-353 (Marine Cable) Specifics
    if (effectiveParams.standard === 'IEC 60092-353') {
      if (effectiveParams.size <= 16) insulationThickness = 0.7;
      else if (effectiveParams.size <= 35) insulationThickness = 0.9;
      else if (effectiveParams.size <= 70) insulationThickness = 1.0;
      else if (effectiveParams.size <= 120) insulationThickness = 1.1;
      else if (effectiveParams.size <= 150) insulationThickness = 1.2;
      else if (effectiveParams.size <= 185) insulationThickness = 1.4;
      else if (effectiveParams.size <= 240) insulationThickness = 1.5;
      else if (effectiveParams.size <= 300) insulationThickness = 1.6;
      else insulationThickness = 1.8;
    }
  } else if (effectiveParams.standard === 'IEC 60502-2') {
    // Even if insulation is manual, screens might still be needed for MV
    if (!effectiveParams.manualConductorScreenThickness) conductorScreenThickness = 0.5;
    if (!effectiveParams.manualInsulationScreenThickness) insulationScreenThickness = 0.5;
  }

  // NYCY Specific Data Overrides
  const nycyKey = `${effectiveParams.cores}x${effectiveParams.size}/${effectiveParams.screenSize || effectiveParams.size}`;
  const nycyData = effectiveParams.standard === 'SPLN 43-4 (NYCY)' ? NYCY_DATA[nycyKey] : null;

  if (nycyData) {
    insulationThickness = nycyData.insulationThick;
    innerCoveringThickness = nycyData.innerSheathEkstrusi;
    sheathThickness = nycyData.outerSheathThick;
    currentCapacityAir = nycyData.khaUdara;
    currentCapacityGround = nycyData.khaTanah;
  }

  // NYA/NYAF Specific Data Overrides
  const nyaKey = `${effectiveParams.size}`;
  const nyaData = (effectiveParams.standard.includes('(NYA)') || effectiveParams.standard.includes('(NYAF)')) ? NYA_NYAF_DATA[nyaKey] : null;

  if (nyaData) {
    currentCapacityAir = nyaData.khaUdara;
    currentCapacityGround = nyaData.khaTanah;
  }

  const coreDiameter = diameterOverMgt + (2 * conductorScreenThickness) + (2 * insulationThickness) + (2 * insulationScreenThickness);
  
  // Earthing Core Diameter
  let earthingCoreDiameter = 0;
  let earthingInsulationWeightPerCore = 0;
  let earthingInsulationThickness = 0;
  if (earthingCores > 0) {
    earthingInsulationThickness = effectiveParams.manualEarthingInsulationThickness || (abcTData ? abcTData.messenger.insulationThickness : (effectiveParams.insulationMaterial === 'XLPE' ? earthingData.xlpeThick : earthingData.pvcThick));
    earthingCoreDiameter = abcTData && !effectiveParams.manualEarthingInsulationThickness && !effectiveParams.manualEarthingConductorDiameter ? abcTData.messenger.coreDiameter : earthingConductorDiameter + (2 * earthingInsulationThickness);
    
    const rEarthCond = earthingConductorDiameter / 2;
    const rEarthIns = earthingCoreDiameter / 2;
    let earthingInsArea = Math.PI * (rEarthIns * rEarthIns - rEarthCond * rEarthCond);
    
    // Add filling factor for stranded conductors without conductor screen
    if (effectiveParams.conductorType !== 're') {
      const factor = getWeightAdditionFactor(earthingWireCount);
      earthingInsArea *= (1 + factor);
    }
    
    earthingInsulationWeightPerCore = earthingInsArea * densities[effectiveParams.insulationMaterial];
  }

  // 2.5 Metallic Screen (MV Only)
  let mvScreenWeightPerCore = 0;
  let mvScreenThickness = 0;
  let diameterOverScreen = coreDiameter;

  if (effectiveParams.standard === 'IEC 60502-2' && effectiveParams.mvScreenType && effectiveParams.mvScreenType !== 'None') {
    if (effectiveParams.mvScreenType === 'CTS') {
      // Copper Tape Screen: typically 0.1mm thickness, overlapped
      mvScreenThickness = effectiveParams.manualMvScreenThickness || 0.2; // Effective thickness with overlap
      diameterOverScreen = coreDiameter + (2 * mvScreenThickness);
      const meanDiameter = coreDiameter + mvScreenThickness;
      // Area = pi * D * t * overlap_factor
      const area = Math.PI * meanDiameter * (effectiveParams.manualMvScreenThickness ? effectiveParams.manualMvScreenThickness / 2 : 0.1) * 1.25; // 0.1mm tape, 25% overlap
      mvScreenWeightPerCore = area * densities.Cu;
    } else if (effectiveParams.mvScreenType === 'CWS') {
      // Copper Wire Screen: specified by cross section (e.g., 16mm2)
      const screenSize = effectiveParams.mvScreenSize || 16;
      
      // New logic for n x d
      let wireCount = effectiveParams.manualMvScreenWireCount || 0;
      let wireDia = effectiveParams.manualMvScreenWireDiameter || 0;
      
      if (wireCount > 0 && wireDia > 0) {
          const area = wireCount * (Math.PI * wireDia * wireDia / 4);
          mvScreenWeightPerCore = area * densities.Cu * 1.05;
          mvScreenThickness = wireDia;
      } else {
          mvScreenWeightPerCore = screenSize * densities.Cu * 1.05; // 5% lay factor
          
          // Approximate thickness based on wire diameter for that size
          if (effectiveParams.manualMvScreenThickness) {
            mvScreenThickness = effectiveParams.manualMvScreenThickness;
          } else {
            if (screenSize <= 16) mvScreenThickness = 1.0;
            else if (screenSize <= 25) mvScreenThickness = 1.2;
            else mvScreenThickness = 1.5;
          }
      }
      
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
    
    // Add filling factor for stranded conductors without conductor screen
    if (effectiveParams.conductorType !== 're') {
      const factor = getWeightAdditionFactor(wireCount);
      insulationArea *= (1 + factor);
    }
  }

  const insulationWeightPerCore = insulationArea * densities[effectiveParams.insulationMaterial]; // kg/km
  const totalInsulationWeight = (insulationWeightPerCore * effectiveParams.cores) + (earthingInsulationWeightPerCore * earthingCores);
  const totalEarthingInsulationWeight = earthingInsulationWeightPerCore * earthingCores;
  
  const semiCondWeightPerCore = semiCondArea * densities.SemiCond; // Density for semi-cond
  const totalSemiCondWeight = semiCondWeightPerCore * effectiveParams.cores;

  // 3. Laying up
  const totalCores = effectiveParams.cores + earthingCores;
  
  let laidUpDiameter = effectiveParams.manualLaidUpDiameter;
  
  if (!laidUpDiameter) {
    if (earthingCores > 0 && earthingCoreDiameter < diameterOverScreen) {
      laidUpDiameter = calculateMixedLayingUpDiameter(diameterOverScreen, earthingCoreDiameter, effectiveParams.cores, earthingCores, effectiveParams.cablingModel);
    } else {
      let laidUpFactor = getLayingUpFactor(totalCores);
      laidUpDiameter = totalCores === 1 ? diameterOverScreen : diameterOverScreen * laidUpFactor;
    }
  }
  
  // Instrumentation Formation Logic
  let formationDiameter = coreDiameter;
  let formationWeight = (conductorWeightPerCore + insulationWeightPerCore + mgtWeightPerCore);
  let isWeight = 0;
  let isAlWeight = 0;
  let isDrainWeight = 0;
  let isPetWeight = 0;
  let isMultiplier = 1;
  let osWeight = 0;
  let osAlWeight = 0;
  let osDrainWeight = 0;
  let osPetWeight = 0;

  if (effectiveParams.standard === 'BS EN 50288-7') {
    const formationType = effectiveParams.formationType || 'Pair';
    const elementsPerFormation = formationType === 'Pair' ? 2 : (formationType === 'Triad' ? 3 : 1);
    isMultiplier = formationType === 'Pair' ? effectiveParams.cores / 2 : (formationType === 'Triad' ? effectiveParams.cores / 3 : effectiveParams.cores);
    
    // Diameter of one pair or triad
    if (formationType === 'Pair') {
      formationDiameter = coreDiameter * 2;
      formationWeight = (conductorWeightPerCore + insulationWeightPerCore + mgtWeightPerCore) * 2;
    } else if (formationType === 'Triad') {
      formationDiameter = coreDiameter * 2.15;
      formationWeight = (conductorWeightPerCore + insulationWeightPerCore + mgtWeightPerCore) * 3;
    }

    // Individual Screen (IS)
    if (effectiveParams.hasIndividualScreen && formationType !== 'Core') {
      // Construction: PET Tape + Drain Wire + Al Tape + PET Tape
      const petThk = effectiveParams.manualIsPolyesterThickness || 0.05;
      const petOverlap = effectiveParams.manualIsPolyesterOverlap || 25;
      const alThk = effectiveParams.manualIsAluminiumThickness || 0.05;
      const alOverlap = effectiveParams.manualIsAluminiumOverlap || 25;
      
      const drainWireCount = effectiveParams.manualIsDrainWireCount || 17;
      const drainWireDia = effectiveParams.manualIsDrainWireDiameter || 0.2;
      const drainWireSize = effectiveParams.manualIsDrainWireSize || (drainWireCount * Math.PI * Math.pow(drainWireDia / 2, 2));
      
      const isThk = (2 * petThk) + alThk; // Estimated thickness contribution
      const diaBeforeIS = formationDiameter;
      formationDiameter += 2 * isThk;
      
      const petDensity = 1.38;
      const alDensity = 2.7;
      
      // Weight per formation
      const pWeight = Math.PI * (diaBeforeIS + petThk) * petThk * petDensity * (1 + petOverlap/100) * 2; // 2 layers
      const aWeight = Math.PI * (diaBeforeIS + 2 * petThk + alThk) * alThk * alDensity * (1 + alOverlap/100);
      const drainWireWeight = drainWireSize * densities.Cu * 1.02; // kg/km
      
      isAlWeight = aWeight * isMultiplier;
      isDrainWeight = drainWireWeight * isMultiplier;
      isPetWeight = pWeight * isMultiplier;
      isWeight = isAlWeight + isDrainWeight + isPetWeight;
      
      formationWeight += (pWeight + aWeight + drainWireWeight);
    }

    let factor = getLayingUpFactor(isMultiplier);
    
    // Industrial formulation for instrument cable laying up
    const INSTRUMENT_FACTORS: Record<number, number> = {
      1: 1.0, 2: 2.0, 3: 2.15, 4: 2.41, 5: 2.7, 6: 3.0, 7: 3.0, 
      8: 3.45, 10: 3.8, 12: 4.15, 16: 4.7, 20: 5.33, 24: 5.77, 30: 6.41, 36: 7.0
    };
    
    if (INSTRUMENT_FACTORS[isMultiplier]) {
      factor = INSTRUMENT_FACTORS[isMultiplier];
    } else if (isMultiplier > 1) {
      const sorted = Object.keys(INSTRUMENT_FACTORS).map(Number).sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (isMultiplier > sorted[i] && isMultiplier < sorted[i+1]) {
          const c1 = sorted[i];
          const c2 = sorted[i+1];
          const f1 = INSTRUMENT_FACTORS[c1];
          const f2 = INSTRUMENT_FACTORS[c2];
          factor = f1 + ((isMultiplier - c1) / (c2 - c1)) * (f2 - f1);
          break;
        }
      }
    }

    if (!effectiveParams.manualLaidUpDiameter) {
      if (isMultiplier === 1) {
        laidUpDiameter = formationDiameter + 0.1; // Add 0.1mm for binder tape
      } else if (isMultiplier === 2 && formationType === 'Pair' && !effectiveParams.hasIndividualScreen) {
        // 2 pairs without individual screen are typically laid up as a star quad
        laidUpDiameter = (coreDiameter * 2.41 * 1.03) + 0.1;
      } else {
        // Add 3% clearance factor for non-perfect nesting of pairs/triads + 0.1mm for binder tape
        laidUpDiameter = (formationDiameter * factor * 1.03) + 0.1;
      }
    } else {
      laidUpDiameter = effectiveParams.manualLaidUpDiameter;
    }

    // Overall Screen (OS)
    if (effectiveParams.hasOverallScreen) {
      const petThk = effectiveParams.manualOsPolyesterThickness || 0.05;
      const petOverlap = effectiveParams.manualOsPolyesterOverlap || 25;
      const alThk = effectiveParams.manualOsAluminiumThickness || 0.05;
      const alOverlap = effectiveParams.manualOsAluminiumOverlap || 25;
      
      const drainWireCount = effectiveParams.manualOsDrainWireCount || 17;
      const drainWireDia = effectiveParams.manualOsDrainWireDiameter || 0.2;
      const drainWireSize = effectiveParams.manualOsDrainWireSize || (drainWireCount * Math.PI * Math.pow(drainWireDia / 2, 2));

      const osThk = (2 * petThk) + alThk; // Estimated thickness contribution
      const diaBeforeOS = laidUpDiameter;
      laidUpDiameter += 2 * osThk;

      const petDensity = 1.38;
      const alDensity = 2.7;
      
      const pWeight = Math.PI * (diaBeforeOS + petThk) * petThk * petDensity * (1 + petOverlap/100) * 2;
      const aWeight = Math.PI * (diaBeforeOS + 2 * petThk + alThk) * alThk * alDensity * (1 + alOverlap/100);
      const drainWireWeight = drainWireSize * densities.Cu * 1.02; // kg/km
      
      osAlWeight = aWeight;
      osDrainWeight = drainWireWeight;
      osPetWeight = pWeight;
      osWeight = osAlWeight + osDrainWeight + osPetWeight;
    }
  }

  // Sector shaped reduction
  if (effectiveParams.conductorType === 'sm' && effectiveParams.cores >= 3 && !effectiveParams.manualLaidUpDiameter && effectiveParams.standard !== 'BS EN 50288-7') {
    laidUpDiameter = laidUpDiameter * 0.9; // Approx 10% reduction for sector shape
  }

  // 4. Inner Covering (Extruded)
  let innerCoveringWeight = 0;
  let diameterUnderArmor = effectiveParams.manualDiameterUnderArmor || laidUpDiameter;

  if (effectiveParams.standard.includes('NFA2X') || effectiveParams.standard === 'LiYCY') {
    innerCoveringThickness = 0;
    diameterUnderArmor = effectiveParams.manualDiameterUnderArmor || laidUpDiameter;
  } else if (effectiveParams.armorType !== 'Unarmored' || effectiveParams.hasInnerSheath || effectiveParams.manualInnerSheathThickness) {
    // Armor always requires inner sheath
    const needsInnerSheath = effectiveParams.armorType !== 'Unarmored' || effectiveParams.hasInnerSheath || effectiveParams.manualInnerSheathThickness;
    
    if (needsInnerSheath && innerCoveringThickness === undefined) {
      if (effectiveParams.standard === 'IEC 60092-353') {
        // Marine cable bedding formula: 0.04 * d + 0.8
        innerCoveringThickness = Math.round((0.04 * laidUpDiameter + 0.8) * 10) / 10;
      } else if (effectiveParams.standard === 'BS EN 50288-7') {
        innerCoveringThickness = Math.max(0.8, Math.round((0.04 * laidUpDiameter + 0.7) * 10) / 10);
      } else {
        if (laidUpDiameter <= 25) innerCoveringThickness = 1.0;
        else if (laidUpDiameter <= 35) innerCoveringThickness = 1.2;
        else if (laidUpDiameter <= 45) innerCoveringThickness = 1.4;
        else if (laidUpDiameter <= 60) innerCoveringThickness = 1.6;
        else innerCoveringThickness = 2.0;
      }
    }

    const finalInnerThickness = innerCoveringThickness || 0;
    if (!effectiveParams.manualDiameterUnderArmor) {
      diameterUnderArmor = laidUpDiameter + 2 * finalInnerThickness;
    }
    const rLaidUp = laidUpDiameter / 2;
    const rUnderArmor = diameterUnderArmor / 2;
    
    // 1. Ring Area (The sheath layer itself)
    const ringArea = Math.PI * (rUnderArmor * rUnderArmor - rLaidUp * rLaidUp);
    
    // 2. Interstice Area (Gaps between cores)
    // For circular cores, the gap is the area of the laid-up circle minus the area of the cores
    const phaseCoreAreaTotal = effectiveParams.cores * Math.PI * Math.pow(diameterOverScreen / 2, 2);
    const earthingCoreAreaTotal = earthingCores * Math.PI * Math.pow(earthingCoreDiameter / 2, 2);
    const coreAreaTotal = phaseCoreAreaTotal + earthingCoreAreaTotal;
    
    const laidUpArea = Math.PI * Math.pow(laidUpDiameter / 2, 2);
    let intersticeArea = Math.max(0, laidUpArea - coreAreaTotal);
    
    // Reduction for sector shape (sm) - gaps are much smaller
    if (effectiveParams.conductorType === 'sm') {
      intersticeArea = intersticeArea * 0.2; // 80% reduction in gaps for sector shape
    }
    
    // Filler Factor: Industrial cables often use 70-90% filling for extruded bedding
    const fillerFactor = effectiveParams.standard === 'BS EN 50288-7' ? 0 : 0.85; 
    const totalCoresCount = effectiveParams.cores + earthingCores;
    const weightAdditionFactor = getWeightAdditionFactor(totalCoresCount);
    const totalInnerSheathArea = (ringArea + (intersticeArea * fillerFactor)) * (1 + weightAdditionFactor);
    
    innerCoveringWeight = totalInnerSheathArea * (densities[effectiveParams.innerSheathMaterial || 'PVC'] || densities.PVC);
  }

  // 4.5 Screen (CTS, SWS) - New Feature
  let screenWeight = 0;
  let screenThickness = effectiveParams.manualScreenThickness || 0;
  let diameterOverOverallScreen = diameterUnderArmor;

  const isIEC60502_1 = effectiveParams.standard === 'IEC 60502-1';

  if (isIEC60502_1 && effectiveParams.hasScreen && effectiveParams.screenType && effectiveParams.screenType !== 'None') {
    if (effectiveParams.screenType === 'CTS') {
      if (!effectiveParams.manualScreenThickness) screenThickness = 0.2; // Effective thickness with overlap
      diameterOverOverallScreen = diameterUnderArmor + (2 * screenThickness);
      const meanDiameter = diameterUnderArmor + screenThickness;
      const area = Math.PI * meanDiameter * (effectiveParams.manualScreenThickness ? effectiveParams.manualScreenThickness / 2 : 0.1) * 1.25; // 0.1mm tape, 25% overlap
      screenWeight = area * (densities.CTS || densities.Cu);
    } else if (effectiveParams.screenType === 'CWS') {
      const cwsSize = effectiveParams.screenSize || 16;
      
      // New logic for n x d
      let wireCount = effectiveParams.manualScreenWireCount || 0;
      let wireDia = effectiveParams.manualScreenWireDiameter || 0;
      
      if (wireCount > 0 && wireDia > 0) {
          const area = wireCount * (Math.PI * wireDia * wireDia / 4);
          screenWeight = area * (densities.CWS || densities.Cu) * 1.1;
          screenThickness = wireDia;
      } else {
          // Copper Wire Screen weight calculation
          // Weight (kg/km) = Area (mm2) * Density (kg/dm3) * Lay Factor (approx 1.1)
          screenWeight = cwsSize * (densities.CWS || densities.Cu) * 1.1;
          
          // Approximate thickness based on wire diameter for that size
          // 16mm2 -> ~0.7mm, 25mm2 -> ~0.9mm, 35mm2 -> ~1.1mm
          if (!effectiveParams.manualScreenThickness) screenThickness = Math.sqrt(cwsSize / 16) * 0.7;
      }
      
      diameterOverOverallScreen = diameterUnderArmor + (2 * screenThickness);
    }
  } else if (effectiveParams.standard === 'SPLN 43-4 (NYCY)' && effectiveParams.hasScreen) {
    const cwsSize = effectiveParams.screenSize || (nycyData ? nycyData.screenSize : effectiveParams.size);
    screenWeight = cwsSize * densities.Cu * 1.1; // 10% lay factor for concentric wires
    // Add copper tape weight (approx 0.1mm x width)
    const tapeWeight = Math.PI * diameterUnderArmor * 0.1 * densities.Cu * 1.2; 
    screenWeight += tapeWeight;
    
    if (!effectiveParams.manualScreenThickness) {
      screenThickness = 0.5 + 0.1; // wires + tape approx
    }
    diameterOverOverallScreen = diameterUnderArmor + (2 * screenThickness);
  }

  // 4.6 Separator Sheath - New Feature
  let separatorWeight = 0;
  let separatorThickness = effectiveParams.manualSeparatorThickness || 0;
  let diameterOverSeparator = diameterOverOverallScreen;

  // Auto-separator logic: if cable has screen and armor
  const autoSeparator = isIEC60502_1 && effectiveParams.hasScreen && effectiveParams.armorType !== 'Unarmored';
  const needsSeparator = (isIEC60502_1 && (effectiveParams.hasSeparator || autoSeparator)) || effectiveParams.standard === 'LiYCY';

  if (needsSeparator) {
    if (effectiveParams.standard === 'LiYCY' || effectiveParams.separatorMaterial === 'Polyester Tape') {
      // Polyester Tape is a wrapped tape, not extruded
      if (!effectiveParams.manualSeparatorThickness) {
        separatorThickness = 0.05; // Typical PET tape thickness
      }
      diameterOverSeparator = diameterOverOverallScreen + (2 * separatorThickness);
      
      const petDensity = 1.38; // Density for Polyester
      const overlap = 25; // 25% overlap
      // Weight = PI * (D + t) * t * density * (1 + overlap/100)
      separatorWeight = Math.PI * (diameterOverOverallScreen + separatorThickness) * separatorThickness * petDensity * (1 + overlap/100);
    } else {
      if (!effectiveParams.manualSeparatorThickness) {
        const calcThick = 0.02 * diameterOverOverallScreen + 0.6;
        separatorThickness = calcThick < 1 ? 1.0 : Math.round(calcThick * 10) / 10;
      }
      diameterOverSeparator = diameterOverOverallScreen + (2 * separatorThickness);
      const rUnder = diameterOverOverallScreen / 2;
      const rOver = diameterOverSeparator / 2;
      const area = Math.PI * (rOver * rOver - rUnder * rUnder);
      separatorWeight = area * (densities[effectiveParams.separatorMaterial || 'PVC'] || densities.PVC);
    }
  }

  // Update diameter under armor to include screen and separator
  diameterUnderArmor = diameterOverSeparator;

  // 5. Armor
  let armorThickness = effectiveParams.manualArmorThickness || 0;
  let armorWeight = 0;
  let armorWireWeight = 0;
  let armorTapeWeight = 0;
  let armorWireDiameter = 0;
  let armorTapeThickness = 0;
  let armorFlatThickness = 0;
  let gswbCarriers = 0;
  let gswbWiresPerCarrier = 0;
  let gswbLayPitch = 0;
  let gswbCoverage = 0;
  let diameterOverArmor = effectiveParams.manualDiameterOverArmor || diameterUnderArmor;

  if (effectiveParams.standard.includes('NFA2X')) {
    armorThickness = 0;
    diameterOverArmor = effectiveParams.manualDiameterOverArmor || diameterUnderArmor;
  } else if (effectiveParams.armorType === 'SWA' || effectiveParams.armorType === 'AWA') {
    if (!effectiveParams.manualArmorThickness) {
      if (effectiveParams.standard === 'BS EN 50288-7') {
        if (diameterUnderArmor <= 15) armorThickness = 0.9;
        else if (diameterUnderArmor <= 25) armorThickness = 1.25;
        else if (diameterUnderArmor <= 35) armorThickness = 1.6;
        else if (diameterUnderArmor <= 45) armorThickness = 2.0;
        else if (diameterUnderArmor <= 60) armorThickness = 2.5;
        else armorThickness = 3.15;
      } else {
        // SWA Wire diameters according to IEC 60502-1
        if (diameterUnderArmor <= 10) armorThickness = 0.8;
        else if (diameterUnderArmor <= 15) armorThickness = 1.25;
        else if (diameterUnderArmor <= 25) armorThickness = 1.6;
        else if (diameterUnderArmor <= 35) armorThickness = 2.0;
        else if (diameterUnderArmor <= 60) armorThickness = 2.5;
        else armorThickness = 3.15;
      }
    }

    if (!effectiveParams.manualDiameterOverArmor) {
      diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    }
    
    // Approximate number of wires
    const meanArmorDiameter = diameterUnderArmor + armorThickness;
    const numWires = Math.floor((Math.PI * meanArmorDiameter) / (armorThickness * 1.05)); // 5% gap
    const wireArea = Math.PI * Math.pow(armorThickness / 2, 2);
    const armorDensity = effectiveParams.armorType === 'AWA' ? (densities.AWA || densities.Al) : (densities.SWA || densities.SteelWire || densities.Steel);
    armorWireWeight = numWires * wireArea * armorDensity * 1.05; // 5% lay factor
    armorWeight = armorWireWeight;
    armorWireDiameter = armorThickness;
  } else if (effectiveParams.armorType === 'STA') {
    if (!effectiveParams.manualArmorThickness) {
      // STA Tape thickness
      if (diameterUnderArmor <= 30) armorThickness = 0.5;
      else if (diameterUnderArmor <= 70) armorThickness = 0.5;
      else armorThickness = 0.8;
    }

    armorTapeThickness = armorThickness;
    const overlap = effectiveParams.staOverlap ?? 25;
    // 2 layers of tape, approx 25% overlap -> effective thickness ~ 2 * thickness
    if (!effectiveParams.manualDiameterOverArmor) {
      diameterOverArmor = diameterUnderArmor + 4 * armorThickness;
    }
    const meanArmorDiameter = diameterUnderArmor + 2 * armorThickness;
    // Area of tape approx = pi * D * 2 * t * (1 + overlap/100)
    const overlapMultiplier = 1 + (overlap / 100);
    const tapeArea = Math.PI * meanArmorDiameter * 2 * armorThickness * overlapMultiplier;
    armorTapeWeight = tapeArea * (densities.STA || densities.Steel) * 1.02; // 2% lay factor
    armorWeight = armorTapeWeight;
  } else if (effectiveParams.armorType === 'SFA') {
    // Steel Flat & Tape Armour
    // Flat wire approx 0.8mm, Tape approx 0.2mm
    const flatThickness = 0.8;
    let tapeThickness = 0;
    if (diameterUnderArmor <= 30) tapeThickness = 0.3;
    else tapeThickness = 0.5;

    armorFlatThickness = flatThickness;
    armorTapeThickness = tapeThickness;
    armorThickness = flatThickness + tapeThickness;
    if (!effectiveParams.manualDiameterOverArmor) {
      diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    }
    
    const meanFlatDiameter = diameterUnderArmor + flatThickness;
    const flatArea = Math.PI * meanFlatDiameter * flatThickness * 0.9; // 90% coverage
    const meanTapeDiameter = diameterUnderArmor + 2 * flatThickness + tapeThickness;
    const tapeArea = Math.PI * meanTapeDiameter * tapeThickness * 1.2; // Overlap
    
    armorWireWeight = flatArea * 1.02 * (densities.SFA || densities.Steel); // 2% lay factor
    armorTapeWeight = tapeArea * 1.02 * (densities.SFA || densities.Steel);
    armorWeight = armorWireWeight + armorTapeWeight;
  } else if (effectiveParams.armorType === 'RGB') {
    // Steel Wire & Tape Armour
    // Wire approx matches SWA, Tape approx 0.3/0.5mm (Matching SFA tape thickness)
    let wireDia = effectiveParams.manualArmorThickness ? effectiveParams.manualArmorThickness * 0.85 : 0;
    if (!effectiveParams.manualArmorThickness) {
      if (diameterUnderArmor <= 10) wireDia = 0.8;
      else if (diameterUnderArmor <= 15) wireDia = 1.25;
      else if (diameterUnderArmor <= 25) wireDia = 1.6;
      else if (diameterUnderArmor <= 35) wireDia = 2.0;
      else if (diameterUnderArmor <= 60) wireDia = 2.5;
      else wireDia = 3.15;
    }
    
    let tapeThickness = 0;
    if (diameterUnderArmor <= 30) tapeThickness = 0.3;
    else tapeThickness = 0.5;
    if (effectiveParams.manualArmorThickness) tapeThickness = effectiveParams.manualArmorThickness * 0.15;
    
    armorWireDiameter = wireDia;
    armorTapeThickness = tapeThickness;
    armorThickness = wireDia + tapeThickness;
    if (!effectiveParams.manualDiameterOverArmor) {
      diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    }
    
    const meanWireDiameter = diameterUnderArmor + wireDia;
    const numWires = Math.floor((Math.PI * meanWireDiameter) / (wireDia * 1.1));
    const wireArea = numWires * Math.PI * Math.pow(wireDia / 2, 2);
    const meanTapeDiameter = diameterUnderArmor + 2 * wireDia + tapeThickness;
    const tapeArea = Math.PI * meanTapeDiameter * tapeThickness * 1.2;
    
    armorWireWeight = wireArea * 1.05 * (densities.RGB || densities.Steel); // 5% lay factor for wire
    armorTapeWeight = tapeArea * 1.02 * (densities.RGB || densities.Steel); // 2% for tape
    armorWeight = armorWireWeight + armorTapeWeight;
  } else if (effectiveParams.armorType === 'GSWB' || effectiveParams.armorType === 'TCWB' || effectiveParams.armorType === 'CWB') {
    // Industrial Level Braid Calculation (GSWB/TCWB)
    // Formula based on standard industry practices (e.g., Belden, Alpha Wire)
    
    let wireDia = effectiveParams.manualArmorThickness ? effectiveParams.manualArmorThickness / 2 : 0.3;
    if (effectiveParams.manualBraidWireDiameter) {
      wireDia = effectiveParams.manualBraidWireDiameter;
    } else if (effectiveParams.standard === 'LiYCY') {
      wireDia = 0.18;
    } else if (!effectiveParams.manualArmorThickness) {
      if (diameterUnderArmor <= 15) wireDia = 0.2;
      else if (diameterUnderArmor <= 30) wireDia = 0.3;
      else wireDia = 0.4;
    }
    
    armorWireDiameter = wireDia;

    // 1. Number of carriers (m) - typical industrial braiding machine spindles
    let carriers = 24;
    if (effectiveParams.manualGswbCarriers) {
      carriers = effectiveParams.manualGswbCarriers;
    } else {
      if (diameterUnderArmor <= 10) carriers = 16;
      else if (diameterUnderArmor <= 20) carriers = 24;
      else if (diameterUnderArmor <= 35) carriers = 32;
      else if (diameterUnderArmor <= 50) carriers = 48;
      else carriers = 64;
    }

    gswbCarriers = carriers;

    // 2. Braid angle (alpha) - typically 45 degrees is the design target for optimal flexibility and coverage
    const meanBraidDiameter = diameterUnderArmor + wireDia;
    let alphaRad;
    let gswbLayPitchVal;
    
    if (effectiveParams.manualGswbLayPitch) {
      gswbLayPitchVal = effectiveParams.manualGswbLayPitch;
      // L = (PI * D) / tan(alpha) => tan(alpha) = (PI * D) / L
      alphaRad = Math.atan((Math.PI * meanBraidDiameter) / gswbLayPitchVal);
    } else {
      const braidAngleDeg = 45; 
      alphaRad = braidAngleDeg * Math.PI / 180;
      gswbLayPitchVal = (Math.PI * meanBraidDiameter) / Math.tan(alphaRad);
    }
    
    gswbLayPitch = gswbLayPitchVal;
    
    const cosAlpha = Math.cos(alphaRad);
    const sinAlpha = Math.sin(alphaRad);
    
    // 3. Lay Factor (Take-up factor) - accounts for the extra length of wire due to helical path
    const layFactor = 1 / cosAlpha;
    
    let n;
    if (effectiveParams.manualGswbWiresPerCarrier) {
      n = effectiveParams.manualGswbWiresPerCarrier;
    } else {
      const coverageTarget = (effectiveParams.braidCoverage || 90) / 100;
      
      // 4. Filling Factor (p)
      // Standard formula: Coverage K = (2p - p^2)
      // Solving for p: p = 1 - sqrt(1 - K)
      const fillingFactor = 1 - Math.sqrt(1 - coverageTarget);
      
      // 5. Number of wires per carrier (n)
      // p = (n * m * d) / (2 * PI * D * cos(alpha))
      // n = (p * 2 * PI * D * cos(alpha)) / (m * d)
      const exactN = (fillingFactor * 2 * Math.PI * meanBraidDiameter * cosAlpha) / (carriers * wireDia);
      n = Math.ceil(exactN); // Must be an integer
    }
    
    gswbWiresPerCarrier = n;
    
    // 7. Actual Coverage (K)
    // Re-calculate p based on integer n
    const actualP = (n * carriers * wireDia) / (2 * Math.PI * meanBraidDiameter * cosAlpha);
    gswbCoverage = (2 * actualP - actualP * actualP) * 100;

    // 8. Braiding Weight (W)
    // W = (n * m * PI * d^2 / 4) * density * layFactor
    const wireArea = (Math.PI * wireDia * wireDia) / 4;
    const armorDensity = effectiveParams.armorType === 'TCWB' ? densities.TCu : (effectiveParams.armorType === 'CWB' ? densities.Cu : (densities.GSWB || densities.Steel));
    
    armorWireWeight = (n * carriers) * wireArea * armorDensity * layFactor;
    armorWeight = armorWireWeight;
    
    armorThickness = (effectiveParams.standard === 'LiYCY') ? wireDia : wireDia * 2; // For LiYCY, thickness is the wire diameter
    if (!effectiveParams.manualDiameterOverArmor) {
      diameterOverArmor = diameterUnderArmor + 2 * armorThickness;
    }
  }

  // 6. Outer Sheath
  // IEC 60502-1 formula: ts = 0.035D + 1.0
  const fictitiousDiameter = diameterOverArmor;
  if (effectiveParams.standard.includes('NFA2X')) {
    sheathThickness = 0;
  } else if (sheathThickness === undefined) {
    if (effectiveParams.standard === 'LiYCY') {
      const nominalSheath = 0.08 * fictitiousDiameter + 0.8;
      sheathThickness = Math.round((0.85 * nominalSheath - 0.1) * 10) / 10;
    } else if (effectiveParams.standard === 'BS EN 50288-7') {
      if (effectiveParams.armorType === 'Unarmored') {
        sheathThickness = Math.max(1.8, Math.round((0.04 * fictitiousDiameter + 0.7) * 10) / 10);
      } else {
        sheathThickness = Math.max(1.3, Math.round((0.028 * fictitiousDiameter + 1.1) * 10) / 10);
      }
    } else {
      sheathThickness = Math.max(1.4, Math.round((0.035 * fictitiousDiameter + 1.0) * 10) / 10);
      
      // IEC 60092-353 Outer Sheath: 0.025 * d + 0.6
      if (effectiveParams.standard === 'IEC 60092-353') {
        sheathThickness = Math.round((0.025 * fictitiousDiameter + 0.6) * 10) / 10;
      }
      
      // Minimums for unarmored
      if (effectiveParams.armorType === 'Unarmored' && effectiveParams.cores === 1) {
        sheathThickness = Math.max(1.4, sheathThickness);
      } else if (effectiveParams.armorType === 'Unarmored' && effectiveParams.cores > 1) {
        sheathThickness = Math.max(1.8, sheathThickness);
      }
    }

    // NYAF and NYA have no sheath
    if (effectiveParams.standard.includes('(NYAF)') || effectiveParams.standard.includes('(NYA)')) {
      sheathThickness = 0;
    }
  }

  const finalSheathThickness = sheathThickness || 0;
  let overallDiameter = effectiveParams.manualOverallDiameter || (diameterOverArmor + 2 * finalSheathThickness);

  // SNI 04-6629.5 (NYMHY) specific overrides for OD
  if (effectiveParams.standard.includes('SNI 04-6629.5 (NYMHY)')) {
    const nymhyEntry = NYMHY_DATA.find(e => e.size === effectiveParams.size && e.cores === effectiveParams.cores);
    if (nymhyEntry && !effectiveParams.manualOverallDiameter) {
      overallDiameter = nymhyEntry.od;
    }
  }
  const rOverArmor = diameterOverArmor / 2;
  const rOverall = overallDiameter / 2;
  const sheathArea = Math.PI * (rOverall * rOverall - rOverArmor * rOverArmor);
  const sheathWeight = finalSheathThickness > 0 ? sheathArea * densities[effectiveParams.sheathMaterial] : 0;

  const totalWeight = abcTData ? abcTData.netWeight : (abcData ? abcData.netWeight : totalConductorWeight + totalInsulationWeight + totalSemiCondWeight + innerCoveringWeight + screenWeight + separatorWeight + armorWeight + sheathWeight + totalMvScreenWeight + totalMgtWeight + isWeight + osWeight);

  const scope = {
    PI: Math.PI,
    cores: effectiveParams.cores,
    size: effectiveParams.size,
    conductorDiameter,
    wireCount,
    wireDiameter,
    coreDiameter,
    laidUpDiameter,
    diameterUnderArmor,
    diameterOverArmor,
    overallDiameter,
    insulationThickness,
    innerSheathThickness: innerCoveringThickness,
    armorThickness,
    sheathThickness: finalSheathThickness,
    separatorThickness,
    screenThickness,
    mvScreenThickness,
    conductorScreenThickness,
    insulationScreenThickness,
    mgtThickness,
    densityCu: densities.Cu,
    densityAl: densities.Al,
    densityXLPE: densities.XLPE,
    densityPVC: densities.PVC,
    densityPE: densities.PE,
    densityLSZH: densities.LSZH,
    densitySteel: densities.Steel,
    densitySteelWire: densities.SteelWire,
    densitySemiCond: densities.SemiCond,
    densityMGT: densities.MGT,
    densityTCu: densities.TCu,
    densityCTS: densities.CTS || densities.Cu,
    densityCWS: densities.CWS || densities.Cu,
    densitySTA: densities.STA || densities.Steel,
    densitySWA: densities.SWA || densities.SteelWire,
    densityAWA: densities.AWA || densities.Al,
    densityGSWB: densities.GSWB || densities.Steel,
    densitySFA: densities.SFA || densities.Steel,
    densityRGB: densities.RGB || densities.Steel,
  };

  const evalFormula = (defaultWeight: number, defaultFormula: string, key: string) => {
    if (effectiveParams.customFormulas && effectiveParams.customFormulas[key]) {
      try {
        const customWeight = evaluate(effectiveParams.customFormulas[key], scope);
        return { weight: Number(customWeight), formula: effectiveParams.customFormulas[key], isCustom: true };
      } catch (e) {
        return { weight: defaultWeight, formula: defaultFormula, isCustom: false, error: true };
      }
    }
    return { weight: defaultWeight, formula: defaultFormula, isCustom: false };
  };

  // Weight Details with Formulas
  const weightDetails = {
    conductor: evalFormula(totalConductorWeight, `${effectiveParams.cores} cores * ${wireCount} wires * π * (${wireDiameter.toFixed(2)}/2)² * ${densities[effectiveParams.conductorMaterial]} * 1.02 (lay factor)`, 'conductor'),
    insulation: evalFormula(totalInsulationWeight, `${effectiveParams.cores} cores * π * ((${coreDiameter.toFixed(2)}/2)² - (${(conductorDiameter + 2 * conductorScreenThickness).toFixed(2)}/2)²) * ${densities[effectiveParams.insulationMaterial]}`, 'insulation'),
    outerSheath: evalFormula(sheathWeight, `π * ((${overallDiameter.toFixed(2)}/2)² - (${diameterOverArmor.toFixed(2)}/2)²) * ${densities[effectiveParams.sheathMaterial]}`, 'outerSheath')
  } as any;

  if (isWeight > 0) {
    weightDetails.isWeight = evalFormula(isWeight, `Individual Screen: ${isMultiplier} formations * (PET + Al + Drain Wire)`, 'isWeight');
  }
  if (osWeight > 0) {
    weightDetails.osWeight = evalFormula(osWeight, `Overall Screen: PET + Al + Drain Wire`, 'osWeight');
  }

  if (totalMgtWeight > 0) {
    weightDetails.mgt = evalFormula(totalMgtWeight, `${effectiveParams.cores} cores * π * ((${diameterOverMgt.toFixed(2)}/2)² - (${conductorDiameter.toFixed(2)}/2)²) * ${densities.MGT}`, 'mgt');
  }

  if (totalSemiCondWeight > 0) {
    weightDetails.conductorScreen = evalFormula(totalSemiCondWeight / 2, `${effectiveParams.cores} cores * π * ((${ (conductorDiameter/2 + conductorScreenThickness).toFixed(2) })² - (${(conductorDiameter/2).toFixed(2)})²) * ${densities.SemiCond}`, 'conductorScreen');
    weightDetails.insulationScreen = evalFormula(totalSemiCondWeight / 2, `${effectiveParams.cores} cores * π * ((${ (coreDiameter/2).toFixed(2) })² - (${(coreDiameter/2 - insulationScreenThickness).toFixed(2)})²) * ${densities.SemiCond}`, 'insulationScreen');
  }

  if (totalMvScreenWeight > 0 || screenWeight > 0) {
    const w = totalMvScreenWeight || screenWeight;
    const type = effectiveParams.mvScreenType !== 'None' ? effectiveParams.mvScreenType : effectiveParams.screenType;
    const defaultFormula = type === 'CTS' 
      ? `π * Mean Diameter * Thickness * 1.25 (overlap) * ${densities.Cu}`
      : `Area (${(totalMvScreenWeight || screenWeight) / (densities.Cu * 1.05)}) * ${densities.Cu} * 1.05 (lay factor)`;
    weightDetails.metallicScreen = evalFormula(w, defaultFormula, 'metallicScreen');
  }

  if (innerCoveringWeight > 0) {
    weightDetails.innerSheath = evalFormula(innerCoveringWeight, `π * ((${ (laidUpDiameter/2 + innerCoveringThickness).toFixed(2) })² - (${(laidUpDiameter/2).toFixed(2)})²) * ${densities[effectiveParams.innerSheathMaterial || 'PVC']}`, 'innerSheath');
  }

  if (armorWeight > 0) {
    let defaultFormula = '';
    if (effectiveParams.armorType === 'SWA' || effectiveParams.armorType === 'AWA') {
      defaultFormula = `${Math.floor((Math.PI * (diameterUnderArmor + armorThickness)) / (armorThickness * 1.05))} wires * π * (${armorThickness}/2)² * ${effectiveParams.armorType === 'AWA' ? densities.Al : densities.Steel} * 1.05`;
    } else if (effectiveParams.armorType === 'GSWB' || effectiveParams.armorType === 'TCWB') {
      const layFactor = (1 / Math.cos(45 * Math.PI / 180)).toFixed(3);
      defaultFormula = `(n=${gswbWiresPerCarrier} * m=${gswbCarriers}) * π * (d=${armorWireDiameter}/2)² * density * LayFactor(${layFactor})`;
    } else if (effectiveParams.armorType === 'STA') {
      const overlap = effectiveParams.staOverlap ?? 25;
      defaultFormula = `π * Mean Diameter * 2 * ${armorThickness} * ${densities.STA || densities.Steel} * (1 + ${overlap}/100)`;
    } else {
      defaultFormula = `π * Mean Diameter * 2 * ${armorThickness} * ${densities.Steel}`;
    }
    weightDetails.armor = evalFormula(armorWeight, defaultFormula, 'armor');
  }

  if (separatorWeight > 0) {
    weightDetails.separator = evalFormula(separatorWeight, `π * ((${ (diameterOverOverallScreen/2 + separatorThickness).toFixed(2) })² - (${(diameterOverOverallScreen/2).toFixed(2)})²) * ${densities[effectiveParams.separatorMaterial || 'PVC']}`, 'separator');
  }

  if (earthingCores > 0) {
    weightDetails.earthing = evalFormula(earthingConductorWeightPerCore * earthingCores + totalEarthingInsulationWeight, `Conductor: ${earthingCores} * Area * ${densities[effectiveParams.conductorMaterial]} + Insulation: ${earthingCores} * Area * ${densities[effectiveParams.insulationMaterial]}`, 'earthing');
  }

  // Recalculate total weight if custom formulas are used
  let finalTotalWeight = abcTData ? abcTData.netWeight : (abcData ? abcData.netWeight : 0);
  if (!abcTData && !abcData) {
    finalTotalWeight = (weightDetails.conductor?.weight || 0) +
                       (weightDetails.insulation?.weight || 0) +
                       (weightDetails.outerSheath?.weight || 0) +
                       (weightDetails.mgt?.weight || 0) +
                       (weightDetails.conductorScreen?.weight || 0) +
                       (weightDetails.insulationScreen?.weight || 0) +
                       (weightDetails.metallicScreen?.weight || 0) +
                       (weightDetails.innerSheath?.weight || 0) +
                       (weightDetails.armor?.weight || 0) +
                       (weightDetails.separator?.weight || 0) +
                       (weightDetails.earthing?.weight || 0) +
                       (weightDetails.isWeight?.weight || 0) +
                       (weightDetails.osWeight?.weight || 0);
  }

  // SNI 04-6629.5 (NYMHY) specific overrides for Weight
  if (effectiveParams.standard.includes('SNI 04-6629.5 (NYMHY)')) {
    const nymhyEntry = NYMHY_DATA.find(e => e.size === effectiveParams.size && e.cores === effectiveParams.cores);
    if (nymhyEntry && !effectiveParams.manualTotalWeight) {
      finalTotalWeight = nymhyEntry.weight;
    }
  }

  // NYMHY Standard Limits (Batas bawah / Batas atas)
  let overallDiameterMin: number | undefined;
  let overallDiameterMax: number | undefined;

  if (effectiveParams.standard.includes('SNI 04-6629.5 (NYMHY)')) {
    const size = effectiveParams.size;
    const cores = effectiveParams.cores;
    
    const limits: Record<string, [number, number]> = {
      '2x0.75': [5.7, 7.2], '2x1': [5.9, 7.5], '2x1.5': [6.8, 8.6], '2x2.5': [8.4, 10.6],
      '3x0.75': [6.0, 7.6], '3x1': [6.3, 8.0], '3x1.5': [7.4, 9.4], '3x2.5': [9.2, 11.4],
      '4x0.75': [6.6, 8.3], '4x1': [7.1, 9.0], '4x1.5': [8.4, 10.5], '4x2.5': [10.1, 12.5],
      '5x0.75': [7.4, 9.3], '5x1': [7.8, 9.8], '5x1.5': [9.3, 11.6], '5x2.5': [11.2, 13.9]
    };
    
    const key = `${cores}x${size}`;
    if (limits[key]) {
      [overallDiameterMin, overallDiameterMax] = limits[key];
    }
  }

  // Electrical
  // maxDcResistance, currentCapacityAir already calculated or overridden above
  
  // Test Voltage Calculation
  let testVoltage = '3.5 kV';
  let displayVoltage = effectiveParams.voltage;

  if (effectiveParams.standard === 'IEC 60502-2') {
    if (effectiveParams.voltage.includes('3.6/6')) testVoltage = '12.5 kV';
    else if (effectiveParams.voltage.includes('6/10')) testVoltage = '21 kV';
    else if (effectiveParams.voltage.includes('8.7/15')) testVoltage = '30.5 kV';
    else if (effectiveParams.voltage.includes('12/20')) testVoltage = '42 kV';
    else if (effectiveParams.voltage.includes('18/30')) testVoltage = '63 kV';
  } else if (effectiveParams.standard === 'IEC 60092-353') {
    testVoltage = '3.5 kV';
  } else if (effectiveParams.standard.includes('(NYM)')) {
    testVoltage = '2 kV';
  } else if (effectiveParams.standard.includes('(NYA)') || effectiveParams.standard.includes('(NYAF)')) {
    if (effectiveParams.voltage.includes('450/750')) testVoltage = '2.5 kV';
    else if (effectiveParams.voltage.includes('300/500')) testVoltage = '2 kV';
    else testVoltage = '2.5 kV';
  } else if (effectiveParams.standard === 'BS EN 50288-7') {
    testVoltage = effectiveParams.voltage.includes('300/500') ? '2 kV' : '1.5 kV';
  }

  // Short Circuit Calculation
  let shortCircuitCapacity = 0;
  const isCopper = effectiveParams.conductorMaterial === 'Cu' || effectiveParams.conductorMaterial === 'TCu';
  const resistivity = isCopper ? 17.241 : 28.264;
  let k = 0;

  if (effectiveParams.insulationMaterial === 'XLPE') {
    k = isCopper ? 142 : 96;
  } else { // PVC
    k = 115;
  }

  // Formula: K * (Resistivity / (maxDcResistance / 1.003) * 1.01) / 1000
  // Based on Excel: k * (resistivity / (maxDcResistance / 1.003) * 1.01) / 1000 / sqrt(time)
  // time = 1s
  if (maxDcResistance > 0) {
    shortCircuitCapacity = k * (resistivity / (maxDcResistance / 1.003) * 1.01) / 1000;
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
  } else if (effectiveParams.standard === 'IEC 60092-353') {
    flameRetardant = 'IEC 60332-3-22 (Cat.A)';
    if (effectiveParams.hasMgt || effectiveParams.fireguard) {
      flameRetardant += ' & IEC 60331 (Fire Resistant)';
    }
  }

  // Extract braid wire diameter for spec display
  let braidWireDiameter: number | undefined;
  if (effectiveParams.armorType === 'GSWB' || effectiveParams.armorType === 'TCWB') {
    braidWireDiameter = diameterUnderArmor <= 15 ? 0.2 : 0.3;
  }

  return {
    spec: {
      phaseCore: {
        conductorDiameter: Number(conductorDiameter.toFixed(2)),
        wireCount,
        wireDiameter: Number(wireDiameter.toFixed(2)),
        insulationThickness: Number(insulationThickness.toFixed(2)),
        coreDiameter: Number(coreDiameter.toFixed(2)),
      },
      earthingCore: earthingCores > 0 ? {
        conductorDiameter: Number(earthingConductorDiameter.toFixed(2)),
        wireCount: earthingWireCount,
        wireDiameter: Number(earthingWireDiameter.toFixed(2)),
        insulationThickness: Number(earthingInsulationThickness.toFixed(2)),
        coreDiameter: Number(earthingCoreDiameter.toFixed(2)),
        alWireCount: earthingAlWireCount,
        alWireDiameter: earthingAlWireDiameter,
        steelWireCount: earthingSteelWireCount,
        steelWireDiameter: earthingSteelWireDiameter,
      } : undefined,
      conductorDiameter: Number(conductorDiameter.toFixed(1)),
      wireCount,
      insulationThickness: Number(insulationThickness.toFixed(1)),
      coreDiameter: Number(coreDiameter.toFixed(1)),
      laidUpDiameter: Number(laidUpDiameter.toFixed(1)),
      innerCoveringThickness: Number((innerCoveringThickness || 0).toFixed(1)),
      diameterUnderArmor: Number(diameterUnderArmor.toFixed(1)),
      screenThickness: screenThickness > 0 ? Number(screenThickness.toFixed(1)) : undefined,
      separatorThickness: separatorThickness > 0 ? Number(separatorThickness.toFixed(1)) : undefined,
      armorThickness: Number(armorThickness.toFixed(1)),
      diameterOverArmor: Number(diameterOverArmor.toFixed(1)),
      sheathThickness: Number((sheathThickness || 0).toFixed(1)),
      overallDiameter: Number(overallDiameter.toFixed(1)),
      conductorScreenThickness: conductorScreenThickness > 0 ? Number(conductorScreenThickness.toFixed(1)) : undefined,
      insulationScreenThickness: insulationScreenThickness > 0 ? Number(insulationScreenThickness.toFixed(1)) : undefined,
      mvScreenDiameter: mvScreenThickness > 0 ? Number(diameterOverScreen.toFixed(1)) : undefined,
      mgtThickness: mgtThickness > 0 ? Number(mgtThickness.toFixed(1)) : undefined,
      overallDiameterMin,
      overallDiameterMax,
      braidWireDiameter,
      braidCoverage: (effectiveParams.armorType === 'GSWB' || effectiveParams.armorType === 'TCWB') ? (effectiveParams.braidCoverage || 90) : undefined,
      armorWireDiameter,
      armorTapeThickness,
      armorFlatThickness,
      staOverlap: effectiveParams.armorType === 'STA' ? (effectiveParams.staOverlap ?? 25) : undefined,
      gswbCarriers,
      gswbWiresPerCarrier,
      gswbLayPitch,
      gswbCoverage,
      aluminiumThickness: (effectiveParams.hasIndividualScreen || effectiveParams.hasOverallScreen) ? 0.05 : undefined,
      drainWireSize: (effectiveParams.hasIndividualScreen || effectiveParams.hasOverallScreen) ? 0.5 : undefined,
      polyesterTapeThickness: (effectiveParams.hasIndividualScreen || effectiveParams.hasOverallScreen) ? 0.05 : undefined,
      pairTriadDiameter: formationDiameter,
      breakingLoad: abcData?.breakingLoad,
    },
    bom: {
      conductorWeight: Number(applyScrap(weightDetails.conductor?.weight || totalConductorWeight, effectiveParams.conductorMaterial).toFixed(1)),
      insulationWeight: Number(applyScrap(weightDetails.insulation?.weight || totalInsulationWeight, effectiveParams.insulationMaterial).toFixed(1)),
      innerCoveringWeight: Number(applyScrap(weightDetails.innerSheath?.weight || innerCoveringWeight, effectiveParams.innerSheathMaterial || 'PVC').toFixed(1)),
      screenWeight: Number(applyScrap(screenWeight, effectiveParams.screenType === 'CTS' ? 'CTS' : (effectiveParams.screenType === 'CWS' ? 'CWS' : 'Steel')).toFixed(1)),
      separatorWeight: Number(applyScrap(weightDetails.separator?.weight || separatorWeight, effectiveParams.separatorMaterial || 'PVC').toFixed(1)),
      armorWeight: Number(applyScrap(weightDetails.armor?.weight || armorWeight, effectiveParams.armorType === 'AWA' ? 'AWA' : (effectiveParams.armorType === 'SWA' ? 'SWA' : (effectiveParams.armorType === 'STA' ? 'STA' : (effectiveParams.armorType === 'SFA' ? 'SFA' : (effectiveParams.armorType === 'RGB' ? 'RGB' : (effectiveParams.armorType === 'GSWB' ? 'GSWB' : (effectiveParams.armorType === 'TCWB' ? 'TCWB' : 'Steel'))))))).toFixed(1)),
      armorWireWeight: Number(applyScrap(armorWireWeight, 'SteelWire').toFixed(1)),
      armorTapeWeight: Number(applyScrap(armorTapeWeight, 'Steel').toFixed(1)),
      sheathWeight: Number(applyScrap(weightDetails.outerSheath?.weight || sheathWeight, effectiveParams.sheathMaterial).toFixed(1)),
      semiCondWeight: Number(applyScrap((weightDetails.conductorScreen?.weight || 0) + (weightDetails.insulationScreen?.weight || 0), 'SemiCond').toFixed(1)),
      mvScreenWeight: Number(applyScrap(weightDetails.metallicScreen?.weight || totalMvScreenWeight, 'Cu').toFixed(1)),
      mgtWeight: Number(applyScrap(weightDetails.mgt?.weight || totalMgtWeight, 'MGT').toFixed(1)),
      earthingConductorWeight: Number(applyScrap(earthingConductorWeightPerCore * earthingCores, effectiveParams.conductorMaterial).toFixed(1)),
      earthingAlWeight: earthingAlWeight > 0 ? Number(applyScrap(earthingAlWeight, 'Al').toFixed(1)) : undefined,
      earthingSteelWeight: earthingSteelWeight > 0 ? Number(applyScrap(earthingSteelWeight, 'SteelWire').toFixed(1)) : undefined,
      earthingInsulationWeight: Number(applyScrap(totalEarthingInsulationWeight, effectiveParams.insulationMaterial).toFixed(1)),
      isWeight: isWeight > 0 ? Number(applyScrap(isWeight, 'Cu').toFixed(1)) : 0,
      osWeight: osWeight > 0 ? Number(applyScrap(osWeight, 'Cu').toFixed(1)) : 0,
      isAlWeight: isAlWeight > 0 ? Number(applyScrap(isAlWeight, 'Al').toFixed(1)) : 0,
      isDrainWeight: isDrainWeight > 0 ? Number(applyScrap(isDrainWeight, 'Cu').toFixed(1)) : 0,
      isPetWeight: isPetWeight > 0 ? Number(applyScrap(isPetWeight, 'PE').toFixed(1)) : 0,
      osAlWeight: osAlWeight > 0 ? Number(applyScrap(osAlWeight, 'Al').toFixed(1)) : 0,
      osDrainWeight: osDrainWeight > 0 ? Number(applyScrap(osDrainWeight, 'Cu').toFixed(1)) : 0,
      osPetWeight: osPetWeight > 0 ? Number(applyScrap(osPetWeight, 'PE').toFixed(1)) : 0,
      isMultiplier: isMultiplier,
      totalWeight: Number(applyScrap(finalTotalWeight, 'Total').toFixed(1)),
    },
    weights: weightDetails,
    electrical: {
      maxDcResistance: Number(maxDcResistance.toFixed(4)),
      currentCapacityAir: Number(currentCapacityAir.toFixed(0)),
      currentCapacityGround: Number(currentCapacityGround.toFixed(0)),
      voltageRating: displayVoltage,
      testVoltage: testVoltage,
      shortCircuitCapacity: Number(shortCircuitCapacity.toFixed(2)),
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

export function calculateOverallDiameter(phaseSize: number, earthSize: number, configType: '3+1' | '3+2' | '3+3'): number {
  const phaseData = CABLE_DATA.find(d => d.size === phaseSize);
  const earthData = CABLE_DATA.find(d => d.size === earthSize);
  
  if (!phaseData || !earthData) return 0;
  
  const d1 = phaseData.diameter + (2 * phaseData.xlpeThick);
  const d2 = earthData.diameter + (2 * earthData.xlpeThick);
  
  if (configType === '3+1') {
    return (d1 * 2.154) + (d2 * 0.483);
  } else if (configType === '3+2') {
    return (d1 * 2.154) + (d2 * 0.82);
  } else {
    return (d1 * 2.154) + (d2 * 1.0);
  }
}
