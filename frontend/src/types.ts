export interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
  demand: number;
  name?: string;
  lat?: number;
  lon?: number;
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
  sequence?: number[];
  real_map_coords?: [number, number][];
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
  PSO?: AlgorithmMetrics;
  Classical_PSO?: AlgorithmMetrics;
  OR_Tools: AlgorithmMetrics;
  winner: 'QPSO' | 'OR-Tools' | 'Classical PSO';
  improvement: string;
}

export interface BenchmarkSummaryItem {
  id: string;
  title: string;
  unit?: string;
  qpsoVal: number;
  qpsoStd: number;
  psoVal?: number;
  psoStd?: number;
  ortoolsVal: number;
  ortoolsStd: number;
  improvementPercent: number;
  psoImprovementPercent?: number;
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
  afterPsoMetrics?: AlgorithmMetrics;
}

export interface ConvergencePoint {
  iteration: number;
  qpso: number;
  pso?: number;
  ortools: number;
}

export interface DistributionPoint {
  score: number;
  qpso: number;
  pso?: number;
  ortools: number;
}

export interface ScalabilityPoint {
  customers: number;
  qpso: number;
  pso?: number;
  ortools: number;
  nodes?: number;
  qpsoTime?: number;
  psoTime?: number;
  ortoolsTime?: number;
  qpsoFit?: number;
  psoFit?: number;
  ortoolsFit?: number;
}

export interface EmpiricalRegressionPoint {
  nodes: number;
  vehicles?: number;
  qpsoMeasured?: number;
  qpsoFitted: number;
  psoMeasured?: number;
  psoFitted: number;
  ortoolsMeasured?: number;
  ortoolsFitted: number;
  isProjected?: boolean;
  notes?: string;
}

export interface ImprovementMetricPoint {
  metric: string;
  improvement: number;
  psoImprovement?: number;
}

export type ActiveNavTab = 'dashboard' | 'benchmark' | 'input_data' | 'traffic_control' | 'settings';
export type BenchmarkSubTab = 'overview' | 'benchmark_results' | 'convergence' | 'scalability' | 'history';

export interface BackendRouteData {
  vehicle_id?: number;
  vehicleId?: number;
  name?: string;
  color?: string;
  sequence?: number[];
  path?: number[];
  real_map_coords?: [number, number][];
  distance?: number;
  time?: number;
  load?: number;
}

export interface BackendRunScenarioResponse {
  status: string;
  customers?: number;
  fleet_vehicles?: number;
  vehicle_capacity?: number;
  nodes?: {
    real_map?: Record<string, { name: string; lat: number; lon: number; demand: number }>;
    synthetic_canvas?: Record<string, { id: number; name: string; x: number; y: number; demand: number }>;
  };
  routes?: {
    sequence?: number[][];
    real_map_coords?: [number, number][][];
    ortools_sequence?: number[][];
  } | BackendRouteData[];
  QPSO_routes?: number[][];
  real_map_coords?: [number, number][][];
  QPSO_metrics?: AlgorithmMetrics;
  OR_Tools_metrics?: AlgorithmMetrics;
  metrics?: {
    qpso?: AlgorithmMetrics;
    classical_pso?: AlgorithmMetrics;
    ortools?: AlgorithmMetrics;
    [key: string]: any;
  };
  convergence_data?: (number | ConvergencePoint)[];
  scalability_data?: ScalabilityPoint[];
}

export interface BackendInjectTrafficResponse {
  status: string;
  message?: string;
  shocked_edge?: [number, number];
  shocked_road_names?: string[];
  congestion_value?: number;
  nodes?: {
    real_map?: Record<string, any>;
    synthetic_canvas?: Record<string, any>;
  };
  routes?: {
    sequence?: number[][];
    real_map_coords?: [number, number][][];
    ortools_sequence?: number[][];
  } | BackendRouteData[];
  new_routes?: (number[] | BackendRouteData)[];
  QPSO_after_shock?: {
    routes?: number[][];
    metrics?: AlgorithmMetrics;
    convergence?: number[];
  };
  OR_Tools_after_shock?: {
    metrics?: AlgorithmMetrics;
  };
  new_metrics?: AlgorithmMetrics;
  metrics_after_shock?: {
    qpso?: AlgorithmMetrics;
    classical_pso?: AlgorithmMetrics;
    ortools?: AlgorithmMetrics;
    [key: string]: any;
  };
  convergence_data?: (number | ConvergencePoint)[];
}

export interface BackendBenchmarkResponse {
  status: string;
  benchmark_summary?: Record<string, {
    fitness_mean: number;
    fitness_std: number;
    distance_mean: number;
    distance_std: number;
    congestion_mean: number;
    congestion_std: number;
    runtime_mean: number;
    runtime_std: number;
    display_fitness?: string;
    display_distance?: string;
    display_runtime?: string;
  }>;
  benchmark_data?: {
    runs?: BenchmarkRun[];
    summary?: BenchmarkSummaryItem[];
    convergence?: ConvergencePoint[];
    scalability?: ScalabilityPoint[];
  };
  runs?: BenchmarkRun[];
  summary?: BenchmarkSummaryItem[];
  convergence_data?: (number | ConvergencePoint)[];
  scalability_data?: ScalabilityPoint[];
}
