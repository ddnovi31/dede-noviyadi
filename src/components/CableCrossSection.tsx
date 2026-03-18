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
  formationType?: 'Core' | 'Pair' | 'Triad';
  hasScreen?: boolean;
  screenType?: string;
}

export default function CableCrossSection({ 
  cores, 
  earthingCores = 0,
  armorType, 
  conductorType, 
  standard, 
  mvScreenType = 'None', 
  hasMgt = false,
  conductorMaterial = 'Cu',
  formationType = 'Core',
  hasScreen = false,
  screenType = 'None'
}: CrossSectionProps) {
  const size = 140;
  const center = size / 2;
  const outerRadius = 65;
  const armorRadius = 58;
  const innerRadius = 52;
  const screenRadius = 55;
  
  const isMV = standard === 'IEC 60502-2';
  const isABC = standard.includes('NFA2X');
  const isNYAF = standard.includes('(NYAF)');
  const isInstrumentation = standard === 'BS EN 50288-7';
  const hasOverallScreen = hasScreen || (mvScreenType !== 'None' && cores > 1);
  
  const conductorColor = conductorMaterial === 'Cu' ? '#b45309' : '#e2e8f0';
  const screenColor = '#d97706'; // Copper color for screen
  const mgtColor = '#fbbf24'; // Gold/Amber for Mica
  
  // Calculate core positions and radii based on core count and formation
  const getCoreLayout = () => {
    let coreRadius = 0;
    let distance = 0;
    const positions: { x: number, y: number, r: number, angle: number, isEarth?: boolean, pairId?: number }[] = [];
    
    const totalCores = cores + earthingCores;
    const displayCores = totalCores > 12 ? 12 : totalCores;

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
    } else if (displayCores <= 6) {
      coreRadius = innerRadius * 0.35;
      distance = innerRadius - coreRadius - 2;
    } else {
      coreRadius = innerRadius * 0.22;
      distance = innerRadius - coreRadius - 4;
    }

    if (isInstrumentation && (formationType === 'Pair' || formationType === 'Triad')) {
      const perFormation = formationType === 'Pair' ? 2 : 3;
      const formationCount = Math.ceil(cores / perFormation);
      const displayFormations = formationCount > 6 ? 6 : formationCount;
      
      const formationRadius = innerRadius * (displayFormations === 1 ? 0.6 : 0.35);
      const formationDistance = displayFormations === 1 ? 0 : innerRadius * 0.55;
      const subCoreRadius = formationRadius * (formationType === 'Pair' ? 0.45 : 0.4);

      for (let f = 0; f < displayFormations; f++) {
        const fAngle = (f * 360) / displayFormations - 90;
        const fRad = (fAngle * Math.PI) / 180;
        const fx = center + formationDistance * Math.cos(fRad);
        const fy = center + formationDistance * Math.sin(fRad);

        for (let c = 0; c < perFormation; c++) {
          const cAngle = (c * 360) / perFormation - 90 + (fAngle);
          const cRad = (cAngle * Math.PI) / 180;
          const dist = subCoreRadius * 1.1;
          
          positions.push({
            x: fx + dist * Math.cos(cRad),
            y: fy + dist * Math.sin(cRad),
            r: subCoreRadius,
            angle: cAngle,
            pairId: f
          });
        }
      }
    } else {
      for (let i = 0; i < displayCores; i++) {
        let angle = (i * 360) / displayCores - 90;
        let rad = (angle * Math.PI) / 180;
        let currentDistance = distance;
        let currentRadius = coreRadius;

        if (displayCores > 6) {
          if (i === 0) {
            currentDistance = 0;
          } else {
            angle = ((i - 1) * 360) / (displayCores - 1) - 90;
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
    }
    return { positions, coreRadius };
  };

  const { positions: corePositions, coreRadius } = getCoreLayout();
  
  // Outer sheath color logic
  let outerSheathColor = '#1e293b'; // Default dark
  if (isMV) outerSheathColor = '#ef4444'; // Red for MV
  if (hasMgt) outerSheathColor = '#f97316'; // Orange for Fireguard
  if (standard.includes('(NYM)')) outerSheathColor = '#f8fafc'; // White for NYM
  
  const sheathGradientStart = isMV ? '#ff6b6b' : (hasMgt ? '#fb923c' : (standard.includes('(NYM)') ? '#ffffff' : '#334155'));

  return (
    <div className="flex justify-center items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl">
        <defs>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="1" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="sheathGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={sheathGradientStart} />
            <stop offset="60%" stopColor={outerSheathColor} />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>

          <radialGradient id="conductorGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={conductorMaterial === 'Cu' ? '#fbbf24' : '#f8fafc'} />
            <stop offset="70%" stopColor={conductorColor} />
            <stop offset="100%" stopColor={conductorMaterial === 'Cu' ? '#451a03' : '#334155'} />
          </radialGradient>

          <linearGradient id="armorWireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <pattern id="strandPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="rgba(0,0,0,0.15)" />
            <circle cx="2" cy="2" r="0.5" fill="rgba(255,255,255,0.1)" />
          </pattern>

          <filter id="innerShadow">
            <feOffset dx="0.5" dy="0.5" />
            <feGaussianBlur stdDeviation="0.5" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.5" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>

          <filter id="gloss">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lightingColor="#white" result="specOut">
              <fePointLight x="-50" y="-50" z="100" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
        </defs>
        
        {/* Outer Sheath - Hidden for ABC */}
        {!isABC && (
          <g filter="url(#dropShadow)">
            <circle cx={center} cy={center} r={outerRadius} fill="url(#sheathGradient)" />
            <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
            <circle cx={center} cy={center} r={outerRadius} filter="url(#gloss)" opacity="0.3" />
          </g>
        )}
        
        {/* Armor Section */}
        {!isABC && armorType !== 'Unarmored' && (
          <g filter="url(#dropShadow)">
            {/* Armor Bedding/Base */}
            <circle cx={center} cy={center} r={armorRadius} fill="#334155" />
            
            {/* Specific Armor Textures */}
            {armorType === 'SWA' || armorType === 'AWA' ? (
              // Wire Armor
              Array.from({ length: 36 }).map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180;
                const r = armorRadius - 2.5;
                const cx = center + r * Math.cos(angle);
                const cy = center + r * Math.sin(angle);
                return (
                  <g key={i}>
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r="2.8" 
                      fill="url(#armorWireGradient)" 
                      stroke="#0f172a" 
                      strokeWidth="0.1" 
                    />
                    {/* Specular highlight for 3D effect */}
                    <circle cx={cx - 0.8} cy={cy - 0.8} r="0.6" fill="white" opacity="0.5" />
                  </g>
                );
              })
            ) : armorType === 'STA' ? (
              // Tape Armor (Double Layer)
              <g>
                <circle cx={center} cy={center} r={armorRadius - 1} fill="none" stroke="#475569" strokeWidth="2.5" strokeDasharray="15 3" />
                <circle cx={center} cy={center} r={armorRadius - 3.5} fill="none" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="12 6" />
                <circle cx={center} cy={center} r={armorRadius - 2.25} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              </g>
            ) : (armorType === 'GSWB' || armorType === 'TCWB') ? (
              // Braid Armor
              <g>
                <circle cx={center} cy={center} r={armorRadius - 2} fill="none" stroke={armorType === 'TCWB' ? '#78350f' : '#475569'} strokeWidth="4.5" strokeDasharray="4 2" />
                <circle cx={center} cy={center} r={armorRadius - 2} fill="none" stroke={armorType === 'TCWB' ? '#f59e0b' : '#cbd5e1'} strokeWidth="4.5" strokeDasharray="2 4" opacity="0.5" />
              </g>
            ) : null}
          </g>
        )}
        
        {/* Inner Covering / Bedding */}
        {!isABC && (cores > 1 || armorType !== 'Unarmored') && (
          <g filter="url(#innerShadow)">
            <circle cx={center} cy={center} r={innerRadius} fill="#64748b" />
            <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
            {/* Interstice Fillers */}
            {cores > 1 && conductorType !== 'sm' && (
              <g opacity="0.6">
                <circle cx={center} cy={center} r={innerRadius - 2} fill="#475569" />
                <circle cx={center} cy={center} r={coreRadius * 0.4} fill="#1e293b" />
              </g>
            )}
          </g>
        )}

        {/* Overall Screen (Concentric Screen) */}
        {hasOverallScreen && !isABC && (
          <g>
            <circle cx={center} cy={center} r={screenRadius} fill="none" stroke={screenColor} strokeWidth="1.5" strokeDasharray="2 1" />
            <circle cx={center} cy={center} r={screenRadius - 0.5} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="2 1" />
          </g>
        )}
        
        {/* Cores */}
        {corePositions.map((pos, i) => {
          let insulationColor = pos.isEarth ? (isABC ? '#000000' : '#fbbf24') : getInsulationColor(i, cores, standard);
          
          if (isNYAF) {
            insulationColor = '#fbbf24';
          }

          const coreGradientId = `coreGrad-${i}`;
          const condRad = pos.r * (isMV ? 0.45 : 0.5);

          if (conductorType === 'sm' && cores >= 3) {
            // Sector shape logic
            const startAngle = pos.angle - (180 / cores) + 8;
            const endAngle = pos.angle + (180 / cores) - 8;
            const rOuter = innerRadius - 2;
            
            return (
              <g key={i} filter="url(#dropShadow)">
                <defs>
                   <radialGradient id={coreGradientId} cx="40%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="black" stopOpacity="0.2" />
                   </radialGradient>
                </defs>
                {/* Insulation Layer */}
                <path d={describeArc(center, center, rOuter, startAngle, endAngle, 15)} fill={insulationColor} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
                <path d={describeArc(center, center, rOuter, startAngle, endAngle, 15)} fill={`url(#${coreGradientId})`} />
                
                {/* Earth Stripe for Sector */}
                {pos.isEarth && (
                   <path d={describeArc(center, center, rOuter - 2, startAngle + 10, endAngle - 10, 17)} fill="#16a34a" />
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
                <path d={describeArc(center, center, rOuter - (isMV ? 14 : 10), startAngle + 5, endAngle - 5, 12)} fill="url(#conductorGradient)" />
                {/* Stranding effect for sector */}
                <path d={describeArc(center, center, rOuter - (isMV ? 14 : 10), startAngle + 5, endAngle - 5, 12)} fill="url(#strandPattern)" opacity="0.3" />
              </g>
            );
          }

          return (
            <g key={i} filter="url(#dropShadow)">
              <defs>
                <radialGradient id={coreGradientId} cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="black" stopOpacity="0.3" />
                </radialGradient>
              </defs>
              {/* Core Insulation */}
              <circle cx={pos.x} cy={pos.y} r={pos.r} fill={insulationColor} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
              <circle cx={pos.x} cy={pos.y} r={pos.r} fill={`url(#${coreGradientId})`} />
              
              {/* Green Stripe for Earth Core or NYAF */}
              {(pos.isEarth || isNYAF) && (
                <g transform={`rotate(${pos.angle + 45}, ${pos.x}, ${pos.y})`}>
                  <rect x={pos.x - pos.r} y={pos.y - pos.r * 0.25} width={pos.r * 2} height={pos.r * 0.5} fill="#16a34a" />
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
              <circle cx={pos.x} cy={pos.y} r={condRad} fill="url(#conductorGradient)" />
              
              {/* Stranding Effect */}
              {(conductorType === 'rm' || conductorType === 'f') ? (
                <circle cx={pos.x} cy={pos.y} r={condRad} fill="url(#strandPattern)" opacity="0.4" />
              ) : (
                <circle cx={pos.x} cy={pos.y} r={condRad} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" strokeDasharray="1 1" />
              )}
              
              {/* Specular highlight on conductor */}
              <circle cx={pos.x - pos.r * 0.15} cy={pos.y - pos.r * 0.15} r={pos.r * 0.12} fill="white" opacity="0.5" />
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
