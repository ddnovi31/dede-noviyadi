import React, { useState } from 'react';
import { calculateOverallDiameter } from '../utils/cableCalculations';

export default function DiameterCalculator() {
  const [phaseSize, setPhaseSize] = useState(50);
  const [earthSize, setEarthSize] = useState(16);
  const [configType, setConfigType] = useState<'3+1' | '3+2' | '3+3'>('3+1');
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const diameter = calculateOverallDiameter(phaseSize, earthSize, configType);
    setResult(diameter);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold mb-4">Diameter Calculator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Phase Conductor Size (mm2)</label>
          <input type="number" value={phaseSize} onChange={(e) => setPhaseSize(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Earth Conductor Size (mm2)</label>
          <input type="number" value={earthSize} onChange={(e) => setEarthSize(Number(e.target.value))} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Configuration</label>
          <select value={configType} onChange={(e) => setConfigType(e.target.value as any)} className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2">
            <option value="3+1">3+1 (B-B-B-S)</option>
            <option value="3+2">3+2 (B-B-S-B-S)</option>
            <option value="3+3">3+3 (B-S-B-S-B-S)</option>
          </select>
        </div>
      </div>
      <button onClick={handleCalculate} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Calculate</button>
      {result !== null && (
        <div className="mt-4 p-4 bg-slate-100 rounded-md">
          <p className="text-lg font-medium">Estimated Overall Diameter: {result.toFixed(2)} mm</p>
        </div>
      )}
    </div>
  );
}
