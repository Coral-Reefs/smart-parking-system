import React, { useMemo } from 'react';
import { ParkingSpot } from '../types';
import { Car, Footprints, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ParkingFloorMapProps {
  spots: ParkingSpot[];
  assignedSpot: ParkingSpot | null;
  drivingProgress: number; // 0 to 100
  isDriving: boolean;
  isParked: boolean;
  currentPlate: string;
  onSelectSpot?: (spot: ParkingSpot) => void;
}

export const ParkingFloorMap: React.FC<ParkingFloorMapProps> = ({
  spots,
  assignedSpot,
  drivingProgress,
  isDriving,
  isParked,
  currentPlate,
  onSelectSpot,
}) => {
  // SVG ViewBox coordinate system: 800 x 520
  const svgWidth = 800;
  const svgHeight = 520;

  // Build SVG Path string for the glowing light strips to the assigned spot
  const lightStripPathD = useMemo(() => {
    if (!assignedSpot || !assignedSpot.path || assignedSpot.path.length < 2) return '';
    return assignedSpot.path
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');
  }, [assignedSpot]);

  // Compute animated car position along the waypoint path based on drivingProgress (0-100)
  const currentCarPos = useMemo(() => {
    if (!assignedSpot || !assignedSpot.path || assignedSpot.path.length < 2) {
      return { x: 80, y: 450, angle: -90 };
    }

    const path = assignedSpot.path;
    if (drivingProgress <= 0) {
      return { x: path[0].x, y: path[0].y, angle: -90 };
    }
    if (drivingProgress >= 100) {
      const last = path[path.length - 1];
      const prev = path[path.length - 2];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI);
      return { x: last.x, y: last.y, angle };
    }

    // Calculate segment lengths
    const segmentLengths: number[] = [];
    let totalLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = path[i + 1].x - path[i].x;
      const dy = path[i + 1].y - path[i].y;
      const len = Math.hypot(dx, dy);
      segmentLengths.push(len);
      totalLength += len;
    }

    const targetDist = (drivingProgress / 100) * totalLength;
    let accumulated = 0;

    for (let i = 0; i < segmentLengths.length; i++) {
      const segLen = segmentLengths[i];
      if (accumulated + segLen >= targetDist) {
        const remaining = targetDist - accumulated;
        const ratio = segLen > 0 ? remaining / segLen : 0;
        const x = path[i].x + (path[i + 1].x - path[i].x) * ratio;
        const y = path[i].y + (path[i + 1].y - path[i].y) * ratio;
        const angle =
          Math.atan2(path[i + 1].y - path[i].y, path[i + 1].x - path[i].x) * (180 / Math.PI);
        return { x, y, angle };
      }
      accumulated += segLen;
    }

    const last = path[path.length - 1];
    return { x: last.x, y: last.y, angle: 0 };
  }, [assignedSpot, drivingProgress]);

  return (
    <div className="relative w-full rounded-2xl bg-[#090d16] border border-cyan-900/40 p-2 sm:p-4 shadow-2xl shadow-cyan-950/50 overflow-hidden select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar of the floor map */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-cyan-400 to-purple-500 shadow-sm shadow-cyan-400/50" />
            Level B1 Floor Plan
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-400">Grand Galleria Mall</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 shadow-sm shadow-teal-400/60" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 shadow-sm shadow-purple-400/60 animate-pulse" />
            <span>Assigned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
            <span>Taken</span>
          </div>
        </div>
      </div>

      {/* SVG Floor Canvas */}
      <div className="relative w-full aspect-[800/520] max-h-[520px] bg-[#0c1222] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* SVG Glowing filters for floor light strips */}
            <filter id="tealGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear gradient for Light Strip */}
            <linearGradient id="lightStripGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>

            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            {/* Floor tile pattern */}
            <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#17223b"
                strokeWidth="0.8"
                opacity="0.4"
              />
            </pattern>
          </defs>

          {/* Floor grid pattern */}
          <rect width={svgWidth} height={svgHeight} fill="#090e1c" />
          <rect width={svgWidth} height={svgHeight} fill="url(#floorGrid)" />

          {/* Mall Entrance & Lifts (North Center) */}
          <g transform="translate(320, 10)">
            <rect
              x="0"
              y="0"
              width="160"
              height="45"
              rx="8"
              fill="#111c35"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="shadow-lg"
            />
            <text
              x="80"
              y="22"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              🛍️ MALL ATRIUM & LIFTS
            </text>
            <text
              x="80"
              y="37"
              fill="#94a3b8"
              fontSize="9"
              textAnchor="middle"
            >
              Pedestrian Access Gate
            </text>
          </g>

          {/* Zone Labels on Floor */}
          <text x="200" y="65" fill="#475569" fontSize="13" fontWeight="bold" textAnchor="middle">
            ZONE A · FASHION HALL
          </text>
          <text x="600" y="65" fill="#a855f7" fontSize="13" fontWeight="bold" textAnchor="middle" opacity="0.8">
            ZONE B · GRAND ATRIUM (CLOSEST)
          </text>
          <text x="200" y="495" fill="#475569" fontSize="13" fontWeight="bold" textAnchor="middle">
            ZONE C · GOURMET MARKET
          </text>
          <text x="600" y="495" fill="#475569" fontSize="13" fontWeight="bold" textAnchor="middle">
            ZONE D · CINEMA & PLAY
          </text>

          {/* Driving Lanes Markings (Dark roads with dashed centerlines) */}
          {/* Main Concourse: horizontal band across y=240 to y=270 */}
          <rect x="50" y="235" width="700" height="30" fill="#0f192e" rx="4" opacity="0.9" />
          <line
            x1="50"
            y1="250"
            x2="750"
            y2="250"
            stroke="#1e293b"
            strokeWidth="2"
            strokeDasharray="12 10"
          />

          {/* Vertical Access Lanes */}
          {/* Zone A/C Left North-South Aisle at x=160 */}
          <rect x="150" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />
          {/* Zone A/C Mid North-South Aisle at x=230 */}
          <rect x="220" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />
          {/* Zone A/C Right North-South Aisle at x=300 */}
          <rect x="290" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />

          {/* Zone B/D Left North-South Aisle at x=500 */}
          <rect x="490" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />
          {/* Zone B/D Mid North-South Aisle at x=570 */}
          <rect x="560" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />
          {/* Zone B/D Right North-South Aisle at x=640 */}
          <rect x="630" y="80" width="20" height="360" fill="#0f192e" rx="3" opacity="0.6" />

          {/* Entry Gantry Lane (Bottom Left x=80, from y=480 to y=250) */}
          <rect x="65" y="240" width="30" height="250" fill="#111c36" rx="4" />
          <line
            x1="80"
            y1="490"
            x2="80"
            y2="250"
            stroke="#1e293b"
            strokeWidth="2"
            strokeDasharray="10 8"
          />

          {/* Entry Gantry Station Graphic */}
          <g transform="translate(45, 435)">
            <rect
              x="0"
              y="0"
              width="70"
              height="40"
              rx="6"
              fill="#0f172a"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />
            <text x="35" y="16" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
              ENTRY GATE
            </text>
            <text x="35" y="30" fill="#94a3b8" fontSize="8" textAnchor="middle">
              Scanner 01
            </text>
            {/* Pulsing optical scan beam */}
            <line x1="5" y1="36" x2="65" y2="36" stroke="#22d3ee" strokeWidth="2" opacity="0.8" />
          </g>

          {/* INACTIVE Floor Light Strip Guide Track (embedded physical floor LEDs in asphalt) */}
          {/* We show faint recessed grooves along all pathways so users can see the smart floor infrastructure */}
          <g opacity="0.25">
            <line x1="80" y1="450" x2="80" y2="250" stroke="#0e7490" strokeWidth="3" />
            <line x1="80" y1="250" x2="720" y2="250" stroke="#0e7490" strokeWidth="3" />
            <line x1="160" y1="120" x2="160" y2="400" stroke="#0e7490" strokeWidth="2" />
            <line x1="300" y1="120" x2="300" y2="400" stroke="#0e7490" strokeWidth="2" />
            <line x1="500" y1="120" x2="500" y2="400" stroke="#0e7490" strokeWidth="2" />
            <line x1="640" y1="120" x2="640" y2="400" stroke="#0e7490" strokeWidth="2" />
          </g>

          {/* FEATURE 2: ACTIVE DYNAMIC FLOOR LIGHT STRIPS TO ASSIGNED SPOT */}
          {lightStripPathD && (
            <g className="light-strip-container">
              {/* Outer Radiant Ambient Glow Layer (Purple & Teal) */}
              <path
                d={lightStripPathD}
                fill="none"
                stroke="#a855f7"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
                filter="url(#purpleGlow)"
              />

              {/* Secondary Teal Diffusion Layer */}
              <path
                d={lightStripPathD}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
                filter="url(#tealGlow)"
              />

              {/* Core Solid High-Intensity Dual LED Strip Base */}
              <path
                d={lightStripPathD}
                fill="none"
                stroke="url(#lightStripGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Animated Flowing Photon Light Pulses along the floor strip */}
              <path
                d={lightStripPathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="14 26"
                className="animate-light-flow"
              />

              {/* Directional Chevron Arrows along the path */}
              {assignedSpot?.path && assignedSpot.path.length >= 2 && (
                <g opacity="0.95">
                  {assignedSpot.path.slice(0, -1).map((start, i) => {
                    const end = assignedSpot.path[i + 1];
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;
                    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);
                    return (
                      <g key={i} transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                        <polygon
                          points="-6,-5 4,0 -6,5 -2,0"
                          fill="#38bdf8"
                          stroke="#c084fc"
                          strokeWidth="1"
                          filter="url(#tealGlow)"
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          )}

          {/* PARKING BAYS (A-01 to D-06) */}
          {spots.map((spot) => {
            const isAssigned = assignedSpot?.id === spot.id;
            const isOccupied = spot.status === 'occupied';
            const isAvailable = spot.status === 'available';

            // Bay frame styling
            let strokeColor = '#334155';
            let fillColor = '#0f172a';
            let glowFilter = '';

            if (isAssigned) {
              strokeColor = '#c084fc';
              fillColor = '#1f1338';
              glowFilter = 'url(#purpleGlow)';
            } else if (isOccupied) {
              strokeColor = '#e11d48';
              fillColor = '#1e111a';
            } else if (isAvailable) {
              strokeColor = '#0d9488';
              fillColor = '#0c1b24';
            }

            return (
              <g
                key={spot.id}
                onClick={() => onSelectSpot && onSelectSpot(spot)}
                className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                style={{ transformOrigin: `${spot.x + spot.width / 2}px ${spot.y + spot.height / 2}px` }}
              >
                {/* Bay Ground Box */}
                <rect
                  x={spot.x}
                  y={spot.y}
                  width={spot.width}
                  height={spot.height}
                  rx="6"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isAssigned ? '2.5' : '1.5'}
                  filter={glowFilter}
                  opacity={isAssigned ? 0.95 : 0.85}
                />

                {/* Overhead Smart Sensor Lamp Indicator */}
                <circle
                  cx={spot.x + spot.width / 2}
                  cy={spot.y > 200 ? spot.y + spot.height - 8 : spot.y + 8}
                  r={isAssigned ? 5 : 3.5}
                  fill={
                    isAssigned
                      ? '#c084fc'
                      : isOccupied
                      ? '#ef4444'
                      : '#14b8a6'
                  }
                  className={isAssigned ? 'animate-pulse' : ''}
                  filter={isAssigned ? 'url(#purpleGlow)' : undefined}
                />

                {/* Bay Code Label */}
                <text
                  x={spot.x + spot.width / 2}
                  y={spot.y + 22}
                  fill={isAssigned ? '#f5d0fe' : isOccupied ? '#fca5a5' : '#5eead4'}
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {spot.id}
                </text>

                {/* Subtext: walking distance or car plate if occupied */}
                {isOccupied ? (
                  <g>
                    {/* Car silhouette inside bay */}
                    <rect
                      x={spot.x + 8}
                      y={spot.y + 28}
                      width={spot.width - 16}
                      height={spot.height - 38}
                      rx="4"
                      fill="#334155"
                      opacity="0.8"
                    />
                    <text
                      x={spot.x + spot.width / 2}
                      y={spot.y + 44}
                      fill="#e2e8f0"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {spot.occupiedByPlate || 'TAKEN'}
                    </text>
                  </g>
                ) : isAssigned ? (
                  <g>
                    <text
                      x={spot.x + spot.width / 2}
                      y={spot.y + 38}
                      fill="#c084fc"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isParked ? 'PARKED' : 'ASSIGNED'}
                    </text>
                    <text
                      x={spot.x + spot.width / 2}
                      y={spot.y + 50}
                      fill="#38bdf8"
                      fontSize="8"
                      textAnchor="middle"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {currentPlate}
                    </text>
                  </g>
                ) : (
                  <text
                    x={spot.x + spot.width / 2}
                    y={spot.y + 38}
                    fill="#94a3b8"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {spot.distanceMeters}m walk
                  </text>
                )}
              </g>
            );
          })}

          {/* FEATURE 3: LIVE MOVING CUSTOMER VEHICLE ON LIGHT STRIPS */}
          {assignedSpot && (isDriving || drivingProgress > 0) && (
            <g
              transform={`translate(${currentCarPos.x}, ${currentCarPos.y}) rotate(${currentCarPos.angle + 90})`}
              className="transition-all duration-75"
            >
              {/* Car Body */}
              <rect
                x="-12"
                y="-20"
                width="24"
                height="40"
                rx="6"
                fill="#0f172a"
                stroke="#06b6d4"
                strokeWidth="2"
                filter="url(#tealGlow)"
              />
              {/* Windshield */}
              <rect x="-9" y="-12" width="18" height="10" rx="2" fill="#38bdf8" opacity="0.8" />
              {/* Headlights beam */}
              <polygon
                points="-8,-20 -16,-38 16,-38 8,-20"
                fill="url(#lightStripGradient)"
                opacity="0.25"
              />
              {/* Roof accent */}
              <circle cx="0" cy="4" r="3" fill="#a855f7" />
              {/* Headlight bulbs */}
              <circle cx="-7" cy="-19" r="2" fill="#ffffff" />
              <circle cx="7" cy="-19" r="2" fill="#ffffff" />
              {/* Rear brake lights */}
              <circle cx="-7" cy="19" r="2" fill="#ef4444" />
              <circle cx="7" cy="19" r="2" fill="#ef4444" />

              {/* Customer Plate Floating Tag */}
              <g transform="translate(0, -30) rotate(-90)">
                <rect
                  x="-28"
                  y="-8"
                  width="56"
                  height="16"
                  rx="3"
                  fill="#000000"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="4"
                  fill="#fbbf24"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {currentPlate}
                </text>
              </g>
            </g>
          )}

          {/* Entry Gate Ready Car (When idle at the scanner) */}
          {!isDriving && drivingProgress === 0 && (
            <g transform="translate(80, 450) rotate(0)">
              <rect
                x="-12"
                y="-20"
                width="24"
                height="40"
                rx="6"
                fill="#1e293b"
                stroke="#fbbf24"
                strokeWidth="1.8"
              />
              <rect x="-9" y="-12" width="18" height="10" rx="2" fill="#94a3b8" opacity="0.6" />
              <circle cx="-7" cy="-19" r="2" fill="#fef08a" />
              <circle cx="7" cy="-19" r="2" fill="#fef08a" />
              <circle cx="-7" cy="19" r="2" fill="#ef4444" />
              <circle cx="7" cy="19" r="2" fill="#ef4444" />
            </g>
          )}
        </svg>

        {/* Floating guidance overlay badge if spot is assigned */}
        {assignedSpot && !isParked && (
          <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-md bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs shadow-lg shadow-cyan-950/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div>
                <span className="text-slate-300">Floor Light Strip Active: </span>
                <span className="font-bold text-cyan-300">Bay {assignedSpot.id}</span>
                <span className="text-slate-400"> ({assignedSpot.zoneName})</span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/40">
              {assignedSpot.distanceMeters}m to Lifts
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
