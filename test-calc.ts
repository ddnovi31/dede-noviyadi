import { calculateCable } from './src/utils/cableCalculations.js';

const DEFAULT_PARAMS = {
  projectName: 'New Project',
  cores: 3,
  size: 50,
  conductorMaterial: 'Cu',
  conductorType: 'rm',
  insulationMaterial: 'XLPE',
  armorType: 'SWA',
  sheathMaterial: 'PVC',
  voltage: '0.6/1 kV',
  standard: 'IEC 60502-1',
  braidCoverage: 90,
  mvScreenType: 'None',
  mvScreenSize: 16,
  hasMgt: false,
  fireguard: false,
  stopfire: false,
  hasInnerSheath: true,
  innerSheathMaterial: 'PVC',
  flameRetardantCategory: 'None',
  overhead: 10,
  margin: 15,
  hasScreen: false,
  screenType: 'CTS',
  screenSize: 16,
  hasSeparator: false,
  separatorMaterial: 'PVC',
  earthingCores: 0,
  earthingSize: 0,
  mode: 'standard',
};

try {
  const result = calculateCable(DEFAULT_PARAMS as any);
  console.log("Success:", result !== null);
} catch (e) {
  console.error("Error:", e);
}
