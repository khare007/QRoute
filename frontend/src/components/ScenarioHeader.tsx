import React from 'react';
import { Play, AlertTriangle, ArrowLeft, Server, Wifi } from 'lucide-react';
import { ActiveNavTab, ScenarioInfo } from '../types';

interface ScenarioHeaderProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  scenarioInfo: ScenarioInfo;
  onRunQPSO: () => void;
  onInjectTraffic: () => void;
  isRunningQPSO: boolean;
  isInjectingTraffic: boolean;
  isBackendConnected: boolean;
  isTrafficInjected: boolean;
}

export const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  activeTab,
  setActiveTab,
  scenarioInfo,
  onRunQPSO,
  onInjectTraffic,
  isRunningQPSO,
  isInjectingTraffic,
  isBackendConnected,
  isTrafficInjected
}) => {
  const isDashboard = activeTab === 'dashboard';

  return (
    <header
      id="scenario-header"
      className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0B0F19] sticky top-0 z-20"
    >
      {/* Scenario Columns */}
      <div className="flex items-center space-x-6 text-xs uppercase font-bold tracking-widest">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[9px]">Scenario</span>
          <span className="text-white font-sans">{scenarioInfo.name}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[9px]">Customers</span>
          <span className="text-white font-mono">{scenarioInfo.customers}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[9px]">Capacity</span>
          <span className="text-white font-mono">{scenarioInfo.vehicleCapacity}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[9px]">Traffic Level</span>
          <span
            className={`font-mono text-[11px] flex items-center gap-1 ${
              isTrafficInjected ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isTrafficInjected ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
            />
            {isTrafficInjected ? 'HIGH' : scenarioInfo.trafficLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Backend Status indicator */}
        <span
          id="backend-status-badge"
          title={
            isBackendConnected
              ? 'FastAPI Backend connected at localhost:8000'
              : 'Demo Mode Active: Pre-calculated Live Data Loaded (SIH 2026 Dataset)'
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border tracking-wide ${
            isBackendConnected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : 'bg-slate-800/80 text-emerald-300 border-slate-700/80'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isBackendConnected
              ? 'FastAPI Live: Connected'
              : 'Demo Mode Active - Pre-calculated Live Data Loaded'}
          </span>
          <span className="sm:hidden">
            {isBackendConnected ? 'API Live' : 'Demo Mode Active'}
          </span>
        </span>

        {isDashboard ? (
          <>
            <button
              id="btn-header-export-json"
              onClick={() => {
                const jsonStr = JSON.stringify(scenarioInfo, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scenario-${scenarioInfo.name.toLowerCase().replace(/\s+/g, '-')}.json`;
                a.click();
              }}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Export JSON
            </button>
            <button
              id="btn-header-run-solver"
              onClick={onRunQPSO}
              disabled={isRunningQPSO}
              className="px-3 py-1 bg-[#00FF9D] hover:bg-emerald-400 text-black font-bold border border-emerald-500 rounded text-xs transition cursor-pointer disabled:opacity-60"
            >
              {isRunningQPSO ? 'Solving...' : 'Run QPSO'}
            </button>
          </>
        ) : (
          <button
            id="btn-header-back-to-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 rounded transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
};
