
export interface ABCData {
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

export interface ABCMessengerData extends ABCData {
  alWireCount: number;
  alWireDiameter: number;
  steelWireCount: number;
  steelWireDiameter: number;
}

export const NFA2X_DATA: Record<string, ABCData> = {
  '2x10': { size: 10, wireCount: 7, wireDiameter: 1.35, condDiameter: 4.05, condWeight: 27.61, insulationThickness: 1.20, coreDiameter: 6.45, resistance: 3.08, ampacity: 54, netWeight: 100.4, breakingLoad: 3.22 },
  '2x16': { size: 16, wireCount: 7, wireDiameter: 1.70, condDiameter: 5.10, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.50, resistance: 1.91, ampacity: 72, netWeight: 144.2, breakingLoad: 5.15 },
  '4x10': { size: 10, wireCount: 7, wireDiameter: 1.35, condDiameter: 4.05, condWeight: 27.61, insulationThickness: 1.20, coreDiameter: 6.45, resistance: 3.08, ampacity: 54, netWeight: 200.8, breakingLoad: 6.44 },
  '4x16': { size: 16, wireCount: 7, wireDiameter: 1.70, condDiameter: 5.10, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.50, resistance: 1.91, ampacity: 72, netWeight: 288.4, breakingLoad: 10.30 },
  '4x25': { size: 25, wireCount: 7, wireDiameter: 2.14, condDiameter: 6.42, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.22, resistance: 1.20, ampacity: 102, netWeight: 437.8, breakingLoad: 16.10 },
  '4x35': { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 603.7, breakingLoad: 22.54 },
};

export const NFA2XT_DATA: Record<string, { phase: ABCData, messenger: ABCMessengerData, netWeight: number }> = {
  '2x25+25': {
    phase: { size: 25, wireCount: 7, wireDiameter: 2.14, condDiameter: 6.42, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.22, resistance: 1.20, ampacity: 105, netWeight: 0 },
    messenger: { size: 25, wireCount: 7, wireDiameter: 2.12, condDiameter: 6.36, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.16, resistance: 1.38, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.12, steelWireCount: 1, steelWireDiameter: 2.12, breakingLoad: 8.52 },
    netWeight: 320
  },
  '2x35+25': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 25, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.48, condWeight: 68.73, insulationThickness: 1.4, coreDiameter: 9.28, resistance: 1.38, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.13, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 8.52 },
    netWeight: 410
  },
  '2x35+35': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.73, condDiameter: 8.31, condWeight: 96.21, insulationThickness: 1.5, coreDiameter: 11.31, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.73, steelWireCount: 1, steelWireDiameter: 2.73, breakingLoad: 11.90 },
    netWeight: 500
  },
  '2x35+50': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 600
  },
  '2x50+35': {
    phase: { size: 50, wireCount: 19, wireDiameter: 1.83, condDiameter: 9.15, condWeight: 137.4, insulationThickness: 1.60, coreDiameter: 12.35, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.52, steelWireCount: 1, steelWireDiameter: 2.52, breakingLoad: 11.90 },
    netWeight: 560
  },
  '2x50+50': {
    phase: { size: 50, wireCount: 19, wireDiameter: 1.83, condDiameter: 9.15, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.35, resistance: 0.641, ampacity: 154, netWeight: 0 },
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
    phase: { size: 120, wireCount: 37, wireDiameter: 2.03, condDiameter: 14.21, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.81, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 95, wireCount: 19, wireDiameter: 2.52, condDiameter: 12.60, condWeight: 261.3, insulationThickness: 1.80, coreDiameter: 16.20, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 18, alWireDiameter: 2.52, steelWireCount: 1, steelWireDiameter: 2.52, breakingLoad: 32.64 },
    netWeight: 1400
  },
  '3x35+25': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.13, condDiameter: 6.48, condWeight: 96.21, insulationThickness: 1.4, coreDiameter: 9.28, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.13, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 11.90 },
    netWeight: 545
  },
  '3x35+35': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 35, wireCount: 7, wireDiameter: 2.73, condDiameter: 8.31, condWeight: 96.21, insulationThickness: 1.5, coreDiameter: 11.31, resistance: 0.986, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 2.73, steelWireCount: 1, steelWireDiameter: 2.73, breakingLoad: 11.90 },
    netWeight: 600
  },
  '3x35+50': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 700
  },
  '3x50+35': {
    phase: { size: 50, wireCount: 19, wireDiameter: 1.83, condDiameter: 9.15, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.35, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 10.76, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 2.52, steelWireCount: 0, steelWireDiameter: 2.73, breakingLoad: 17.00 },
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
    phase: { size: 120, wireCount: 37, wireDiameter: 2.03, condDiameter: 14.21, condWeight: 330.1, insulationThickness: 1.8, coreDiameter: 17.81, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 95, wireCount: 33, wireDiameter: 2.14, condDiameter: 14.14, condWeight: 261.3, insulationThickness: 1.6, coreDiameter: 17.34, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 26, alWireDiameter: 2.14, steelWireCount: 7, steelWireDiameter: 1.68, breakingLoad: 32.64 },
    netWeight: 1950
  },
  '3x50+50': {
    phase: { size: 50, wireCount: 19, wireDiameter: 1.83, condDiameter: 9.15, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 12.35, resistance: 0.641, ampacity: 154, netWeight: 0 },
    messenger: { size: 50, wireCount: 7, wireDiameter: 3.26, condDiameter: 9.92, condWeight: 137.4, insulationThickness: 1.6, coreDiameter: 13.12, resistance: 0.689, ampacity: 0, netWeight: 0, alWireCount: 6, alWireDiameter: 3.26, steelWireCount: 1, steelWireDiameter: 3.26, breakingLoad: 17.00 },
    netWeight: 900
  },
  '3x95+95': {
    phase: { size: 95, wireCount: 19, wireDiameter: 2.52, condDiameter: 12.60, condWeight: 261.3, insulationThickness: 1.8, coreDiameter: 16.20, resistance: 0.320, ampacity: 235, netWeight: 0 },
    messenger: { size: 95, wireCount: 33, wireDiameter: 2.16, condDiameter: 14.27, condWeight: 261.3, insulationThickness: 1.6, coreDiameter: 17.47, resistance: 0.306, ampacity: 0, netWeight: 0, alWireCount: 26, alWireDiameter: 2.16, steelWireCount: 7, steelWireDiameter: 1.68, breakingLoad: 32.64 },
    netWeight: 1700
  },
  '3x120+120': {
    phase: { size: 120, wireCount: 37, wireDiameter: 2.03, condDiameter: 14.21, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.81, resistance: 0.253, ampacity: 275, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.85, condDiameter: 14.25, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.85, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 18, alWireDiameter: 2.85, steelWireCount: 1, steelWireDiameter: 2.85, breakingLoad: 40.0 },
    netWeight: 2100
  },
  '3x25+16': {
    phase: { size: 25, wireCount: 7, wireDiameter: 2.14, condDiameter: 6.42, condWeight: 68.73, insulationThickness: 1.40, coreDiameter: 9.22, resistance: 1.20, ampacity: 105, netWeight: 0 },
    messenger: { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 1.71, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 5.15 },
    netWeight: 450
  },
  '3x35+16': {
    phase: { size: 35, wireCount: 7, wireDiameter: 2.52, condDiameter: 7.56, condWeight: 96.21, insulationThickness: 1.60, coreDiameter: 10.76, resistance: 0.868, ampacity: 125, netWeight: 0 },
    messenger: { size: 16, wireCount: 7, wireDiameter: 1.71, condDiameter: 5.13, condWeight: 44.30, insulationThickness: 1.20, coreDiameter: 7.53, resistance: 1.91, ampacity: 0, netWeight: 0, alWireCount: 7, alWireDiameter: 1.71, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 5.15 },
    netWeight: 520
  },
  '3x150+120': {
    phase: { size: 150, wireCount: 37, wireDiameter: 2.27, condDiameter: 15.89, condWeight: 412.6, insulationThickness: 2.00, coreDiameter: 19.89, resistance: 0.206, ampacity: 315, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.75, condDiameter: 13.75, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.35, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 19, alWireDiameter: 2.75, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 35.0 },
    netWeight: 2400
  },
  '3x185+150': {
    phase: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 2.00, coreDiameter: 21.64, resistance: 0.164, ampacity: 360, netWeight: 0 },
    messenger: { size: 150, wireCount: 37, wireDiameter: 2.27, condDiameter: 15.89, condWeight: 412.6, insulationThickness: 1.80, coreDiameter: 19.49, resistance: 0.206, ampacity: 0, netWeight: 0, alWireCount: 37, alWireDiameter: 2.27, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 42.0 },
    netWeight: 2900
  },
  '3x185+185': {
    phase: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 2.00, coreDiameter: 21.64, resistance: 0.164, ampacity: 360, netWeight: 0 },
    messenger: { size: 185, wireCount: 37, wireDiameter: 2.52, condDiameter: 17.64, condWeight: 509.1, insulationThickness: 1.80, coreDiameter: 21.24, resistance: 0.164, ampacity: 0, netWeight: 0, alWireCount: 37, alWireDiameter: 2.52, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 50.0 },
    netWeight: 3300
  },
  '3x240+120': {
    phase: { size: 240, wireCount: 61, wireDiameter: 2.24, condDiameter: 20.16, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.16, resistance: 0.125, ampacity: 425, netWeight: 0 },
    messenger: { size: 120, wireCount: 19, wireDiameter: 2.75, condDiameter: 13.75, condWeight: 330.1, insulationThickness: 1.80, coreDiameter: 17.35, resistance: 0.253, ampacity: 0, netWeight: 0, alWireCount: 19, alWireDiameter: 2.75, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 35.0 },
    netWeight: 3100
  },
  '3x240+240': {
    phase: { size: 240, wireCount: 61, wireDiameter: 2.24, condDiameter: 20.16, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.16, resistance: 0.125, ampacity: 425, netWeight: 0 },
    messenger: { size: 240, wireCount: 61, wireDiameter: 2.24, condDiameter: 20.16, condWeight: 660.2, insulationThickness: 2.00, coreDiameter: 24.16, resistance: 0.125, ampacity: 0, netWeight: 0, alWireCount: 61, alWireDiameter: 2.24, steelWireCount: 0, steelWireDiameter: 0, breakingLoad: 60.0 },
    netWeight: 3800
  }
};

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
