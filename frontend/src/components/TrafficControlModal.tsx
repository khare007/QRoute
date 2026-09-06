import React, { useState } from 'react';
import { X, Flame, ShieldAlert } from 'lucide-react';
import { GraphEdge } from '../types';

interface TrafficControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  edges: GraphEdge[];
  onInject: (from: number, to: number, congestion: number) => void;
  isInjecting: boolean;
  currentAffectedRoad: [number, number];
}

export const TrafficControlModal: React.FC<TrafficControlModalProps> = ({
  isOpen,
  onClose,
  edges,
  onInject,
  isInjecting,
  currentAffectedRoad
}) => {
  const [selectedEdge, setSelectedEdge] = useState<string>(`${currentAffectedRoad[0]}-${currentAffectedRoad[1]}`);
  const [congestionLevel, setCongestionLevel] = useState<number>(0.90);
  const [incidentType, setIncidentType] = useState<string>('Accident & Roadblock');

  if (!isOpen) return null;

  const handleApply = () => {
    const [fromStr, toStr] = selectedEdge.split('-');
    onInject(Number(fromStr), Number(toStr), congestionLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="traffic-control-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/50 text-[#FF3366] border border-rose-800/40">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Traffic Shock Control Center
              </h2>
              <p className="text-xs text-slate-400">
                Inject dynamic congestion & evaluate QPSO real-time re-routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-300 font-sans">
          {/* Target Road Selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">
              TARGET ROAD SEGMENT (EDGE)
            </label>
            <select
              value={selectedEdge}
              onChange={(e) => setSelectedEdge(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl p-2.5 font-mono text-white text-xs focus:border-rose-500 focus:outline-none"
            >
              <option value="6-7">Road 6 → 7 (Primary Transit Artery - Default)</option>
              <option value="3-4">Road 3 → 4 (Northbound Corridor)</option>
              <option value="1-9">Road 1 → 9 (West Link)</option>
              <option value="12-22">Road 12 → 22 (South Highway)</option>
              <option value="16-18">Road 16 → 18 (East Express)</option>
            </select>
          </div>

          {/* Incident Type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">
              INCIDENT / SHOCK CAUSE
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              {['Accident & Roadblock', 'Peak Rush Hour', 'Severe Weather', 'Flash Flooding'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setIncidentType(type)}
                  className={`p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                    incidentType === type
                      ? 'border-rose-500 bg-rose-950/40 text-rose-300 font-bold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Congestion Slider */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2 font-mono">
              <span className="text-[11px] text-slate-400">Congestion Severity</span>
              <span className="text-rose-400 font-bold text-sm">
                {(congestionLevel * 100).toFixed(0)}% ({congestionLevel.toFixed(2)})
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={congestionLevel}
              onChange={(e) => setCongestionLevel(parseFloat(e.target.value))}
              className="w-full accent-[#FF3366] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Moderate (0.40)</span>
              <span>Severe (0.75)</span>
              <span>Critical Gridlock (1.00)</span>
            </div>
          </div>

          {/* Preview impact notice */}
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-rose-300/90 leading-relaxed font-mono">
              Injecting will trigger the QPSO algorithm to dynamically recalculate particle velocities in quantum contraction space to compute an optimal detour around road {selectedEdge.replace('-', ' → ')}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isInjecting}
            className="px-4 py-2 rounded-lg bg-[#FF3366] hover:bg-red-600 text-white text-xs font-semibold font-mono shadow-sm cursor-pointer transition disabled:opacity-50"
          >
            {isInjecting ? 'Injecting Traffic...' : 'Inject Traffic Shock'}
          </button>
        </div>
      </div>
    </div>
  );
};
