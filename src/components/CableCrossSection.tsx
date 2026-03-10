import React from 'react';

interface CrossSectionProps {
  cores: number;
  earthingCores?: number;
  armorType: string;
  conductorType: string;
  standard: string;
  mvScreenType?: string;
  hasMgt?: boolean;
  conductorMaterial?: string;
}

export default function CableCrossSection({ 
  cores, 
  earthingCores = 0,
  armorType, 
  conductorType, 
  standard, 
  mvScreenType = 'None', 
  hasMgt = false,
  conductorMaterial = 'Cu'
}: CrossSectionProps) {
  const size = 140;
  const center = size / 2;
  const outerRadius = 65;
  const armorRadius = 58;
  const innerRadius = 52;
  
  const isMV = standard === 'IEC 60502-2';
  const isABC = standard.includes('NFA2X');
  const isNYAF = standard.includes('(NYAF)');
  const conductorColor = conductorMaterial === 'Cu' ? '#b45309' : '#e2e8f0';
  const screenColor = '#d97706'; // Copper color for screen
  const mgtColor = '#fbbf24'; // Gold/Amber for Mica
  
  // Calculate core positions and radii based on core count
  const getCoreLayout = () => {
    let coreRadius = 0;
    let distance = 0;
    const positions: { x: number, y: number, r: number, angle: number, isEarth?: boolean }[] = [];
    
    const totalCores = cores + earthingCores;
    const displayCores = totalCores > 7 ? 7 : totalCores;

    if (isABC) {
      coreRadius = innerRadius * 0.45;
      distance = innerRadius - coreRadius;
    } else if (displayCores === 1) {
      coreRadius = innerRadius - 5;
      distance = 0;
    } else if (displayCores === 2) {
      coreRadius = innerRadius / 2 - 2;
      distance = coreRadius + 1;
    } else if (displayCores === 3) {
      coreRadius = innerRadius * 0.46;
      distance = innerRadius - coreRadius - 2;
    } else if (displayCores === 4) {
      coreRadius = innerRadius * 0.41;
      distance = innerRadius - coreRadius - 2;
    } else if (displayCores === 5) {
      coreRadius = innerRadius * 0.35;
      distance = innerRadius - coreRadius - 2;
    } else {
      // For 7 cores (1 center + 6 outer)
      coreRadius = innerRadius * 0.3;
      distance = coreRadius * 2.1;
    }

    for (let i = 0; i < displayCores; i++) {
      let angle = (i * 360) / displayCores - 90;
      let rad = (angle * Math.PI) / 180;
      let currentDistance = distance;
      let currentRadius = coreRadius;

      // For 7 cores, arrange as 1 center + 6 outer
      if (displayCores === 7) {
        if (i === 0) {
          currentDistance = 0;
        } else {
          angle = ((i - 1) * 360) / 6 - 90;
          rad = (angle * Math.PI) / 180;
          currentDistance = distance;
        }
      }

      const isEarth = i >= cores && i < displayCores;
      
      positions.push({
        x: center + currentDistance * Math.cos(rad),
        y: center + currentDistance * Math.sin(rad),
        r: isEarth && isABC ? currentRadius * 1.1 : (isEarth ? currentRadius * 0.8 : currentRadius),
        angle: angle,
        isEarth
      });
    }
    return { positions, coreRadius };
  };

  const { positions: corePositions, coreRadius } = getCoreLayout();
  
  // Outer sheath color logic
  let outerSheathColor = '#1e293b'; // Default dark
  if (isMV) outerSheathColor = '#ef4444'; // Red for MV
  if (hasMgt) outerSheathColor = '#f97316'; // Orange for Fireguard
  
  const sheathGradientStart = isMV ? '#ff6b6b' : (hasMgt ? '#fb923c' : '#334155');

  return (
    <div className="flex justify-center items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          <radialGradient id="sheathGradient" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor={sheathGradientStart} />
            <stop offset="100%" stopColor={outerSheathColor} />
          </radialGradient>
        </defs>
        
        {/* Outer Sheath - Hidden for ABC */}
        {!isABC && (
          <>
            <circle cx={center} cy={center} r={outerRadius} fill="url(#sheathGradient)" />
            <circle cx={center} cy={center} r={outerRadius - 1} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          </>
        )}
        
        {/* Armor Section */}
        {!isABC && armorType !== 'Unarmored' && (
          <g>
            {/* Armor Bedding/Base */}
            <circle cx={center} cy={center} r={armorRadius} fill="#64748b" />
            
            {/* Specific Armor Textures */}
            {armorType === 'SWA' || armorType === 'AWA' ? (
              // Wire Armor
              Array.from({ length: 30 }).map((_, i) => {
                const angle = (i * 12 * Math.PI) / 180;
                const r = armorRadius - 3;
                return (
                  <circle 
                    key={i} 
                    cx={center + r * Math.cos(angle)} 
                    cy={center + r * Math.sin(angle)} 
                    r="3" 
                    fill={armorType === 'AWA' ? '#e2e8f0' : '#94a3b8'} 
                    stroke="#475569" 
                    strokeWidth="0.5" 
                  />
                );
              })
            ) : armorType === 'STA' ? (
              // Tape Armor (Double Layer)
              <g>
                <circle cx={center} cy={center} r={armorRadius - 1} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="10 2" />
                <circle cx={center} cy={center} r={armorRadius - 3} fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="8 4" />
              </g>
            ) : (armorType === 'GSWB' || armorType === 'TCWB') ? (
              // Braid Armor
              <g>
                <circle cx={center} cy={center} r={armorRadius - 2} fill="none" stroke={armorType === 'TCWB' ? '#d97706' : '#94a3b8'} strokeWidth="4" strokeDasharray="2 1" />
                <circle cx={center} cy={center} r={armorRadius - 2} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeDasharray="1 2" />
              </g>
            ) : null}
          </g>
        )}
        
        {/* Inner Covering / Bedding */}
        {!isABC && (cores > 1 || armorType !== 'Unarmored') && (
          <g>
            <circle cx={center} cy={center} r={innerRadius} fill="#cbd5e1" />
            {/* Interstice Fillers (Visual representation of gaps being filled) */}
            {cores > 1 && conductorType !== 'sm' && (
              <g>
                <circle cx={center} cy={center} r={innerRadius - 2} fill="#94a3b8" opacity="0.3" />
                {/* Center filler element */}
                <circle cx={center} cy={center} r={coreRadius * 0.4} fill="#64748b" opacity="0.5" />
              </g>
            )}
          </g>
        )}
        
        {/* Cores */}
        {corePositions.map((pos, i) => {
          let insulationColor = pos.isEarth ? (isABC ? '#000000' : '#fbbf24') : getInsulationColor(i, cores, standard);
          
          // NYAF special color: Yellow
          if (isNYAF) {
            insulationColor = '#fbbf24';
          }

          if (conductorType === 'sm' && cores >= 3) {
            // Sector shape logic
            const startAngle = pos.angle - (180 / cores) + 8;
            const endAngle = pos.angle + (180 / cores) - 8;
            const rOuter = innerRadius - 2;
            
            return (
              <g key={i}>
                {/* Insulation Layer */}
                <path d={describeArc(center, center, rOuter, startAngle, endAngle, 15)} fill={insulationColor} />
                
                {/* Earth Stripe for Sector */}
                {pos.isEarth && (
                   <path d={describeArc(center, center, rOuter - 2, startAngle + 10, endAngle - 10, 17)} fill="#22c55e" />
                )}

                {/* MV Layers for Sector */}
                {isMV && (
                  <>
                    <path d={describeArc(center, center, rOuter - 2, startAngle + 1, endAngle - 1, rOuter - 4)} fill={screenColor} />
                    <path d={describeArc(center, center, rOuter - 4, startAngle + 2, endAngle - 2, rOuter - 6)} fill="#000" />
                  </>
                )}
                
                {/* MGT for Sector */}
                {hasMgt && (
                  <path d={describeArc(center, center, rOuter - (isMV ? 12 : 8), startAngle + 4, endAngle - 4, rOuter - (isMV ? 14 : 10))} fill={mgtColor} />
                )}
                
                {/* Conductor for Sector */}
                <path d={describeArc(center, center, rOuter - (isMV ? 14 : 10), startAngle + 5, endAngle - 5, 12)} fill={conductorColor} />
              </g>
            );
          }

          return (
            <g key={i}>
              {/* Core Insulation */}
              <circle cx={pos.x} cy={pos.y} r={pos.r} fill={insulationColor} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
              
              {/* Green Stripe for Earth Core or NYAF */}
              {(pos.isEarth || isNYAF) && (
                <g transform={`rotate(${pos.angle + 45}, ${pos.x}, ${pos.y})`}>
                  <rect x={pos.x - pos.r} y={pos.y - pos.r * 0.2} width={pos.r * 2} height={pos.r * 0.4} fill="#22c55e" />
                </g>
              )}

              {/* MV Screen & Semi-cond Layers */}
              {isMV && (
                <g>
                  <circle cx={pos.x} cy={pos.y} r={pos.r * 0.92} fill={screenColor} />
                  <circle cx={pos.x} cy={pos.y} r={pos.r * 0.88} fill="#000" />
                  <circle cx={pos.x} cy={pos.y} r={pos.r * 0.84} fill={insulationColor} />
                  <circle cx={pos.x} cy={pos.y} r={pos.r * 0.55} fill="#000" />
                </g>
              )}

              {/* MGT Layer */}
              {hasMgt && (
                <circle cx={pos.x} cy={pos.y} r={pos.r * (isMV ? 0.5 : 0.6)} fill={mgtColor} />
              )}
              
              {/* Conductor Core */}
              <circle cx={pos.x} cy={pos.y} r={pos.r * (isMV ? 0.45 : 0.5)} fill={conductorColor} />
              
              {/* Stranding Effect */}
              <circle cx={pos.x} cy={pos.y} r={pos.r * (isMV ? 0.45 : 0.5)} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeDasharray="1 1.5" />
              
              {/* Center dot for precision feel */}
              <circle cx={pos.x} cy={pos.y} r="0.5" fill="rgba(255,255,255,0.3)" />
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

function getInsulationColor(index: number, total: number, standard: string) {
  if (standard.includes('NFA2X')) return '#000000'; // All black for ABC
  if (total === 1) return '#b45309'; // Brown for single core phase
  
  // Standard IEC 60446 / HD 308 S2 colors
  const colors2 = ['#b45309', '#3b82f6']; // Brown, Blue
  const colors3 = ['#b45309', '#000000', '#64748b']; // Brown, Black, Grey
  const colors4 = ['#b45309', '#000000', '#64748b', '#3b82f6']; // Brown, Black, Grey, Blue
  const colors5 = ['#b45309', '#000000', '#64748b', '#3b82f6', '#22c55e']; // Brown, Black, Grey, Blue, Green/Yellow
  
  if (total === 2) return colors2[index % 2];
  if (total === 3) return colors3[index % 3];
  if (total === 4) return colors4[index % 4];
  if (total === 5) return colors5[index % 5];
  
  const genericColors = [
    '#b45309', '#000000', '#64748b', '#3b82f6', '#22c55e',
    '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'
  ];
  return genericColors[index % genericColors.length];
}
