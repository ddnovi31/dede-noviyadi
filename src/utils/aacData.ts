
export interface AACData {
  size: string;
  wireCount: number;
  wireDiameter: number;
  overallDiameter: number;
  resistance?: number;
  breakingLoad?: number;
  ampacity?: number;
  weight?: number;
}

export interface AAACSData {
  size: string;
  wireCount: number;
  wireDiameter: number;
  sheathThickness: number;
  kha30: number;
  kha40: number;
}

export const AAC_DATA: Record<string, AACData> = {
  '16': { size: '16', wireCount: 7, wireDiameter: 1.75, overallDiameter: 5.25 },
  '25': { size: '25', wireCount: 7, wireDiameter: 2.25, overallDiameter: 6.75 },
  '35': { size: '35', wireCount: 7, wireDiameter: 2.5, overallDiameter: 7.5, resistance: 0.8332, breakingLoad: 590, ampacity: 180, weight: 94 },
  '50 A': { size: '50 A', wireCount: 7, wireDiameter: 3.0, overallDiameter: 9 },
  '50 B': { size: '50 B', wireCount: 19, wireDiameter: 1.75, overallDiameter: 8.75 },
  '55': { size: '55', wireCount: 7, wireDiameter: 3.25, overallDiameter: 9.75 },
  '70': { size: '70', wireCount: 19, wireDiameter: 2.25, overallDiameter: 11.25, resistance: 0.3808, breakingLoad: 1040, ampacity: 270, weight: 208 },
  '95': { size: '95', wireCount: 19, wireDiameter: 2.5, overallDiameter: 12.5, resistance: 0.3084, breakingLoad: 1560, ampacity: 340, weight: 257 },
  '100': { size: '100', wireCount: 7, wireDiameter: 4.25, overallDiameter: 12.75 },
  '120': { size: '120', wireCount: 19, wireDiameter: 2.75, overallDiameter: 13.75 },
  '150 A': { size: '150 A', wireCount: 19, wireDiameter: 3.25, overallDiameter: 16.25 },
  '150 B': { size: '150 B', wireCount: 37, wireDiameter: 2.25, overallDiameter: 15.75 },
  '185': { size: '185', wireCount: 37, wireDiameter: 2.5, overallDiameter: 17.5 },
  '200': { size: '200', wireCount: 19, wireDiameter: 3.75, overallDiameter: 18.75 },
  '240 A': { size: '240 A', wireCount: 61, wireDiameter: 2.25, overallDiameter: 20.25 },
  '240 B': { size: '240 B', wireCount: 19, wireDiameter: 4.0, overallDiameter: 20 },
  '300': { size: '300', wireCount: 61, wireDiameter: 2.5, overallDiameter: 22.5 },
  '400': { size: '400', wireCount: 61, wireDiameter: 3.0, overallDiameter: 27 },
  '500': { size: '500', wireCount: 61, wireDiameter: 3.25, overallDiameter: 29.25 },
  '630': { size: '630', wireCount: 91, wireDiameter: 3.0, overallDiameter: 33 },
  '800': { size: '800', wireCount: 91, wireDiameter: 3.25, overallDiameter: 35.75 },
  '1000': { size: '1000', wireCount: 91, wireDiameter: 3.75, overallDiameter: 41.25 },
};

export const AAACS_DATA: Record<string, AAACSData> = {
  '35': { size: '35', wireCount: 7, wireDiameter: 2.5, sheathThickness: 3.0, kha30: 167, kha40: 150 },
  '50': { size: '50', wireCount: 19, wireDiameter: 1.75, sheathThickness: 3.0, kha30: 200, kha40: 180 },
  '70': { size: '70', wireCount: 19, wireDiameter: 2.25, sheathThickness: 3.0, kha30: 275, kha40: 246 },
  '95': { size: '95', wireCount: 19, wireDiameter: 2.5, sheathThickness: 3.0, kha30: 315, kha40: 282 },
  '120': { size: '120', wireCount: 19, wireDiameter: 2.75, sheathThickness: 3.0, kha30: 356, kha40: 319 },
  '150 A': { size: '150 A', wireCount: 19, wireDiameter: 3.25, sheathThickness: 3.0, kha30: 423, kha40: 378 },
  '150 B': { size: '150 B', wireCount: 37, wireDiameter: 2.25, sheathThickness: 3.0, kha30: 423, kha40: 378 },
  '185': { size: '185', wireCount: 37, wireDiameter: 2.5, sheathThickness: 3.0, kha30: 484, kha40: 423 },
  '240': { size: '240', wireCount: 61, wireDiameter: 2.25, sheathThickness: 3.0, kha30: 586, kha40: 523 },
};

export const AAC_SIZES = [
  '16', '25', '35', '50 A', '50 B', '55', '70', '95', '100', '120', 
  '150 A', '150 B', '185', '200', '240 A', '240 B', '300', '400', 
  '500', '630', '800', '1000'
];

export const AAACS_SIZES = [
  '35', '50', '70', '95', '120', '150 A', '150 B', '185', '240'
];
