
export const CONDUCTOR_RESISTIVITY = {
  Cu: 17.241,
  Al: 28.264,
  TCu: 17.86
};

export const RESISTANCE_CU: Record<number, number> = {
  0.5: 36, 0.75: 24.5, 1: 18.1, 1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15, 25: 0.727, 35: 0.524, 50: 0.387, 
  70: 0.268, 95: 0.193, 120: 0.153, 150: 0.124, 185: 0.0991, 240: 0.0754, 300: 0.0601, 
  400: 0.047, 500: 0.0366, 630: 0.0283, 800: 0.0221, 1000: 0.0176
};

export const RESISTANCE_TCU: Record<number, number> = {
  0.5: 36.70, 0.75: 24.80, 1: 18.20, 1.5: 12.20, 2.5: 7.56, 4: 4.70, 6: 3.11, 10: 1.84, 16: 1.16, 25: 0.73, 35: 0.53, 50: 0.39, 
  70: 0.27, 95: 0.20, 120: 0.15, 150: 0.13, 185: 0.10, 240: 0.08, 300: 0.06, 
  400: 0.05, 500: 0.04, 630: 0.03
};

export const RESISTANCE_CU_CLASS5: Record<number, number> = {
  0.5: 39, 0.75: 26, 1: 19.5, 1.5: 13.3, 2.5: 7.98, 4: 4.95, 6: 3.3, 10: 1.91, 16: 1.21, 25: 0.78, 35: 0.554, 50: 0.386, 
  70: 0.272, 95: 0.206, 120: 0.161, 150: 0.129, 185: 0.106, 240: 0.0801, 300: 0.0641, 
  400: 0.0486, 500: 0.0384, 630: 0.0287
};

export const RESISTANCE_AL: Record<number, number> = {
  4: 7.41, 6: 4.61, 10: 3.08, 16: 1.91, 25: 1.2, 35: 0.868, 50: 0.641, 70: 0.443, 95: 0.32, 120: 0.253, 150: 0.206, 185: 0.164, 
  240: 0.125, 300: 0.1, 400: 0.0778, 500: 0.0605, 630: 0.0469
};

export const RESISTANCE_TCU_CLASS5: Record<number, number> = {
  0.5: 40.1, 0.75: 26.7, 1: 20.0, 1.5: 13.7, 2.5: 8.21, 4: 5.09, 6: 3.39, 10: 1.95, 16: 1.24, 
  25: 0.795, 35: 0.565, 50: 0.393, 70: 0.277, 95: 0.210, 120: 0.164, 150: 0.132, 
  185: 0.108, 240: 0.0817, 300: 0.0654, 400: 0.0495, 500: 0.0391, 630: 0.0292
};

export const CONDUCTOR_CONSTRUCTION: Record<string, Record<number, { wireCount: number, wireDiameter: number }>> = {
  re: {
    0.5: { wireCount: 1, wireDiameter: 0.78 },
    0.75: { wireCount: 1, wireDiameter: 0.95 },
    1: { wireCount: 1, wireDiameter: 1.13 },
    1.5: { wireCount: 1, wireDiameter: 1.35 },
    2.5: { wireCount: 1, wireDiameter: 1.72 },
    4: { wireCount: 1, wireDiameter: 2.19 },
    6: { wireCount: 1, wireDiameter: 2.67 },
    10: { wireCount: 1, wireDiameter: 3.47 },
    16: { wireCount: 1, wireDiameter: 4.38 },
    25: { wireCount: 1, wireDiameter: 5.50 },
  },
  rm: {
    0.5: { wireCount: 7, wireDiameter: 0.30 },
    0.75: { wireCount: 7, wireDiameter: 0.37 },
    1: { wireCount: 7, wireDiameter: 0.43 },
    1.5: { wireCount: 7, wireDiameter: 0.52 },
    2.5: { wireCount: 7, wireDiameter: 0.67 },
    4: { wireCount: 7, wireDiameter: 0.85 },
    6: { wireCount: 7, wireDiameter: 1.04 },
    10: { wireCount: 7, wireDiameter: 1.35 },
    16: { wireCount: 7, wireDiameter: 1.70 },
    25: { wireCount: 7, wireDiameter: 2.14 },
    35: { wireCount: 7, wireDiameter: 2.52 },
    50: { wireCount: 19, wireDiameter: 1.78 },
    70: { wireCount: 19, wireDiameter: 2.14 },
    95: { wireCount: 19, wireDiameter: 2.52 },
    120: { wireCount: 37, wireDiameter: 2.03 },
    150: { wireCount: 37, wireDiameter: 2.27 },
    185: { wireCount: 37, wireDiameter: 2.52 },
    240: { wireCount: 61, wireDiameter: 2.24 },
    300: { wireCount: 61, wireDiameter: 2.52 },
    400: { wireCount: 61, wireDiameter: 2.85 },
    500: { wireCount: 61, wireDiameter: 3.20 },
    630: { wireCount: 127, wireDiameter: 2.52 },
    800: { wireCount: 127, wireDiameter: 2.85 },
    1000: { wireCount: 127, wireDiameter: 3.20 },
  },
  sm: {
    25: { wireCount: 7, wireDiameter: 2.19 },
    35: { wireCount: 7, wireDiameter: 2.59 },
    50: { wireCount: 19, wireDiameter: 1.83 },
    70: { wireCount: 19, wireDiameter: 2.19 },
    95: { wireCount: 19, wireDiameter: 2.59 },
    120: { wireCount: 37, wireDiameter: 2.08 },
    150: { wireCount: 37, wireDiameter: 2.31 },
    185: { wireCount: 37, wireDiameter: 2.59 },
    240: { wireCount: 37, wireDiameter: 2.96 },
    300: { wireCount: 37, wireDiameter: 3.32 },
    400: { wireCount: 61, wireDiameter: 2.92 },
    500: { wireCount: 61, wireDiameter: 3.31 },
    630: { wireCount: 61, wireDiameter: 3.77 },
    800: { wireCount: 61, wireDiameter: 4.26 },
    1000: { wireCount: 61, wireDiameter: 4.78 },
  },
  cm: {
    16: { wireCount: 7, wireDiameter: 1.75 },
    25: { wireCount: 7, wireDiameter: 2.19 },
    35: { wireCount: 7, wireDiameter: 2.59 },
    50: { wireCount: 19, wireDiameter: 1.83 },
    70: { wireCount: 19, wireDiameter: 2.19 },
    95: { wireCount: 19, wireDiameter: 2.59 },
    120: { wireCount: 35, wireDiameter: 2.14 },
    150: { wireCount: 35, wireDiameter: 2.38 },
    185: { wireCount: 35, wireDiameter: 2.66 },
    240: { wireCount: 35, wireDiameter: 3.05 },
    300: { wireCount: 35, wireDiameter: 3.41 },
    400: { wireCount: 56, wireDiameter: 3.05 },
    500: { wireCount: 56, wireDiameter: 3.46 },
    630: { wireCount: 56, wireDiameter: 3.93 },
    800: { wireCount: 56, wireDiameter: 4.45 },
    1000: { wireCount: 56, wireDiameter: 4.99 },
  },
  f: {
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
    400: { wireCount: 2013, wireDiameter: 0.50 },
    500: { wireCount: 2135, wireDiameter: 0.54 },
    630: { wireCount: 2135, wireDiameter: 0.61 },
  }
};

export const CURRENT_CAPACITY_AIR_CU: Record<number, number> = {
  1.5: 24, 2.5: 32, 4: 42, 6: 54, 10: 75, 16: 100, 25: 135, 35: 165, 50: 200, 
  70: 255, 95: 315, 120: 365, 150: 420, 185: 485, 240: 575, 300: 665, 
  400: 780, 500: 900, 630: 1050
};

export const CURRENT_CAPACITY_AIR_CU_MV: Record<number, number> = {
  16: 125, 25: 163, 35: 198, 50: 238, 70: 296, 95: 361, 120: 417, 150: 473, 
  185: 543, 240: 641, 300: 735, 400: 845
};

export const CURRENT_CAPACITY_GROUND_CU: Record<number, number> = {
  1.5: 26, 2.5: 34, 4: 44, 6: 56, 10: 78, 16: 105, 25: 140, 35: 170, 50: 205, 
  70: 260, 95: 320, 120: 370, 150: 425, 185: 490, 240: 580, 300: 670, 
  400: 785, 500: 905, 630: 1055
};

export const CURRENT_CAPACITY_GROUND_CU_MV: Record<number, number> = {
  16: 109, 25: 140, 35: 166, 50: 196, 70: 239, 95: 285, 120: 323, 150: 361, 
  185: 406, 240: 469, 300: 526, 400: 590
};

export const CURRENT_CAPACITY_AIR_AL: Record<number, number> = {
  1.5: 18, 2.5: 24, 4: 32, 6: 41, 10: 57, 16: 76, 25: 103, 35: 125, 50: 152, 
  70: 194, 95: 240, 120: 278, 150: 320, 185: 370, 240: 438, 300: 506, 
  400: 594, 500: 685, 630: 800
};

export const CURRENT_CAPACITY_AIR_AL_MV: Record<number, number> = {
  16: 97, 25: 127, 35: 154, 50: 184, 70: 230, 95: 280, 120: 324, 150: 368, 
  185: 424, 240: 502, 300: 577, 400: 673
};

export const CURRENT_CAPACITY_GROUND_AL: Record<number, number> = {
  1.5: 20, 2.5: 26, 4: 34, 6: 43, 10: 59, 16: 80, 25: 107, 35: 130, 50: 156, 
  70: 198, 95: 244, 120: 282, 150: 324, 185: 374, 240: 442, 300: 510, 
  400: 598, 500: 689, 630: 804
};

export const CURRENT_CAPACITY_GROUND_AL_MV: Record<number, number> = {
  16: 84, 25: 108, 35: 129, 50: 152, 70: 186, 95: 221, 120: 252, 150: 281, 
  185: 317, 240: 367, 300: 414, 400: 470
};

export const INSTRUMENT_FACTORS: Record<number, number> = {
  1: 1.0, 2: 2.0, 3: 2.15, 4: 2.41, 5: 2.7, 6: 3.0, 7: 3.0, 
  8: 3.45, 10: 3.8, 12: 4.15, 16: 4.7, 20: 5.33, 24: 5.77, 30: 6.41, 36: 7.0
};
