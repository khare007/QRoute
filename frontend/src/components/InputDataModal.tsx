import React, { useState } from 'react';
import {
  X,
  Database,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Sparkles,
  Sliders,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GraphNode, ScenarioInfo } from '../types';

interface InputDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioInfo: ScenarioInfo;
  nodes: GraphNode[];
  onUpdateScenario: (info: Partial<ScenarioInfo>) => void;
  onAddCustomer: (demand?: number, x?: number, y?: number) => void;
  onDeleteCustomer: (id: number) => void;
  onUpdateCustomerDemand: (id: number, demand: number) => void;
  onBatchUpdateDemands: (mode: 'uniform' | 'random' | 'reset', val?: number) => void;
}

export const InputDataModal: React.FC<InputDataModalProps> = ({
  isOpen,
  onClose,
  scenarioInfo,
  nodes,
  onUpdateScenario,
  onAddCustomer,
  onDeleteCustomer,
  onUpdateCustomerDemand,
  onBatchUpdateDemands
}) => {
  const [showCustomAdd, setShowCustomAdd] = useState<boolean>(false);
  const [newDemand, setNewDemand] = useState<number>(15);
  const [newX, setNewX] = useState<number>(320);
  const [newY, setNewY] = useState<number>(220);

  if (!isOpen) return null;

  const customerNodes = nodes.filter((n) => !n.isDepot);
  const totalDemand = customerNodes.reduce((sum, n) => sum + (n.demand || 0), 0);
  const totalCapacity = scenarioInfo.vehicles * scenarioInfo.vehicleCapacity;
  const utilizationPercent = totalCapacity > 0 ? (totalDemand / totalCapacity) * 100 : 0;
  const isOverCapacity = utilizationPercent > 100;

  const nextNodeId = Math.max(...nodes.map((n) => n.id), 0) + 1;

  const handleQuickMinusCustomer = () => {
    if (customerNodes.length <= 1) return;
    const lastCustomer = customerNodes[customerNodes.length - 1];
    onDeleteCustomer(lastCustomer.id);
  };

  const handleCustomAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer(newDemand, newX, newY);
    // Reset custom inputs with slightly randomized next position
    setNewX((prev) => Math.min(500, Math.max(80, prev + Math.floor(Math.random() * 60 - 30))));
    setNewY((prev) => Math.min(340, Math.max(60, prev + Math.floor(Math.random() * 60 - 30))));
    setShowCustomAdd(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4">
      <div
        id="input-data-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/60 text-[#00A3FF] border border-blue-800/50 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Input Data & Network Topology
              </h2>
              <p className="text-xs text-slate-400">
                Configure customer nodes, per-customer demands, and fleet constraints
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

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Scenario Parameters Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Dataset / Environment
              </label>
              <input
                type="text"
                value={scenarioInfo.dataset}
                readOnly
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white"
              />
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Number of Vehicles
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">1 - 10 Fleet</span>
              </div>
              <input
                type="number"
                value={scenarioInfo.vehicles}
                min={1}
                max={10}
                onChange={(e) => onUpdateScenario({ vehicles: Math.max(1, Math.min(10, Number(e.target.value))) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white focus:border-[#00A3FF] focus:outline-none"
              />
            </div>
            <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Vehicle Capacity (Q)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Units/truck</span>
              </div>
              <input
                type="number"
                value={scenarioInfo.vehicleCapacity}
                min={20}
                max={500}
                onChange={(e) => onUpdateScenario({ vehicleCapacity: Math.max(10, Number(e.target.value)) })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white focus:border-[#00A3FF] focus:outline-none"
              />
            </div>
          </div>

          {/* Fleet Capacity vs Total Demand Summary Bar */}
          <div
            id="fleet-capacity-summary"
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isOverCapacity
                ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                : 'bg-slate-800/30 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isOverCapacity
                    ? 'bg-rose-900/40 text-rose-400 border border-rose-700/50'
                    : 'bg-emerald-950/40 text-[#00FF9D] border border-emerald-800/40'
                }`}
              >
                {isOverCapacity ? <AlertTriangle className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono text-xs">
                    Fleet Capacity Utilization:
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      isOverCapacity ? 'text-rose-400' : 'text-[#00FF9D]'
                    }`}
                  >
                    {utilizationPercent.toFixed(1)}%
                  </span>
                  {isOverCapacity && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 border border-rose-700 font-mono">
                      OVERCAPACITY
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Total Demand: <span className="font-mono text-white">{totalDemand} units</span> across{' '}
                  <span className="font-mono text-white">{customerNodes.length} customers</span> | Fleet
                  Capacity: <span className="font-mono text-white">{totalCapacity} units</span> ({scenarioInfo.vehicles} × {scenarioInfo.vehicleCapacity}Q)
                </div>
              </div>
            </div>

            <div className="w-full sm:w-44">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverCapacity ? 'bg-rose-500' : utilizationPercent > 85 ? 'bg-amber-400' : 'bg-[#00FF9D]'
                  }`}
                  style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0</span>
                <span>{Math.round(totalCapacity)} max</span>
              </div>
            </div>
          </div>

          {/* Customer Node Management & Per-Customer Demand Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                  <span>Customer Demands & Topology</span>
                  <span className="text-slate-400 font-normal">({customerNodes.length} Customers)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Edit individual per-customer demands, add new delivery nodes, or apply batch presets
                </p>
              </div>

              {/* Action Buttons: Quick Minus (-), Quick Add (+), Custom Node */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-quick-minus-customer"
                  type="button"
                  onClick={handleQuickMinusCustomer}
                  disabled={customerNodes.length <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-xs font-semibold text-rose-300 font-mono transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    customerNodes.length <= 1
                      ? 'At least 1 customer required'
                      : `Remove customer #${customerNodes[customerNodes.length - 1]?.id} (-)`
                  }
                >
                  <span className="font-bold text-sm leading-none">-</span>
                  <span>Quick Remove</span>
                </button>

                <button
                  id="btn-quick-add-customer"
                  type="button"
                  onClick={() => onAddCustomer()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF9D]/15 hover:bg-[#00FF9D]/25 border border-[#00FF9D]/40 text-xs font-semibold text-[#00FF9D] font-mono transition cursor-pointer"
                  title="Quick Add Customer (+)"
                >
                  <span className="font-bold text-sm leading-none">+</span>
                  <span>Quick Add</span>
                </button>

                <button
                  id="btn-custom-add-toggle"
                  type="button"
                  onClick={() => setShowCustomAdd(!showCustomAdd)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium font-mono transition cursor-pointer"
                >
                  <span>Custom Node</span>
                  {showCustomAdd ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Custom Customer Inline Form */}
            {showCustomAdd && (
              <form
                onSubmit={handleCustomAddSubmit}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3"
              >
                <div className="text-[11px] font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#00A3FF]" />
                  <span>Configure New Customer Node #{nextNodeId}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                      Per-Customer Demand (Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newDemand}
                      onChange={(e) => setNewDemand(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white text-xs focus:border-[#00FF9D] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                      X Coordinate (50 - 530)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={550}
                      value={newX}
                      onChange={(e) => setNewX(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white text-xs focus:border-[#00A3FF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                      Y Coordinate (40 - 350)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={360}
                      value={newY}
                      onChange={(e) => setNewY(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-white text-xs focus:border-[#00A3FF] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomAdd(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg bg-[#00A3FF] hover:bg-[#0080FF] text-white text-xs font-semibold font-mono transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Customer #{nextNodeId}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Per-Customer Preset Toolstrip */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-800/30 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">Per-Customer Presets:</span>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => onBatchUpdateDemands('uniform', 15)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  Set All to 15
                </button>
                <button
                  type="button"
                  onClick={() => onBatchUpdateDemands('uniform', 20)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  Set All to 20
                </button>
                <button
                  type="button"
                  onClick={() => onBatchUpdateDemands('random')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
                >
                  Randomize (5-30)
                </button>
                <button
                  type="button"
                  onClick={() => onBatchUpdateDemands('reset')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default 24</span>
                </button>
              </div>
            </div>

            {/* Active Nodes & Per-Customer Demand Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/70 text-slate-400 text-[11px] font-mono sticky top-0 backdrop-blur-sm z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Node ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Per-Customer Demand</th>
                    <th className="py-2.5 px-3">Coordinates (X, Y)</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {nodes.map((node) => {
                    const isDepot = node.isDepot;
                    return (
                      <tr key={node.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-white">
                          <span className="flex items-center gap-1.5">
                            {isDepot ? (
                              <span className="text-amber-400 font-bold">★ Depot {node.id}</span>
                            ) : (
                              <span>Customer {node.id}</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {isDepot ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40">
                              Central Depot
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Delivery Point</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {isDepot ? (
                            <span className="text-slate-500 text-[11px]">0 units (Origin)</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateCustomerDemand(node.id, Math.max(0, (node.demand || 0) - 1))
                                }
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-xs cursor-pointer border border-slate-700 transition"
                                title="Minus 1 unit (-)"
                              >
                                -
                              </button>
                              <input
                                id={`demand-input-${node.id}`}
                                type="number"
                                min={0}
                                max={100}
                                value={node.demand}
                                onChange={(e) =>
                                  onUpdateCustomerDemand(node.id, Math.max(0, Number(e.target.value)))
                                }
                                className="w-16 text-center bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-white text-xs font-semibold focus:border-[#00FF9D] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateCustomerDemand(node.id, Math.min(100, (node.demand || 0) + 1))
                                }
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono font-bold text-xs cursor-pointer border border-slate-700 transition"
                                title="Add 1 unit (+)"
                              >
                                +
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono ml-0.5">u</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          ({node.x}, {node.y})
                        </td>
                        <td className="py-2 px-3 text-right">
                          {isDepot ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                              <Lock className="w-3 h-3" /> Fixed
                            </span>
                          ) : (
                            <button
                              id={`delete-node-${node.id}`}
                              type="button"
                              onClick={() => onDeleteCustomer(node.id)}
                              title={`Delete / Remove Customer #${node.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800/50 transition cursor-pointer text-[11px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-800/40">
          <div className="text-[11px] text-slate-400 font-mono">
            Total active nodes: <span className="text-white font-bold">{nodes.length}</span> (1 Depot + {customerNodes.length} Customers)
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#00A3FF] hover:bg-[#0080FF] text-white text-xs font-semibold font-mono cursor-pointer transition shadow-md hover:shadow-cyan-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
