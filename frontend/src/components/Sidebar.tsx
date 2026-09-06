import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Radio,
  Settings,
  Play,
  AlertTriangle,
  Atom
} from 'lucide-react';
import { ActiveNavTab, ScenarioInfo } from '../types';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onRunQPSO: () => void;
  onInjectTraffic: () => void;
  scenarioInfo: ScenarioInfo;
  isRunningQPSO: boolean;
  isInjectingTraffic: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onRunQPSO,
  onInjectTraffic,
  scenarioInfo,
  isRunningQPSO,
  isInjectingTraffic
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveNavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'benchmark' as ActiveNavTab, label: 'Benchmark', icon: BarChart3 },
    { id: 'input_data' as ActiveNavTab, label: 'Input Data', icon: Database },
    { id: 'traffic_control' as ActiveNavTab, label: 'Traffic Control', icon: Radio },
    { id: 'settings' as ActiveNavTab, label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      id="sidebar"
      className="w-64 flex-shrink-0 bg-[#0B0F19] border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none overflow-y-auto"
    >
      <div className="p-6 flex flex-col gap-6">
        {/* Brand Header */}
        <div id="brand-header">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 border border-emerald-500/30 text-[#00FF9D]">
              <Atom className="w-4 h-4 animate-[spin_12s_linear_infinite]" />
            </div>
            <span className="text-[#00FF9D] font-bold text-lg leading-tight tracking-tighter">
              QPSO-VRP
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Quantum-Inspired Traffic-Aware Routing
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="sidebar-nav" className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-slate-800/50 text-white border-l-2 border-[#00FF9D] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#00FF9D]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div id="quick-actions-section" className="space-y-3 pt-2">
          {/* Run QPSO Button */}
          <button
            id="btn-quick-run-qpso"
            onClick={onRunQPSO}
            disabled={isRunningQPSO}
            className="w-full bg-[#00A3FF] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningQPSO ? 'animate-spin' : ''}`} />
            <span>{isRunningQPSO ? 'Solving...' : 'Run QPSO Solver'}</span>
          </button>

          {/* Inject Traffic Button */}
          <button
            id="btn-quick-inject-traffic"
            onClick={onInjectTraffic}
            disabled={isInjectingTraffic}
            className="w-full bg-[#FF3366] hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isInjectingTraffic ? 'Injecting...' : 'Inject Traffic'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Info Card */}
      <div className="m-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
          Scenario Info
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
          <span className="text-slate-400">Dataset:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.dataset}</span>

          <span className="text-slate-400">Nodes:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.nodes}</span>

          <span className="text-slate-400">Customers:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.customers}</span>

          <span className="text-slate-400">Vehicles:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.vehicles}</span>

          <span className="text-slate-400">Capacity:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.vehicleCapacity}</span>

          <span className="text-slate-400">Depot:</span>
          <span className="text-right text-white font-mono">Node {scenarioInfo.depot}</span>

          <span className="text-slate-400">Traffic:</span>
          <span className="text-right text-yellow-500 font-bold uppercase font-mono">
            {scenarioInfo.trafficLevel === 'Moderate' ? 'Mod' : scenarioInfo.trafficLevel}
          </span>

          <span className="text-slate-400">Edges:</span>
          <span className="text-right text-white font-mono">{scenarioInfo.edgeCount} Active</span>
        </div>
      </div>
    </aside>
  );
};
