import React from 'react';
import { CustomerRecord, ParkingSpot } from '../types';
import { Car, Clock, X, CheckCircle, ArrowRight } from 'lucide-react';

interface SampleCustomersListProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  spots: ParkingSpot[];
  onSelectCustomer: (customer: CustomerRecord) => void;
}

export const SampleCustomersList: React.FC<SampleCustomersListProps> = ({
  isOpen,
  onClose,
  customers,
  spots,
  onSelectCustomer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl max-h-[85vh] bg-[#0c1222] border border-cyan-800/60 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-cyan-400 to-purple-500" />
              15 Sample Customer Records
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Realistic shopping mall customer plates pre-filled for simulation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer List items */}
        <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
          {customers.map((cust, idx) => {
            const spotInfo = spots.find((s) => s.occupiedByPlate === cust.plate);
            const isParked = cust.initialStatus === 'parked' || Boolean(spotInfo);

            return (
              <div
                key={cust.plate}
                className="p-3 rounded-xl bg-[#11192d] hover:bg-[#16213c] border border-slate-800/80 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-cyan-300">
                        {cust.plate}
                      </span>
                      <span className="text-[11px] text-slate-300 font-medium">
                        {cust.carModel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {cust.timestamp}
                      </span>
                      <span>·</span>
                      <span
                        className={
                          isParked ? 'text-purple-300 font-medium' : 'text-teal-400 font-medium'
                        }
                      >
                        {isParked
                          ? `Parked in ${spotInfo ? spotInfo.id : cust.assignedSpotId}`
                          : 'Arriving at Entrance'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomer(cust);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Select Car</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>Tap any customer car to load and simulate</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
