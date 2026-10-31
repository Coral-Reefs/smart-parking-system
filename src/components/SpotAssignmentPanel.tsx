import React, { useState } from 'react';
import { ParkingSpot, CustomerRecord } from '../types';
import { Camera, Check, Sparkles, AlertTriangle, ArrowRight, RefreshCw, Car } from 'lucide-react';

interface SpotAssignmentPanelProps {
  currentPlate: string;
  setCurrentPlate: (plate: string) => void;
  currentCarModel: string;
  setCurrentCarModel: (model: string) => void;
  assignedSpot: ParkingSpot | null;
  onAssignSpot: (preferredSpotId?: string) => void;
  onSimulateContention: () => void;
  sampleCustomers: CustomerRecord[];
  isDriving: boolean;
  isParked: boolean;
  availableCount: number;
  totalCount: number;
  rerouteNotice: string | null;
}

export const SpotAssignmentPanel: React.FC<SpotAssignmentPanelProps> = ({
  currentPlate,
  setCurrentPlate,
  currentCarModel,
  setCurrentCarModel,
  assignedSpot,
  onAssignSpot,
  onSimulateContention,
  sampleCustomers,
  isDriving,
  isParked,
  availableCount,
  totalCount,
  rerouteNotice,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showPlatePicker, setShowPlatePicker] = useState(false);

  // Simulate ANPR (Automatic Number Plate Recognition) scan at the gantry
  const handleSimulateScan = (plateNumber?: string, carModelName?: string) => {
    setIsScanning(true);
    setTimeout(() => {
      if (plateNumber) {
        setCurrentPlate(plateNumber);
        if (carModelName) setCurrentCarModel(carModelName);
      } else {
        // Pick random waiting customer from sample list or generate realistic one
        const waitingCustomers = sampleCustomers.filter((c) => c.initialStatus === 'waiting');
        const picked = waitingCustomers[Math.floor(Math.random() * waitingCustomers.length)];
        if (picked) {
          setCurrentPlate(picked.plate);
          setCurrentCarModel(picked.carModel);
        }
      }
      setIsScanning(false);
      onAssignSpot();
    }, 600);
  };

  return (
    <div className="rounded-2xl bg-[#0c1222] border border-cyan-800/40 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative ambient glowing gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Feature 1 Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-xs font-bold">
              1
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Assign Parking Spot
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Scan shopping customer plate at entry gantry for automatic allocation
          </p>
        </div>

        {/* Live occupancy indicator */}
        <div className="text-right shrink-0">
          <div className="text-xs font-medium text-slate-400">Available Bays</div>
          <div className="text-sm font-bold font-mono text-cyan-400">
            {availableCount} <span className="text-slate-500 font-normal">/ {totalCount}</span>
          </div>
        </div>
      </div>

      {/* Reroute / Conflict Notice (Rule: if taken, suggest next free one) */}
      {rerouteNotice && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Rule Triggered: </span>
            {rerouteNotice}
          </div>
        </div>
      )}

      {/* Car Plate Scanner / Input Section */}
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-300">
          Customer Car Plate (Gantry Scan Simulation)
        </label>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Authentic Vehicle Plate Display / Input Box */}
          <div className="relative flex-1 flex items-center bg-black/70 border-2 border-slate-700 focus-within:border-cyan-400 rounded-xl px-3 py-2 shadow-inner">
            {/* Country/Mall Emblem Bar */}
            <div className="flex flex-col items-center justify-center bg-blue-700 text-[9px] font-bold text-white px-1.5 py-1 rounded-sm mr-2.5">
              <span>MALL</span>
              <span className="text-[7px] text-cyan-200">B1</span>
            </div>

            {/* Input for plate */}
            <input
              type="text"
              value={currentPlate}
              onChange={(e) => setCurrentPlate(e.target.value.toUpperCase())}
              placeholder="e.g. LBN 6203"
              maxLength={10}
              className="w-full bg-transparent text-white font-mono font-bold text-lg sm:text-xl tracking-wider uppercase focus:outline-none placeholder:text-slate-600"
              disabled={isDriving}
            />

            {/* Camera Optical Reader Badge */}
            {isScanning ? (
              <span className="text-xs text-cyan-400 flex items-center gap-1 animate-pulse shrink-0 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning...
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSimulateScan()}
                disabled={isDriving}
                className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
                title="Optical plate auto-scan"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Action Button: Scan & Assign */}
          <button
            type="button"
            onClick={() => handleSimulateScan()}
            disabled={isDriving || isScanning || availableCount === 0}
            className="h-12 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Camera className="w-4 h-4" />
            <span>Scan & Auto-Assign</span>
          </button>
        </div>

        {/* Quick-Pick Realistic Customer Plates (15 sample records provided) */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Pre-filled Shopper Plates (Tap to Quick-Scan):</span>
            <button
              type="button"
              onClick={() => setShowPlatePicker(!showPlatePicker)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              {showPlatePicker ? 'Collapse List' : 'View All 15 Records'}
            </button>
          </div>

          <div
            className={`flex flex-wrap gap-1.5 transition-all duration-300 ${
              showPlatePicker ? 'max-h-56 overflow-y-auto pr-1' : 'max-h-16 overflow-hidden'
            }`}
          >
            {sampleCustomers.map((cust) => {
              const isSelected = currentPlate === cust.plate;
              const isAlreadyParked = cust.initialStatus === 'parked';
              return (
                <button
                  key={cust.plate}
                  type="button"
                  onClick={() => handleSimulateScan(cust.plate, cust.carModel)}
                  disabled={isDriving}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/30 font-bold'
                      : isAlreadyParked
                      ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      : 'bg-[#131d35] text-slate-200 border-cyan-900/50 hover:border-cyan-500/60'
                  }`}
                >
                  <span>{cust.plate}</span>
                  {isAlreadyParked && (
                    <span className="text-[9px] text-slate-500 font-sans">
                      ({cust.assignedSpotId})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assigned Spot Status Display */}
      {assignedSpot ? (
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-cyan-950/60 border border-purple-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-900/80 border border-purple-400/50 flex flex-col items-center justify-center font-mono font-extrabold text-white text-base shadow-sm shadow-purple-500/50">
              <span className="text-[10px] text-purple-300 -mb-1">BAY</span>
              {assignedSpot.id}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span>Assigned to {currentPlate}</span>
                <span className="text-slate-500">·</span>
                <span className="text-purple-300 font-semibold">{assignedSpot.zoneName}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Walking distance: <span className="text-cyan-300 font-medium">{assignedSpot.distanceMeters}m</span> to Grand Atrium Lifts
              </div>
            </div>
          </div>

          {/* Conflict Simulation Button (Tests the rule "if it is full or already taken, then suggest the next free one") */}
          {!isParked && (
            <button
              type="button"
              onClick={onSimulateContention}
              disabled={isDriving}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
              title="Test the rule: Simulate another car taking this spot before you arrive"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Spot Contention</span>
            </button>
          )}
        </div>
      ) : availableCount === 0 ? (
        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
          ⚠️ All Level B1 bays are currently occupied. Auto-rerouting to Level B2 Overflow Deck.
        </div>
      ) : null}
    </div>
  );
};
