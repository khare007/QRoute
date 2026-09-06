export interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
  demand: number;
  isDepot?: boolean;
}

export interface GraphEdge {
  from: number;
  to: number;
  distance: number;
  congestion: number; // 0.0 - 1.0
  isCongested?: boolean;
}

export interface VehicleRoute {
  vehicleId: number;
  name: string;
  color: string;
  path: number[];
  distance: number;
  time: number;
  load: number;
}

export interface AlgorithmMetrics {
  fitness: number;
  distance: number;
  time: number;
  congestion: number;
  runtime: number;
}

export interface BenchmarkRun {
  run_id: number;
  seed?: number;
  QPSO: AlgorithmMetrics;
  OR_Tools: AlgorithmMetrics;
  winner: 'QPSO' | 'OR-Tools';
  improvement: string;
}

export interface BenchmarkSummaryItem {
  id: string;
  title: string;
  unit?: string;
  qpsoVal: number;
  qpsoStd: number;
  ortoolsVal: number;
  ortoolsStd: number;
  improvementPercent: number;
  isRuntime?: boolean;
}

export interface ScenarioInfo {
  name: string;
  dataset: string;
  nodes: number;
  customers: number;
  vehicles: number;
  vehicleCapacity: number;
  depot: number;
  trafficLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  edgeCount: number;
}

export interface TrafficImpactData {
  affectedRoad: [number, number];
  congestionBefore: number;
  congestionAfter: number;
  impactOnOldRoute: {
    timePercent: number;
    congestionPercent: number;
    fitnessPercent: number;
  };
  beforeMetrics: AlgorithmMetrics;
  injectedMetrics: AlgorithmMetrics;
  afterMetrics: AlgorithmMetrics;
  afterOrToolsMetrics: AlgorithmMetrics;
}

export interface ConvergencePoint {
  iteration: number;
  qpso: number;
  ortools: number;
}

export interface DistributionPoint {
  score: number;
  qpso: number;
  ortools: number;
}

export interface ScalabilityPoint {
  customers: number;
  qpso: number;
  ortools: number;
}

export interface ImprovementMetricPoint {
  metric: string;
  improvement: number;
}

export type ActiveNavTab = 'dashboard' | 'benchmark' | 'input_data' | 'traffic_control' | 'settings';
export type BenchmarkSubTab = 'overview' | 'benchmark_results' | 'convergence' | 'scalability' | 'history';

export interface BackendRunScenarioResponse {
  status: string;
  QPSO_routes: number[][];
  QPSO_metrics: AlgorithmMetrics;
  OR_Tools_metrics: AlgorithmMetrics;
  convergence_data?: number[];
}

export interface BackendInjectTrafficResponse {
  status: string;
  message: string;
  new_routes: number[][];
  new_metrics: AlgorithmMetrics;
}

export interface BackendBenchmarkResponse {
  status: string;
  benchmark_data: {
    runs: BenchmarkRun[];
  };
}
