import React, { useState } from 'react';
import { X, Settings, Server, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBackendConnected: boolean;
  onBackendStatusChange: (status: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isBackendConnected,
  onBackendStatusChange
}) => {
  const [urlInput, setUrlInput] = useState<string>(getApiBaseUrl());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Quantum Hyperparameters
  const [swarmSize, setSwarmSize] = useState<number>(50);
  const [alphaCoeff, setAlphaCoeff] = useState<number>(0.75);
  const [maxIterations, setMaxIterations] = useState<number>(200);
  const [seed, setSeed] = useState<number>(42);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsChecking(true);
    setTestResult(null);
    setApiBaseUrl(urlInput);
    const healthy = await checkBackendHealth();
    setIsChecking(false);
    onBackendStatusChange(healthy);
    if (healthy) {
      setTestResult('Connected! FastAPI backend responded successfully.');
    } else {
      setTestResult('Could not reach backend at this URL. Running in Demo Safety Mode.');
    }
  };

  const handleSave = () => {
    setApiBaseUrl(urlInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="settings-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/50 text-purple-400 border border-purple-800/40">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                System & Algorithm Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Backend API endpoints and quantum-inspired hyperparameters
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
        <div className="p-6 space-y-5 text-xs text-slate-300 overflow-y-auto">
          {/* Backend Connection */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00A3FF]" />
                FastAPI Backend Connection
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  isBackendConnected
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                    : 'text-amber-400 bg-amber-950/40 border-amber-800/50'
                }`}
              >
                {isBackendConnected ? 'Online (Port 8000)' : 'Fallback Mock Mode'}
              </span>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                Backend Base URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white text-xs focus:border-[#00A3FF] focus:outline-none"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={isChecking}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Test</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  isBackendConnected
                    ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                    : 'bg-amber-950/40 border border-amber-800/60 text-amber-300'
                }`}
              >
                {isBackendConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <span>{testResult}</span>
              </div>
            )}
          </div>

          {/* Quantum Hyperparameters */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00FF9D]" />
              QPSO (Quantum Particle Swarm) Hyperparameters
            </span>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Swarm Population (N)
                </label>
                <input
                  type="number"
                  value={swarmSize}
                  onChange={(e) => setSwarmSize(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Contraction-Expansion (α)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={alphaCoeff}
                  onChange={(e) => setAlphaCoeff(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Max Iterations (T)
                </label>
                <input
                  type="number"
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Random Quantum Seed
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Hackathon Credentials Info */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed">
            <span className="text-[#00A3FF] font-bold block mb-1">
              Smart India Hackathon 2026 (SIH26137)
            </span>
            Quantum-Inspired Intelligent Traffic Route Optimization for high-density metropolitan logistics.
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
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#00A3FF] hover:bg-[#0080FF] text-white text-xs font-semibold font-mono shadow-sm cursor-pointer transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
