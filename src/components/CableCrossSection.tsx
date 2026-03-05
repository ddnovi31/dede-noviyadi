import React from 'react';

interface CrossSectionProps {
  cores: number;
  armorType: string;
  conductorType: string;
  standard: string;
  mvScreenType?: string;
  hasMgt?: boolean;
  conductorMaterial?: string;
}

export default function CableCrossSection({ 
  cores, 
  armorType, 
  conductorType, 
  standard, 
  mvScreenType = 'None', 
  hasMgt = false,
  conductorMaterial = 'Cu'
}: CrossSectionProps) {
  const size = 120;
  const center = size / 2;
  const outerRadius = 55;
  const armorRadius = 48;
  const innerRadius = 42;
  
  const isMV = standard === 'IEC 60502-2';
  const conductorColor = conductorMaterial === 'Cu' ? '#b45309' : '#e2e8f0';
  const screenColor = '#d97706'; // Copper color for screen
  const mgtColor = '#fbbf24'; // Gold/Amber for Mica
  
  // Calculate core positions
  const getCorePositions = () => {
    const coreRadius = cores === 1 ? 30 : cores === 2 ? 18 : cores === 3 ? 16 : cores === 4 ? 14 : 12;
    const distance = cores === 1 ? 0 : innerRadius - coreRadius - 3;
    
    const positions = [];
    for (let i = 0; i < cores; i++) {
      const angle = (i * 360) / cores - 90; // Start at top
      const rad = (angle * Math.PI) / 180;
      positions.push({
        x: center + distance * Math.cos(rad),
        y: center + distance * Math.sin(rad),
        r: coreRadius,
      });
    }
    return positions;
  };

  const corePositions = getCorePositions();
  const outerSheathColor = isMV ? '#ef4444' : '#1e293b'; // Red for MV, Dark for others

  return (
    <div className="flex justify-center items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-xl">
        {/* Outer Sheath */}
        <circle cx={center} cy={center} r={outerRadius} fill={outerSheathColor} />
        
        {/* Armor */}
        {armorType !== 'Unarmored' && (
          <g>
            <circle cx={center} cy={center} r={armorRadius} fill="#94a3b8" />
            {/* Armor texture */}
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={i}
                x1={center + (armorRadius - 4) * Math.cos((i * 15 * Math.PI) / 180)}
                y1={center + (armorRadius - 4) * Math.sin((i * 15 * Math.PI) / 180)}
                x2={center + armorRadius * Math.cos((i * 15 * Math.PI) / 180)}
                y2={center + armorRadius * Math.sin((i * 15 * Math.PI) / 180)}
                stroke="#475569"
                strokeWidth="1"
              />
            ))}
          </g>
        )}
        
        {/* Inner Covering */}
        {(cores > 1 || armorType !== 'Unarmored') && (
          <circle cx={center} cy={center} r={innerRadius} fill="#cbd5e1" />
        )}
        
        {/* Cores */}
        {corePositions.map((pos, i) => {
          const insulationColor = getInsulationColor(i, cores);
          const angle = (i * 360) / cores - 90;
          
          if (conductorType === 'sm' && cores >= 3) {
            // Draw sector shape for sm
            const startAngle = angle - (180 / cores) + 5;
            const endAngle = angle + (180 / cores) - 5;
            
            // Layers from outside in:
            // 1. Insulation
            const dIns = describeArc(center, center, innerRadius - 2, startAngle, endAngle, 8);
            // 2. Metallic Screen (MV)
            const dScreen = isMV && mvScreenType !== 'None' ? describeArc(center, center, innerRadius - 3, startAngle + 1, endAngle - 1, innerRadius - 5) : null;
            // 3. Insulation Screen (MV)
            const dInsScreen = isMV ? describeArc(center, center, innerRadius - 5, startAngle + 2, endAngle - 2, innerRadius - 7) : null;
            // 4. Conductor Screen (MV)
            const dCondScreen = isMV ? describeArc(center, center, innerRadius - 13, startAngle + 4, endAngle - 4, innerRadius - 15) : null;
            // 5. MGT
            const dMgt = hasMgt ? describeArc(center, center, innerRadius - 15, startAngle + 5, endAngle - 5, innerRadius - 17) : null;
            // 6. Conductor
            const dCond = describeArc(center, center, innerRadius - 17, startAngle + 6, endAngle - 6, 10);
            
            return (
              <g key={i}>
                <path d={dIns} fill={insulationColor} />
                {dScreen && <path d={dScreen} fill={screenColor} />}
                {dInsScreen && <path d={dInsScreen} fill="#000" />}
                {dCondScreen && <path d={dCondScreen} fill="#000" />}
                {dMgt && <path d={dMgt} fill={mgtColor} />}
                <path d={dCond} fill={conductorColor} />
              </g>
            );
          }

          return (
            <g key={i}>
              {/* Insulation */}
              <circle cx={pos.x} cy={pos.y} r={pos.r} fill={insulationColor} />
              
              {/* Metallic Screen (MV) */}
              {isMV && mvScreenType !== 'None' && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * 0.9} fill={screenColor} />
              )}

              {/* Insulation Screen (MV) */}
              {isMV && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * 0.85} fill="#000" />
              )}
              
              {/* Main Insulation area (inner part) */}
              <circle cx={pos.x} cy={pos.y} r={pos.r * 0.8} fill={insulationColor} />

              {/* Conductor Screen (MV) */}
              {isMV && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * 0.55} fill="#000" />
              )}

              {/* MGT */}
              {hasMgt && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * 0.5} fill={mgtColor} />
              )}
              
              {/* Conductor */}
              <circle cx={pos.x} cy={pos.y} r={pos.r * 0.45} fill={conductorColor} />
              
              {/* Compacted Stranded texture for cm */}
              {conductorType === 'cm' && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * 0.45} fill="none" stroke={conductorMaterial === 'Cu' ? '#78350f' : '#94a3b8'} strokeWidth="0.5" strokeDasharray="1 1" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, innerRadius: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", innerStart.x, innerStart.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
    "Z"
  ].join(" ");

  return d;
}

function getInsulationColor(index: number, total: number) {
  if (total === 1) return '#ef4444'; // Red for single core
  
  const colors = [
    '#ef4444', // Brown/Red
    '#000000', // Black
    '#64748b', // Grey
    '#3b82f6', // Blue
    '#22c55e', // Green/Yellow
  ];
  return colors[index % colors.length];
}
