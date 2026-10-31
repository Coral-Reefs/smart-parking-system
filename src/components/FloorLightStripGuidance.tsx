import React from 'react';
import { ParkingSpot } from '../types';
import { Route, Navigation, ArrowUpRight, Zap, Lightbulb } from 'lucide-react';

interface FloorLightStripGuidanceProps {
  assignedSpot: ParkingSpot | null;
  drivingProgress: number;
  isDriving: boolean;
  isParked: boolean;
}

export const FloorLightStripGuidance: React.FC<FloorLightStripGuidanceProps> = ({
  assignedSpot,
  drivingProgress,
  isDriving,
  isParked,
}) => {
  if (!assignedSpot) {
    return (
      <div className="rounded-2xl bg-[#0c1222] border border-slate-800 p-4 text-xs text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
            2
          </span>
          <span>Light strips currently standby. Scan plate to illuminate floor directions.</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">STANDBY</span>
      </div>
    );
  }

  // Derive turn-by-turn guidance based on assigned spot zone & progress
  const getStepStatus = (stepIndex: number) => {
    if (isParked) return 'completed';
    if (drivingProgress === 0) return stepIndex === 1 ? 'current' : 'pending';
    if (drivingProgress < 35) return stepIndex === 1 ? 'active' : 'pending';
    if (drivingProgress < 75) return stepIndex === 1 ? 'completed' : stepIndex === 2 ? 'active' : 'pending';
    return stepIndex <= 2 ? 'completed' : 'active';
  };

  return (
    <div className="rounded-2xl bg-[#0c1222] border border-cyan-800/40 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative ambient glowing gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Feature 2 Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 text-xs font-bold">
            2
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Floor Light Strip Directions
          </h2>
        </div>

        {/* Dynamic Light Strip System Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[11px] font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{isParked ? 'GUIDE COMPLETE' : isDriving ? 'PULSING TRAIL' : 'STRIPS LIT'}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Follow the illuminated dual-color LED light strips embedded directly into the driving floor.
      </p>

      {/* Step-by-Step Floor Light Guidance Route */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Step 1: Entry to Concourse */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            getStepStatus(1) === 'active' || getStepStatus(1) === 'current'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/50'
              : getStepStatus(1) === 'completed'
              ? 'bg-slate-900/40 border-slate-700/60 text-slate-400'
              : 'bg-[#10172a] border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-cyan-300 text-[11px]">STEP 1 · ENTRY GANTRY</span>
            <span className="text-[10px] text-cyan-400 font-mono">Teal Strip</span>
          </div>
          <div className="font-medium text-white">Drive forward 40m</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Follow teal floor strip from gate to central concourse junction.
          </div>
        </div>

        {/* Step 2: Turn towards Zone */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            getStepStatus(2) === 'active'
              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/50'
              : getStepStatus(2) === 'completed'
              ? 'bg-slate-900/40 border-slate-700/60 text-slate-400'
              : 'bg-[#10172a] border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-cyan-300 text-[11px]">
              STEP 2 · {assignedSpot.zone === 'A' || assignedSpot.zone === 'C' ? 'LEFT' : 'RIGHT'} TURN
            </span>
            <span className="text-[10px] text-teal-400 font-mono">Artery Trail</span>
          </div>
          <div className="font-medium text-white">
            Turn {assignedSpot.zone === 'A' || assignedSpot.zone === 'C' ? 'Left' : 'Right'} onto Aisle
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Follow glowing pulses towards {assignedSpot.zoneName} corridor.
          </div>
        </div>

        {/* Step 3: Bay Entrance */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            getStepStatus(3) === 'active'
              ? 'bg-purple-950/60 border-purple-400 text-purple-100 shadow-md shadow-purple-950/50'
              : getStepStatus(3) === 'completed'
              ? 'bg-slate-900/40 border-slate-700/60 text-slate-400'
              : 'bg-[#10172a] border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-purple-300 text-[11px]">
              STEP 3 · ARRIVAL
            </span>
            <span className="text-[10px] text-purple-400 font-mono">Purple Beacon</span>
          </div>
          <div className="font-medium text-white">Pull into Bay {assignedSpot.id}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Floor light strip terminates at illuminated purple parking bay.
          </div>
        </div>
      </div>
    </div>
  );
};
