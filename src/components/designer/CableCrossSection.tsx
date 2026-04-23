import React from 'react';
import { CableDesignParams, CalculationResult } from '../../utils/cableCalculations';

interface CableCrossSectionProps {
  params: CableDesignParams;
  result: CalculationResult;
}

export function CableCrossSection({ params, result }: CableCrossSectionProps) {
  const cores = params.cores;
  const overallDiameter = result.spec.overallDiameter || 10;
  
  // Scaling
  const viewBoxSize = 400;
  const center = viewBoxSize / 2;
  const scale = (viewBoxSize * 0.8) / overallDiameter;
  
  // Colors
  const conductorColor = params.conductorMaterial === 'Aluminium' ? '#cbd5e1' : '#ea580c';
  const insulationColor = '#fef3c7'; // Light yellow for XLPE/PVC usually
  const screenColor = '#334155'; // Dark slate
  const sheathColor = '#1e293b'; // Very dark slate
  const armorColor = '#94a3b8'; // Slate 400
  
  const drawCore = (cx: number, cy: number, radius: number) => {
    const { phaseCore } = result.spec;
    const condRadius = (phaseCore.conductorDiameter / 2) * scale;
    const insulRadius = (phaseCore.coreDiameter / 2) * scale;
    const condScreenRadius = result.spec.conductorScreenThickness ? (phaseCore.conductorDiameter / 2 + result.spec.conductorScreenThickness) * scale : condRadius;
    const insulScreenRadius = result.spec.insulationScreenThickness ? (phaseCore.coreDiameter / 2 + result.spec.insulationScreenThickness) * scale : insulRadius;

    return (
      <g key={`core-${cx}-${cy}`}>
        {/* Insulation Screen */}
        {result.spec.insulationScreenThickness > 0 && (
          <circle cx={cx} cy={cy} r={insulScreenRadius} fill={screenColor} />
        )}
        {/* Insulation */}
        <circle cx={cx} cy={cy} r={insulRadius} fill={insulationColor} stroke="#d1d5db" strokeWidth="0.5" />
        {/* Conductor Screen */}
        {result.spec.conductorScreenThickness > 0 && (
          <circle cx={cx} cy={cy} r={condScreenRadius} fill={screenColor} />
        )}
        {/* Conductor */}
        <circle cx={cx} cy={cy} r={condRadius} fill={conductorColor} stroke="#9a3412" strokeWidth="0.5" />
      </g>
    );
  };

  const renderCores = () => {
    const { laidUpDiameter, phaseCore } = result.spec;
    if (cores === 1) {
      return drawCore(center, center, 0);
    }

    const coreDia = phaseCore.coreDiameter;
    // Simple geometric arrangement
    const distanceToCenter = (laidUpDiameter - coreDia) / 2 * scale;
    
    return Array.from({ length: cores }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / cores - Math.PI / 2;
      const cx = center + distanceToCenter * Math.cos(angle);
      const cy = center + distanceToCenter * Math.sin(angle);
      return drawCore(cx, cy, 0);
    });
  };

  const renderLabels = () => {
    const labels = [
      { id: 'conductor', label: 'Conductor', material: params.conductorMaterial, value: `Size = ${params.size} mm², D=${result.spec.phaseCore.conductorDiameter} mm`, r: result.spec.phaseCore.conductorDiameter / 2 },
      { id: 'conductor_shield', label: 'Conductor shield', value: `Th=${result.spec.conductorScreenThickness}, D=${result.spec.phaseCore.conductorDiameter + result.spec.conductorScreenThickness * 2} mm`, r: result.spec.phaseCore.conductorDiameter / 2 + result.spec.conductorScreenThickness, active: result.spec.conductorScreenThickness > 0 },
      { id: 'insulation', label: 'Insulation', material: params.insulationMaterial, value: `Th=${result.spec.phaseCore.insulationThickness}, D=${result.spec.phaseCore.coreDiameter} mm`, r: result.spec.phaseCore.coreDiameter / 2 },
      { id: 'insulation_screen', label: 'Insulation screen', value: `Th=${result.spec.insulationScreenThickness}, D=${result.spec.phaseCore.coreDiameter + result.spec.insulationScreenThickness * 2} mm`, r: result.spec.phaseCore.coreDiameter / 2 + result.spec.insulationScreenThickness, active: result.spec.insulationScreenThickness > 0 },
      { id: 'neutral', label: 'Concentric neutral', material: 'Copper', value: `D=${result.spec.mvScreenDiameter || 0} mm`, r: (result.spec.mvScreenDiameter || 0) / 2, active: params.hasScreen },
      { id: 'jacket', label: 'Jacket/Serving', material: params.sheathMaterial, value: `Th=${result.spec.sheathThickness.toFixed(2)}, D=${result.spec.overallDiameter.toFixed(1)} mm`, r: result.spec.overallDiameter / 2 },
    ].filter(l => l.active !== false && l.r > 0);

    return (
      <g>
        {labels.map((item, idx) => {
          const r = item.r * scale;
          const yOffset = -120 + idx * 45;
          const xStart = center + r * Math.cos(-Math.PI/6);
          const yStart = center + r * Math.sin(-Math.PI/6);
          const xEnd = center + 140;
          const yEnd = center + yOffset;

          return (
            <g key={item.id}>
              <line 
                x1={xStart} y1={yStart} 
                x2={xEnd} y2={yEnd} 
                stroke="#64748b" strokeWidth="0.5" 
              />
              <circle cx={xStart} cy={yStart} r="1.5" fill="#64748b" />
              
              <text x={xEnd + 5} y={yEnd} className="text-[10px] font-black fill-slate-800">
                <tspan x={xEnd + 5} dy="0" className="fill-indigo-600 underline">{item.label}</tspan>
                <tspan x={xEnd + 5} dy="12" className="font-normal fill-slate-500">
                  {item.material ? `, ${item.material}` : ''}
                </tspan>
                <tspan x={xEnd + 5} dy="12" className="font-bold fill-slate-700">
                  {item.value}
                </tspan>
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <svg 
        viewBox={`0 0 ${viewBoxSize + 200} ${viewBoxSize}`} 
        className="max-w-full max-h-full drop-shadow-sm bg-white"
      >
        <g transform="translate(-80, 0)">
          {/* Outer Sheath */}
          <circle 
            cx={center} 
            cy={center} 
            r={(result.spec.overallDiameter / 2) * scale} 
            fill={sheathColor} 
          />
          
          {/* Armor */}
          {params.armorType !== 'Unarmored' && (
            <circle 
              cx={center} 
              cy={center} 
              r={(result.spec.diameterOverArmor / 2) * scale} 
              fill={armorColor} 
              stroke="#475569"
              strokeWidth="1"
            />
          )}
          
          {/* Diameter Under Armor / Inner Covering */}
          {(result.spec.diameterUnderArmor > 0 || result.spec.innerCoveringThickness > 0) && (
            <circle 
              cx={center} 
              cy={center} 
              r={(result.spec.diameterUnderArmor / 2) * scale} 
              fill="#475569" 
            />
          )}

          {/* Cores Container / Fillers */}
          <circle 
            cx={center} 
            cy={center} 
            r={(result.spec.laidUpDiameter / 2) * scale} 
            fill="#000" 
          />

          {renderCores()}
          {renderLabels()}
        </g>
      </svg>
      
      {/* Absolute labels could go here or be part of SVG with lines */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">External diameter, De=</span>
         <span className="text-xs font-black text-slate-900 ml-1">{result.spec.overallDiameter} mm</span>
      </div>
    </div>
  );
}
