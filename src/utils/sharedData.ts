
export interface SizeData {
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

export const CWS_WIRE_DIAMETERS: Record<number, number> = {
  1.5: 0.4,
  2.5: 0.4,
  4: 0.5,
  6: 0.5,
  10: 0.66,
  16: 0.8,
  25: 1.02,
  35: 1.04,
  50: 1.35,
  70: 1.35,
  95: 2.14,
  120: 1.78,
  150: 2.03,
  185: 2.03,
  240: 2.03,
  300: 2.03,
};

export interface MaterialDensities {
  Cu: number;
  Al: number;
  XLPE: number;
  PVC: number;
  PE: number;
  LSZH: number;
  Steel: number;
  SteelWire: number;
  'Inner Semi Conductive': number;
  'Outer Semi Conductive': number;
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
  'XLPE MV': number;
  TCWB: number;
  CTS: number;
  CWS: number;
  STA: number;
  SWA: number;
  AWA: number;
  ATA: number;
  GSWB: number;
  SFA: number;
  RGB: number;
  'Polyester Tape': number;
  'PP Yarn': number;
  Jute: number;
  Filler: number;
  None: number;
}

export const DEFAULT_DENSITIES: MaterialDensities = {
  Cu: 8.89,
  Al: 2.7,
  XLPE: 0.92,
  PVC: 1.45,
  PE: 0.95,
  LSZH: 1.5,
  Steel: 7.85,
  SteelWire: 7.85,
  'Inner Semi Conductive': 1.15,
  'Outer Semi Conductive': 1.15,
  MGT: 2.2,
  TCu: 8.89,
  'XLPE MV': 0.93,
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
  ATA: 2.7,
  GSWB: 7.85,
  SFA: 7.85,
  RGB: 7.85,
  'Polyester Tape': 1.38,
  'PP Yarn': 0.9,
  Jute: 0.6,
  Filler: 1.45,
  None: 0,
};

export const LAYING_UP_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 2.16,
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
