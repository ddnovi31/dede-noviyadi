export type Insulation = 'XLPE' | 'PVC';
export type Conductor = 'CU' | 'AL';
export type Installation = 'In Ground' | 'In Air';

export interface KHAEntry {
  size: string;
  insulation: Insulation;
  conductor: Conductor;
  installation: Installation;
  baseKHA: number;
}

export const KHA_TABLE: KHAEntry[] = [
  // XLPE, CU, In Ground
  { size: '1 x 1,5', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 54 },
  { size: '1 x 2,5', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 57 },
  { size: '1 x 4', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 62 },
  { size: '1 x 6', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 69 },
  { size: '1 x 10', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 83 },
  { size: '1 x 16', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 104 },
  { size: '1 x 25', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 135 },
  { size: '1 x 35', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 169 },
  { size: '1 x 50', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 207 },
  { size: '1 x 70', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 268 },
  { size: '1 x 95', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 328 },
  { size: '1 x 120', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 383 },
  { size: '1 x 150', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 444 },
  { size: '1 x 185', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 510 },
  { size: '1 x 240', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 607 },
  { size: '1 x 300', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 703 },
  { size: '1 x 400', insulation: 'XLPE', conductor: 'CU', installation: 'In Ground', baseKHA: 823 },
  // ... (I will add more as needed, this is a representative sample)
];

export const CORRECTION_FACTORS: Record<number, { ground: number; air: number }> = {
  5: { ground: 0.7, air: 0.75 },
  6: { ground: 0.7, air: 0.75 },
  7: { ground: 0.6, air: 0.65 },
  8: { ground: 0.6, air: 0.65 },
  9: { ground: 0.6, air: 0.65 },
  10: { ground: 0.5, air: 0.55 },
  // ... (I will add more as needed)
};

export function getAdjustedKHA(
  baseKHA: number,
  numCores: number,
  installation: Installation
): number {
  if (numCores <= 4) return baseKHA;
  const factor = CORRECTION_FACTORS[numCores];
  if (!factor) return baseKHA; // Default if factor not found
  return baseKHA * (installation === 'In Ground' ? factor.ground : factor.air);
}
