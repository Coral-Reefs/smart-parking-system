import React from 'react';
import { ParkingSpot } from '../types';
import { Play, Pause, CheckCircle2, Car, MapPin, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';

interface DriveAndParkControllerProps {
  assignedSpot: ParkingSpot | null;
  currentPlate: string;
  currentCarModel: string;
  isDriving: boolean;
  drivingProgress: number;
  isParked: boolean;
  onStartDrive: () => void;
  onPauseDrive: () => void;
  onCompletePark: () => void;
  onResetForNextCar: () => void;
  onReleaseSpot: (spotId: string) => void;
}

export const DriveAndParkController: React.FC<DriveAndParkControllerProps> = ({
  assignedSpot,
  currentPlate,
  currentCarModel,
  isDriving,
  drivingProgress,
  isParked,
  onStartDrive,
  onPauseDrive,
  onCompletePark,
  onResetForNextCar,
  onReleaseSpot,
}) => {
  if (!assignedSpot) {
    return (
      <div className="rounded-2xl bg-[#0c1222] border border-slate-800 p-4 text-xs text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
            3
          </span>
          <span>Drive & Park will unlock once a parking spot is assigned.</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">LOCKED</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0c1222] border border-cyan-800/40 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Decorative ambient glowing gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Feature 3 Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-950 border border-teal-500/40 text-teal-400 text-xs font-bold">
            3
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Drive to Spot & Park
          </h2>
        </div>

        {/* Status Pill */}
        <div className="text-right">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              isParked
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : isDriving
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 animate-pulse'
                : 'bg-purple-950/80 border-purple-500/50 text-purple-300'
            }`}
          >
            {isParked ? 'SPOT MARKED AS TAKEN' : isDriving ? 'DRIVING IN PROGRESS' : 'READY TO DRIVE'}
          </span>
        </div>
      </div>

      {!isParked ? (
        <div className="space-y-4">
          {/* Real-time driving progress bar along floor light strip */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                Following Floor Light Strip to Bay {assignedSpot.id}
              </span>
              <span className="font-mono text-cyan-400">{Math.round(drivingProgress)}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden p-0.5 relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-500 transition-all duration-150 shadow-sm shadow-cyan-400/50"
                style={{ width: `${drivingProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Entry Gantry</span>
              <span>Central Concourse</span>
              <span>Bay {assignedSpot.id} ({assignedSpot.zoneName})</span>
            </div>
          </div>

          {/* Action Buttons for Driving & Parking */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            {!isDriving ? (
              <button
                type="button"
                onClick={onStartDrive}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Drive Following Light Strip</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPauseDrive}
                className="flex-1 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-600 active:scale-[0.98] transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Drive</span>
              </button>
            )}

            {/* Instant Park button */}
            <button
              type="button"
              onClick={onCompletePark}
              className="h-12 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Park Vehicle Now</span>
            </button>
          </div>
        </div>
      ) : (
        /* Parked Success & Mall Reminder Card */
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#12192e] to-[#1e1338] border border-teal-500/50 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-teal-300 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>Vehicle Parked · Bay Marked as Taken</span>
          </div>

          {/* Shopper Location Memo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Assigned Bay</div>
              <div className="font-mono text-base font-bold text-purple-300">
                {assignedSpot.id}
              </div>
            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Vehicle Plate</div>
              <div className="font-mono text-base font-bold text-cyan-300">
                {currentPlate}
              </div>
            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Mall Entrance</div>
              <div className="font-semibold text-white">
                {assignedSpot.zoneName}
              </div>
            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Walking Dist</div>
              <div className="font-semibold text-teal-300">
                {assignedSpot.distanceMeters} meters
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Take Elevator #4 to Level 1 Grand Atrium shops & boutiques.</span>
          </div>

          {/* Post-Park Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onResetForNextCar}
              className="w-full sm:flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-950 active:scale-[0.98] transition-all"
            >
              <Car className="w-4 h-4" />
              <span>Simulate Next Customer Car</span>
            </button>

            <button
              type="button"
              onClick={() => onReleaseSpot(assignedSpot.id)}
              className="w-full sm:w-auto h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.98] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Free Up This Bay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
