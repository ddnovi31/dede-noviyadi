export interface DrumData {
  type: string;
  diameterWithCover: number; // mm (Dia. Flange)
  barrelDiameter: number; // mm (Dia. Barrel)
  innerWidth: number; // mm (Internal Width)
  outerWidth: number; // mm (External Width)
  weight: number; // kg
  price: number; // Rp
}

export const INITIAL_DRUM_DATA: DrumData[] = [
  // HASPEL BIASA (B)
  { type: "B-800", diameterWithCover: 800, barrelDiameter: 300, innerWidth: 620, outerWidth: 740, weight: 60, price: 277000 },
  { type: "B-900", diameterWithCover: 900, barrelDiameter: 300, innerWidth: 620, outerWidth: 740, weight: 65, price: 305000 },
  { type: "B-1000", diameterWithCover: 1000, barrelDiameter: 300, innerWidth: 620, outerWidth: 740, weight: 80, price: 337000 },
  { type: "B-1100 L", diameterWithCover: 1100, barrelDiameter: 300, innerWidth: 620, outerWidth: 740, weight: 105, price: 383000 },
  { type: "B-1200", diameterWithCover: 1200, barrelDiameter: 360, innerWidth: 620, outerWidth: 740, weight: 125, price: 429000 },
  { type: "B-1300", diameterWithCover: 1300, barrelDiameter: 360, innerWidth: 620, outerWidth: 740, weight: 140, price: 478000 },
  { type: "B-1320", diameterWithCover: 1320, barrelDiameter: 360, innerWidth: 620, outerWidth: 740, weight: 145, price: 478000 },
  { type: "B-1400", diameterWithCover: 1400, barrelDiameter: 500, innerWidth: 720, outerWidth: 840, weight: 175, price: 690000 },
  { type: "B-1500 S", diameterWithCover: 1500, barrelDiameter: 600, innerWidth: 620, outerWidth: 740, weight: 200, price: 698000 },
  { type: "B-1500", diameterWithCover: 1500, barrelDiameter: 600, innerWidth: 850, outerWidth: 980, weight: 210, price: 698000 },
  { type: "B-1600", diameterWithCover: 1600, barrelDiameter: 600, innerWidth: 850, outerWidth: 980, weight: 220, price: 998000 },
  { type: "B-1700", diameterWithCover: 1700, barrelDiameter: 600, innerWidth: 850, outerWidth: 1000, weight: 230, price: 1120000 },

  // HASPEL TEMBAGA (T)
  { type: "T-1000", diameterWithCover: 1000, barrelDiameter: 400, innerWidth: 620, outerWidth: 740, weight: 80, price: 337000 },
  { type: "T-1100", diameterWithCover: 1100, barrelDiameter: 400, innerWidth: 620, outerWidth: 740, weight: 108, price: 383000 },
  { type: "T-1200", diameterWithCover: 1200, barrelDiameter: 500, innerWidth: 620, outerWidth: 740, weight: 130, price: 429000 },
  { type: "T-1300", diameterWithCover: 1300, barrelDiameter: 500, innerWidth: 620, outerWidth: 740, weight: 150, price: 478000 },
  { type: "T-1400", diameterWithCover: 1400, barrelDiameter: 500, innerWidth: 700, outerWidth: 840, weight: 180, price: 690000 },
  { type: "T-1500", diameterWithCover: 1500, barrelDiameter: 600, innerWidth: 850, outerWidth: 980, weight: 210, price: 698000 },
  { type: "T-1600", diameterWithCover: 1600, barrelDiameter: 600, innerWidth: 850, outerWidth: 980, weight: 220, price: 998000 },
  { type: "T-1700", diameterWithCover: 1700, barrelDiameter: 600, innerWidth: 850, outerWidth: 1000, weight: 230, price: 1120000 },
  { type: "T-1850", diameterWithCover: 1850, barrelDiameter: 800, innerWidth: 850, outerWidth: 1050, weight: 300, price: 2146000 },
  { type: "T-2000", diameterWithCover: 2000, barrelDiameter: 1000, innerWidth: 1100, outerWidth: 1300, weight: 350, price: 2419000 },
  { type: "T-2200", diameterWithCover: 2200, barrelDiameter: 1000, innerWidth: 1100, outerWidth: 1300, weight: 450, price: 2841000 },
  { type: "T-2300", diameterWithCover: 2300, barrelDiameter: 1300, innerWidth: 1100, outerWidth: 1500, weight: 500, price: 3081000 },
  { type: "T-2400 S", diameterWithCover: 2400, barrelDiameter: 1100, innerWidth: 1300, outerWidth: 1500, weight: 600, price: 3648000 },
  { type: "T-2400 L", diameterWithCover: 2400, barrelDiameter: 1100, innerWidth: 1500, outerWidth: 1700, weight: 650, price: 3648000 },
  { type: "T-2500 S", diameterWithCover: 2500, barrelDiameter: 1300, innerWidth: 1300, outerWidth: 1500, weight: 750, price: 3990000 },
  { type: "T-2500 L", diameterWithCover: 2500, barrelDiameter: 1300, innerWidth: 1300, outerWidth: 1700, weight: 800, price: 3990000 },

  // HASPEL CUSTOM (C)
  { type: "C-500", diameterWithCover: 500, barrelDiameter: 300, innerWidth: 280, outerWidth: 400, weight: 21, price: 277000 },
  { type: "C-600", diameterWithCover: 600, barrelDiameter: 300, innerWidth: 300, outerWidth: 420, weight: 28, price: 277000 },
  { type: "C-700", diameterWithCover: 700, barrelDiameter: 300, innerWidth: 300, outerWidth: 420, weight: 42, price: 277000 },
  { type: "C-1300", diameterWithCover: 1300, barrelDiameter: 800, innerWidth: 620, outerWidth: 740, weight: 150, price: 478000 },
  { type: "C-1400", diameterWithCover: 1400, barrelDiameter: 800, innerWidth: 700, outerWidth: 840, weight: 180, price: 690000 },
  { type: "C-1500", diameterWithCover: 1500, barrelDiameter: 800, innerWidth: 850, outerWidth: 980, weight: 210, price: 698000 },
  { type: "C-1600", diameterWithCover: 1600, barrelDiameter: 800, innerWidth: 850, outerWidth: 980, weight: 220, price: 998000 },
  { type: "C-1700", diameterWithCover: 1700, barrelDiameter: 1000, innerWidth: 850, outerWidth: 1000, weight: 230, price: 1120000 },
  { type: "C-1850", diameterWithCover: 1850, barrelDiameter: 1000, innerWidth: 850, outerWidth: 1050, weight: 300, price: 2146000 },

  // HASPEL PLY (P)
  { type: "Ply P-400", diameterWithCover: 400, barrelDiameter: 160, innerWidth: 400, outerWidth: 430, weight: 5, price: 125000 },
  { type: "Ply P-500", diameterWithCover: 500, barrelDiameter: 160, innerWidth: 400, outerWidth: 430, weight: 6, price: 167000 },
  { type: "Ply P-600", diameterWithCover: 600, barrelDiameter: 220, innerWidth: 400, outerWidth: 430, weight: 8, price: 173000 },
  { type: "Ply P-750", diameterWithCover: 750, barrelDiameter: 320, innerWidth: 400, outerWidth: 430, weight: 10, price: 275000 },
];
