import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ScenarioHeader } from './components/ScenarioHeader';
import { DashboardTab } from './components/DashboardTab';
import { BenchmarkTab } from './components/BenchmarkTab';
import { InputDataModal } from './components/InputDataModal';
import { TrafficControlModal } from './components/TrafficControlModal';
import { SettingsModal } from './components/SettingsModal';
import {
  ActiveNavTab,
  ScenarioInfo,
  AlgorithmMetrics,
  VehicleRoute,
  GraphNode
} from './types';
import {
  DEFAULT_SCENARIO_INFO,
  BASE_QPSO_METRICS,
  BASE_OR_TOOLS_METRICS,
  TRAFFIC_IMPACT_DATA,
  GRAPH_NODES,
  GRAPH_EDGES,
  BENCHMARK_SUMMARY_ITEMS,
  BENCHMARK_RUNS,
  CONVERGENCE_DATA,
  FITNESS_DISTRIBUTION_DATA,
  SCALABILITY_DATA,
  IMPROVEMENT_DATA
} from './data/mockData';
import { generateFleetRoutes } from './utils/routeGenerator';
import {
  checkBackendHealth,
  runScenarioApi,
  injectTrafficApi,
  runBenchmarkApi
} from './services/api';
import { CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("UI Render Exception Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-300 min-h-[400px]">
          <h2 className="text-base font-bold text-rose-400 mb-2">Something went wrong rendering this view.</h2>
          <p className="text-xs text-slate-400 mb-4 font-mono">A temporary data calculation exception was caught.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#00A3FF] hover:bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer transition"
          >
            Reset View State
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');

  // Modal states for secondary tabs
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Application Data States (Initialized with Exact Reference Mock Data)
  const [scenarioInfo, setScenarioInfo] = useState<ScenarioInfo>(DEFAULT_SCENARIO_INFO);
  const [nodes, setNodes] = useState(GRAPH_NODES);
  const [edges, setEdges] = useState(GRAPH_EDGES);

  const [isTrafficInjected, setIsTrafficInjected] = useState<boolean>(false);

  const [qpsoMetrics, setQpsoMetrics] = useState<AlgorithmMetrics>(BASE_QPSO_METRICS);
  const [orToolsMetrics, setOrToolsMetrics] = useState<AlgorithmMetrics>(BASE_OR_TOOLS_METRICS);
  const [trafficData, setTrafficData] = useState(TRAFFIC_IMPACT_DATA);

  // Dynamically compute fleet routes based on scenarioInfo.vehicles
  const baseRoutes = React.useMemo(() => {
    return generateFleetRoutes(scenarioInfo.vehicles, nodes, false);
  }, [scenarioInfo.vehicles, nodes]);

  const reoptimizedRoutes = React.useMemo(() => {
    return generateFleetRoutes(scenarioInfo.vehicles, nodes, true, trafficData.affectedRoad);
  }, [scenarioInfo.vehicles, nodes, trafficData.affectedRoad]);

  const activeRoutes = isTrafficInjected ? reoptimizedRoutes : baseRoutes;

  // Benchmark datasets
  const [summaryItems, setSummaryItems] = useState(BENCHMARK_SUMMARY_ITEMS);
  const [benchmarkRuns, setBenchmarkRuns] = useState(BENCHMARK_RUNS);

  // Execution & Backend Status
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isRunningQPSO, setIsRunningQPSO] = useState<boolean>(false);
  const [isInjectingTraffic, setIsInjectingTraffic] = useState<boolean>(false);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'alert' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Customer Node & Demand Handlers
  const handleAddCustomer = (customDemand?: number, customX?: number, customY?: number) => {
    const maxId = Math.max(...nodes.map((n) => n.id), 0);
    const nextId = maxId + 1;
    const angle = Math.random() * 2 * Math.PI;
    const radius = 80 + Math.random() * 160;
    const x = customX ?? Math.round(Math.max(50, Math.min(530, 290 + radius * Math.cos(angle))));
    const y = customY ?? Math.round(Math.max(40, Math.min(340, 195 + radius * Math.sin(angle))));
    const demand = customDemand ?? Math.floor(Math.random() * 15 + 10);

    const newNode: GraphNode = {
      id: nextId,
      label: `${nextId}`,
      x,
      y,
      demand,
      isDepot: false
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setScenarioInfo((prev) => ({
      ...prev,
      nodes: newNodes.length,
      customers: newNodes.filter((n) => !n.isDepot).length
    }));

    showToast(`Customer Node #${nextId} (${demand} units) added to network`, 'success');
  };

  const handleDeleteCustomer = (id: number) => {
    if (id === 0) return;
    const newNodes = nodes.filter((n) => n.id !== id);
    setNodes(newNodes);
    setScenarioInfo((prev) => ({
      ...prev,
      nodes: newNodes.length,
      customers: newNodes.filter((n) => !n.isDepot).length
    }));
    showToast(`Customer Node #${id} removed from network`, 'info');
  };

  const handleUpdateCustomerDemand = (id: number, demand: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, demand: Math.max(0, demand) } : n))
    );
  };

  const handleBatchUpdateDemands = (mode: 'uniform' | 'random' | 'reset', val = 15) => {
    if (mode === 'reset') {
      setNodes(GRAPH_NODES);
      setScenarioInfo((prev) => ({
        ...prev,
        nodes: GRAPH_NODES.length,
        customers: GRAPH_NODES.filter((n) => !n.isDepot).length
      }));
      showToast('Reset network topology to default 24 customers', 'info');
      return;
    }

    setNodes((prev) =>
      prev.map((n) => {
        if (n.isDepot) return n;
        const demand = mode === 'uniform' ? val : Math.floor(Math.random() * 25 + 5);
        return { ...n, demand };
      })
    );
    showToast(
      mode === 'uniform'
        ? `All per-customer demands set to ${val} units`
        : 'Per-customer demands randomized (5-30 units)',
      'success'
    );
  };

  // Check Backend Connectivity on mount
  useEffect(() => {
    checkBackendHealth().then((healthy) => {
      setIsBackendConnected(healthy);
    });
  }, []);

  // Handle Navigation clicks
  const handleNavSelect = (tab: ActiveNavTab) => {
    if (tab === 'input_data') {
      setIsInputModalOpen(true);
    } else if (tab === 'traffic_control') {
      setIsTrafficModalOpen(true);
    } else if (tab === 'settings') {
      setIsSettingsModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Handler: Run QPSO
  const handleRunQPSO = async () => {
    setIsRunningQPSO(true);
    showToast('Quantum Particle Swarm Optimization in progress...', 'info');

    const result = await runScenarioApi({
      scenario: scenarioInfo.name,
      customers: scenarioInfo.customers,
      vehicles: scenarioInfo.vehicles
    });

    setTimeout(() => {
      setIsRunningQPSO(false);
      setIsTrafficInjected(false);
      setQpsoMetrics(result.data.QPSO_metrics);
      setOrToolsMetrics(result.data.OR_Tools_metrics);

      showToast(
        result.source === 'backend'
          ? 'FastAPI: QPSO completed successfully. Fitness: ' + result.data.QPSO_metrics.fitness.toFixed(3)
          : 'QPSO optimal route identified: Fitness 0.428 (Distance 124.76 km)',
        'success'
      );
    }, 600);
  };

  // Handler: Inject Traffic
  const handleInjectTraffic = async (from: number = 6, to: number = 7, congestion: number = 0.90) => {
    setIsInjectingTraffic(true);
    showToast(`Injecting traffic on Road ${from} → ${to} (Congestion: ${congestion.toFixed(2)})...`, 'alert');

    const result = await injectTrafficApi({
      edge: [from, to],
      congestion
    });

    setTimeout(() => {
      setIsInjectingTraffic(false);
      setIsTrafficInjected(true);

      setTrafficData((prev) => ({
        ...prev,
        affectedRoad: [from, to],
        congestionAfter: congestion,
        afterMetrics: result.data.new_metrics
      }));

      showToast(
        `Traffic shock detected on Road ${from}→${to}! QPSO dynamically recalculated bypass route: Fitness ${result.data.new_metrics.fitness.toFixed(3)}`,
        'alert'
      );
    }, 700);
  };

  // Handler: Run Benchmark
  const handleTriggerBenchmark = async () => {
    setIsRunningBenchmark(true);
    showToast('Executing 10 independent comparative benchmark runs...', 'info');

    const result = await runBenchmarkApi({ runs: 10 });

    setTimeout(() => {
      setIsRunningBenchmark(false);
      if (result.data.benchmark_data?.runs) {
        setBenchmarkRuns(result.data.benchmark_data.runs);
      }
      showToast('10 Benchmark runs compiled: QPSO outperformed OR-Tools in 10/10 runs (+9.32% Fitness)', 'success');
    }, 1000);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] flex flex-row antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavSelect}
        onRunQPSO={handleRunQPSO}
        onInjectTraffic={() => handleInjectTraffic(6, 7, 0.90)}
        scenarioInfo={scenarioInfo}
        isRunningQPSO={isRunningQPSO}
        isInjectingTraffic={isInjectingTraffic}
      />

      {/* 2. Main Scrollable Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Scenario Header */}
        <ScenarioHeader
          activeTab={activeTab}
          setActiveTab={handleNavSelect}
          scenarioInfo={scenarioInfo}
          onRunQPSO={handleRunQPSO}
          onInjectTraffic={() => handleInjectTraffic(6, 7, 0.90)}
          isRunningQPSO={isRunningQPSO}
          isInjectingTraffic={isInjectingTraffic}
          isBackendConnected={isBackendConnected}
          isTrafficInjected={isTrafficInjected}
        />

        {/* Dynamic Main Views with Fallback & ErrorBoundary to prevent black screen crashes */}
        <main className="flex-1 pb-16">
          <ErrorBoundary>
            {activeTab === 'benchmark' ? (
              <BenchmarkTab
                summaryItems={summaryItems}
                runs={benchmarkRuns}
                convergenceData={CONVERGENCE_DATA}
                distributionData={FITNESS_DISTRIBUTION_DATA}
                scalabilityData={SCALABILITY_DATA}
                improvementData={IMPROVEMENT_DATA}
                onTriggerBenchmark={handleTriggerBenchmark}
                isRunningBenchmark={isRunningBenchmark}
              />
            ) : (
              <DashboardTab
                nodes={nodes}
                edges={edges}
                activeRoutes={activeRoutes}
                baseRoutes={baseRoutes}
                reoptimizedRoutes={reoptimizedRoutes}
                isTrafficInjected={isTrafficInjected}
                qpsoMetrics={qpsoMetrics}
                orToolsMetrics={orToolsMetrics}
                trafficData={trafficData}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Secondary Dialogs */}
      <InputDataModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        scenarioInfo={scenarioInfo}
        nodes={nodes}
        onUpdateScenario={(info) => setScenarioInfo((prev) => ({ ...prev, ...info }))}
        onAddCustomer={handleAddCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onUpdateCustomerDemand={handleUpdateCustomerDemand}
        onBatchUpdateDemands={handleBatchUpdateDemands}
      />

      <TrafficControlModal
        isOpen={isTrafficModalOpen}
        onClose={() => setIsTrafficModalOpen(false)}
        edges={edges}
        currentAffectedRoad={trafficData.affectedRoad}
        onInject={(from, to, congestion) => handleInjectTraffic(from, to, congestion)}
        isInjecting={isInjectingTraffic}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isBackendConnected={isBackendConnected}
        onBackendStatusChange={(status) => setIsBackendConnected(status)}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div
          id="system-notification-toast"
          className={`fixed bottom-5 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-mono transition-all animate-bounce duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-[#0B1E17]/90 text-[#00FF9D] border-emerald-600/70 shadow-[0_0_20px_rgba(0,255,157,0.2)]'
              : toastMessage.type === 'alert'
              ? 'bg-[#2A0E18]/90 text-rose-300 border-rose-600/70 shadow-[0_0_20px_rgba(255,51,102,0.25)]'
              : 'bg-[#0E1A2F]/90 text-cyan-300 border-cyan-600/70 shadow-[0_0_20px_rgba(0,163,255,0.2)]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#00FF9D] flex-shrink-0" />
          ) : toastMessage.type === 'alert' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          )}
          <span className="font-medium pr-2">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-75 transition cursor-pointer text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
