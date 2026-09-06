import React, { useState } from 'react';
import { RouteMap } from './RouteMap';
import { MiniNetworkGraph } from './MiniNetworkGraph';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Layers
} from 'lucide-react';
import {
  GraphNode,
  GraphEdge,
  VehicleRoute,
  AlgorithmMetrics,
  TrafficImpactData
} from '../types';

interface DashboardTabProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activeRoutes: VehicleRoute[];
  baseRoutes: VehicleRoute[];
  reoptimizedRoutes: VehicleRoute[];
  isTrafficInjected: boolean;
  qpsoMetrics: AlgorithmMetrics;
  orToolsMetrics: AlgorithmMetrics;
  trafficData: TrafficImpactData;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  nodes,
  edges,
  activeRoutes,
  baseRoutes,
  reoptimizedRoutes,
  isTrafficInjected,
  qpsoMetrics,
  orToolsMetrics,
  trafficData
}) => {
  const [activeSideTab, setActiveSideTab] = useState<'comparison' | 'fleet'>('comparison');

  return (
    <div id="dashboard-view" className="flex flex-col space-y-6 p-6 max-w-[1600px] mx-auto w-full">
      {/* 1. TOP METRIC CARDS (Technical Dashboard / Data Grid style) */}
      <div id="top-metric-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Distance */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">
            Total Distance
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-mono text-white">
              {(qpsoMetrics?.distance ?? 0).toFixed(2)}
              <span className="text-xs ml-1 text-slate-500 uppercase font-sans">km</span>
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/10 text-[#00FF9D] text-[10px] font-bold rounded">
              -5.18%
            </div>
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">
            Total Time
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-mono text-white">
              {(qpsoMetrics?.time ?? ((qpsoMetrics?.distance ?? 0) * 0.45)).toFixed(2)}
              <span className="text-xs ml-1 text-slate-500 uppercase font-sans">min</span>
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/10 text-[#00FF9D] text-[10px] font-bold rounded">
              -5.74%
            </div>
          </div>
        </div>

        {/* Avg Congestion */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">
            Avg Congestion
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-mono text-white">
              {(qpsoMetrics?.congestion ?? 0).toFixed(3)}
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/10 text-[#00FF9D] text-[10px] font-bold rounded">
              -15.88%
            </div>
          </div>
        </div>

        {/* Fitness Score */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl border-l-4 border-l-[#00FF9D]">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">
            Fitness Score
          </div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-mono text-[#00FF9D]">
              {(qpsoMetrics?.fitness ?? 0).toFixed(3)}
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/20 text-[#00FF9D] text-[10px] font-bold rounded">
              BEST
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER MAP & COMPARISON / FLEET AREA */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[440px]">
        {/* Route Map Container */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col">
          <RouteMap
            nodes={nodes}
            edges={edges}
            routes={activeRoutes}
            isTrafficInjected={isTrafficInjected}
            affectedEdge={trafficData.affectedRoad}
            title={
              isTrafficInjected
                ? 'OPTIMIZED ROUTES (AFTER TRAFFIC SHOCK)'
                : '1. OPTIMIZED ROUTES (BASE SCENARIO)'
            }
          />
        </div>

        {/* Right Panel: Tabs for Algorithm Comparison & Vehicle Fleet Cost Breakdown */}
        <div className="w-full lg:w-88 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header with Sub-tabs */}
            <div className="p-2 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveSideTab('comparison')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeSideTab === 'comparison'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  Comparison
                </button>
                <button
                  onClick={() => setActiveSideTab('fleet')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeSideTab === 'fleet'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3 h-3 text-[#00A3FF]" />
                  Fleet ({activeRoutes.length})
                </button>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                {activeSideTab === 'comparison' ? 'OR-Tools vs QPSO' : 'Cost Breakdown'}
              </span>
            </div>

            {/* TAB 1: ALGORITHM COMPARISON */}
            {activeSideTab === 'comparison' && (
              <div>
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-800/30 text-[10px] uppercase tracking-wider">
                      <th className="p-2.5 text-left">Metric</th>
                      <th className="p-2.5 text-left text-[#00A3FF]">OR-Tools</th>
                      <th className="p-2.5 text-left text-[#00FF9D]">QPSO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {/* Fitness */}
                    <tr className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-2.5">Fitness (↓)</td>
                      <td className="p-2.5 font-mono">{orToolsMetrics.fitness.toFixed(3)}</td>
                      <td className="p-2.5 font-mono text-[#00FF9D] font-bold">
                        {qpsoMetrics.fitness.toFixed(3)}
                      </td>
                    </tr>

                    {/* Distance */}
                    <tr className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-2.5">Dist (km) (↓)</td>
                      <td className="p-2.5 font-mono">{orToolsMetrics.distance.toFixed(1)}</td>
                      <td className="p-2.5 font-mono text-[#00FF9D] font-bold">
                        {qpsoMetrics.distance.toFixed(1)}
                      </td>
                    </tr>

                    {/* Time */}
                    <tr className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-2.5">Time (m) (↓)</td>
                      <td className="p-2.5 font-mono">{orToolsMetrics.time.toFixed(1)}</td>
                      <td className="p-2.5 font-mono text-[#00FF9D] font-bold">
                        {qpsoMetrics.time.toFixed(1)}
                      </td>
                    </tr>

                    {/* Congestion */}
                    <tr className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-2.5">Congestion (↓)</td>
                      <td className="p-2.5 font-mono">{orToolsMetrics.congestion.toFixed(3)}</td>
                      <td className="p-2.5 font-mono text-[#00FF9D] font-bold">
                        {qpsoMetrics.congestion.toFixed(3)}
                      </td>
                    </tr>

                    {/* Runtime */}
                    <tr className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="p-2.5">Runtime (s)</td>
                      <td className="p-2.5 font-mono text-cyan-400 font-semibold">
                        {orToolsMetrics.runtime.toFixed(2)}s
                      </td>
                      <td className="p-2.5 font-mono text-slate-300">
                        {qpsoMetrics.runtime.toFixed(2)}s
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: VEHICLE-WISE COST & FLEET BREAKDOWN */}
            {activeSideTab === 'fleet' && (
              <div className="p-3 space-y-2.5 max-h-[300px] overflow-y-auto">
                {activeRoutes.map((route) => (
                  <div
                    key={`fleet-card-${route.vehicleId}`}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: route.color,
                            boxShadow: `0 0 8px ${route.color}`
                          }}
                        />
                        <span className="text-xs font-mono font-bold text-white">
                          Vehicle {route.vehicleId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {route.path.length - 2} stops
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-300 pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block text-[8px]">DIST</span>
                        <span>{route.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px]">TIME</span>
                        <span>{route.time.toFixed(1)} m</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[8px]">LOAD</span>
                        <span className="text-[#00FF9D]">{route.load}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-500/5 border-t border-slate-800/80 text-center">
            <span className="text-[10px] text-[#00FF9D] font-bold uppercase tracking-wider font-mono">
              QPSO yields 9.32% Better Efficiency
            </span>
          </div>
        </div>
      </div>

      {/* 3. "4. TRAFFIC IMPACT & RE-OPTIMIZATION" - PIXEL-PERFECT REPLICATION OF TARGET SCREENSHOT */}
      <div id="section-traffic-impact" className="space-y-3 pt-2">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
          4. TRAFFIC IMPACT & RE-OPTIMIZATION
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr,auto,1fr] items-center gap-3">
          {/* CARD A: BEFORE TRAFFIC (Base Scenario) */}
          <div
            id="box-a-before-traffic"
            className="bg-[#0B0F19] rounded-xl border border-emerald-500/60 overflow-hidden shadow-lg flex flex-col justify-between"
          >
            {/* Header */}
            <div className="py-2 px-3 border-b border-emerald-900/60 bg-emerald-950/20 text-center">
              <span className="text-[11px] font-mono font-semibold text-emerald-400 tracking-wide">
                A. BEFORE TRAFFIC (Base Scenario)
              </span>
            </div>

            {/* Content: Mini Graph + Metrics */}
            <div className="p-3 flex flex-row items-center justify-between gap-3">
              <MiniNetworkGraph
                nodes={nodes}
                routes={baseRoutes}
                edges={edges}
              />

              <div className="flex-1 flex flex-col justify-center space-y-2 border-l border-emerald-900/40 pl-3">
                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Distance</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.beforeMetrics.distance.toFixed(2)} km
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Time</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.beforeMetrics.time.toFixed(2)} min
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Avg Congestion</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.beforeMetrics.congestion.toFixed(3)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Fitness</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.beforeMetrics.fitness.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="py-2 px-3 border-t border-emerald-900/60 bg-emerald-950/20 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-medium text-emerald-400">
                Route Status: Optimal
              </span>
            </div>
          </div>

          {/* Connector Arrow 1 */}
          <div className="hidden lg:flex justify-center text-[#00A3FF]">
            <ArrowRight className="w-6 h-6 flex-shrink-0" />
          </div>

          {/* CARD B: TRAFFIC INJECTED */}
          <div
            id="box-b-traffic-injected"
            className="bg-[#0B0F19] rounded-xl border border-rose-500/60 overflow-hidden shadow-lg flex flex-col justify-between"
          >
            {/* Header */}
            <div className="py-2 px-3 border-b border-rose-900/60 bg-rose-950/20 text-center">
              <span className="text-[11px] font-mono font-semibold text-[#FF3366] tracking-wide">
                B. TRAFFIC INJECTED
              </span>
            </div>

            {/* Content: Mini Graph with highlighted red shock + Impact Metrics */}
            <div className="p-3 flex flex-row items-center justify-between gap-3">
              <MiniNetworkGraph
                nodes={nodes}
                routes={baseRoutes}
                highlightEdge={trafficData.affectedRoad}
                isAlert={true}
                edges={edges}
              />

              <div className="flex-1 flex flex-col justify-center space-y-1.5 border-l border-rose-900/40 pl-3">
                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Affected Road</div>
                  <div className="text-sm font-mono text-white font-bold tracking-wide">
                    {trafficData.affectedRoad[0]} → {trafficData.affectedRoad[1]}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Congestion Change</div>
                  <div className="text-sm font-mono text-[#FF3366] font-bold tracking-tight">
                    {trafficData.congestionBefore.toFixed(2)} → {trafficData.congestionAfter.toFixed(2)}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    Impact on Old Route
                  </div>
                  <div className="space-y-0.5 mt-0.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-[#FF3366]">
                      <span className="text-slate-400">Time</span>
                      <span className="font-bold">+{trafficData.impactOnOldRoute.timePercent.toFixed(2)}% ↑</span>
                    </div>
                    <div className="flex justify-between items-center text-[#FF3366]">
                      <span className="text-slate-400">Congestion</span>
                      <span className="font-bold">+{trafficData.impactOnOldRoute.congestionPercent.toFixed(2)}% ↑</span>
                    </div>
                    <div className="flex justify-between items-center text-[#FF3366]">
                      <span className="text-slate-400">Fitness</span>
                      <span className="font-bold">+{trafficData.impactOnOldRoute.fitnessPercent.toFixed(2)}% ↑</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="py-2 px-3 border-t border-rose-900/60 bg-rose-950/20 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF3366]" />
              <span className="text-xs font-mono font-medium text-[#FF3366]">
                Traffic Status: High
              </span>
            </div>
          </div>

          {/* Connector Arrow 2 */}
          <div className="hidden lg:flex justify-center text-[#00A3FF]">
            <ArrowRight className="w-6 h-6 flex-shrink-0" />
          </div>

          {/* CARD C: AFTER RE-OPTIMIZATION (QPSO) */}
          <div
            id="box-c-after-reoptimization"
            className="bg-[#0B0F19] rounded-xl border border-emerald-500/60 overflow-hidden shadow-lg flex flex-col justify-between"
          >
            {/* Header */}
            <div className="py-2 px-3 border-b border-emerald-900/60 bg-emerald-950/20 text-center">
              <span className="text-[11px] font-mono font-semibold text-emerald-400 tracking-wide">
                C. AFTER RE-OPTIMIZATION (QPSO)
              </span>
            </div>

            {/* Content: Mini Graph with rerouted bypass + New Metrics */}
            <div className="p-3 flex flex-row items-center justify-between gap-3">
              <MiniNetworkGraph
                nodes={nodes}
                routes={reoptimizedRoutes}
                edges={edges}
              />

              <div className="flex-1 flex flex-col justify-center space-y-2 border-l border-emerald-900/40 pl-3">
                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Distance</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.afterMetrics.distance.toFixed(2)} km
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Time</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.afterMetrics.time.toFixed(2)} min
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Avg Congestion</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.afterMetrics.congestion.toFixed(3)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-sans">Fitness</div>
                  <div className="text-base sm:text-lg font-mono text-white font-bold tracking-tight">
                    {trafficData.afterMetrics.fitness.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="py-2 px-3 border-t border-emerald-900/60 bg-emerald-950/20 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-medium text-emerald-400">
                Route Status: Re-optimized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
