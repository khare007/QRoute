import {
  GraphNode,
  GraphEdge,
  VehicleRoute,
  AlgorithmMetrics,
  BenchmarkRun,
  BenchmarkSummaryItem,
  ScenarioInfo,
  TrafficImpactData,
  ConvergencePoint,
  DistributionPoint,
  ScalabilityPoint,
  ImprovementMetricPoint
} from '../types';

export const DEFAULT_SCENARIO_INFO: ScenarioInfo = {
  name: 'Base Scenario',
  dataset: 'Synthetic Graph',
  nodes: 25,
  customers: 20,
  vehicles: 3,
  vehicleCapacity: 100,
  depot: 0,
  trafficLevel: 'Moderate',
  edgeCount: 62
};

export const BASE_QPSO_METRICS: AlgorithmMetrics = {
  fitness: 0.428,
  distance: 124.76,
  time: 238.21,
  congestion: 0.312,
  runtime: 2.81
};

export const BASE_OR_TOOLS_METRICS: AlgorithmMetrics = {
  fitness: 0.472,
  distance: 131.58,
  time: 252.73,
  congestion: 0.371,
  runtime: 1.87
};

export const TRAFFIC_IMPACT_DATA: TrafficImpactData = {
  affectedRoad: [6, 7],
  congestionBefore: 0.20,
  congestionAfter: 0.90,
  impactOnOldRoute: {
    timePercent: 24.31,
    congestionPercent: 81.25,
    fitnessPercent: 21.08
  },
  beforeMetrics: {
    fitness: 0.428,
    distance: 124.76,
    time: 238.21,
    congestion: 0.312,
    runtime: 2.81
  },
  injectedMetrics: {
    fitness: 0.518,
    distance: 124.76,
    time: 296.12,
    congestion: 0.565,
    runtime: 2.81
  },
  afterMetrics: {
    fitness: 0.439,
    distance: 128.15,
    time: 246.18,
    congestion: 0.335,
    runtime: 2.94
  },
  afterOrToolsMetrics: {
    fitness: 0.488,
    distance: 133.79,
    time: 257.92,
    congestion: 0.384,
    runtime: 1.96
  }
};

// Graph Nodes with coordinates scaled for SVG canvas (600 x 420 viewBox)
export const GRAPH_NODES: GraphNode[] = [
  { id: 0, label: '0', x: 290, y: 195, demand: 0, isDepot: true },
  { id: 1, label: '1', x: 145, y: 225, demand: 12 },
  { id: 2, label: '2', x: 155, y: 290, demand: 15 },
  { id: 3, label: '3', x: 220, y: 70, demand: 10 },
  { id: 4, label: '4', x: 260, y: 90, demand: 18 },
  { id: 5, label: '5', x: 215, y: 120, demand: 14 },
  { id: 6, label: '6', x: 285, y: 135, demand: 16 },
  { id: 7, label: '7', x: 270, y: 270, demand: 12 },
  { id: 8, label: '8', x: 210, y: 355, demand: 20 },
  { id: 9, label: '9', x: 190, y: 145, demand: 15 },
  { id: 10, label: '10', x: 240, y: 215, demand: 8 },
  { id: 11, label: '11', x: 185, y: 255, demand: 14 },
  { id: 12, label: '12', x: 330, y: 365, demand: 16 },
  { id: 13, label: '13', x: 360, y: 215, demand: 11 },
  { id: 14, label: '14', x: 345, y: 55, demand: 19 },
  { id: 15, label: '15', x: 330, y: 115, demand: 13 },
  { id: 16, label: '16', x: 400, y: 85, demand: 15 },
  { id: 17, label: '17', x: 405, y: 250, demand: 17 },
  { id: 18, label: '18', x: 425, y: 120, demand: 14 },
  { id: 19, label: '19', x: 460, y: 160, demand: 12 },
  { id: 20, label: '20', x: 445, y: 205, demand: 18 },
  { id: 21, label: '21', x: 265, y: 340, demand: 10 },
  { id: 22, label: '22', x: 380, y: 350, demand: 13 },
  { id: 23, label: '23', x: 420, y: 300, demand: 9 },
  { id: 24, label: '24', x: 320, y: 300, demand: 11 }
];

// 62 Graph Edges defining the road network
export const GRAPH_EDGES: GraphEdge[] = [
  // Core connections from Depot
  { from: 0, to: 6, distance: 8.2, congestion: 0.25 },
  { from: 0, to: 7, distance: 9.1, congestion: 0.20 },
  { from: 0, to: 10, distance: 6.4, congestion: 0.18 },
  { from: 0, to: 13, distance: 8.5, congestion: 0.22 },
  { from: 0, to: 15, distance: 9.8, congestion: 0.30 },
  { from: 0, to: 24, distance: 11.2, congestion: 0.28 },

  // Cluster 1 (Left / Vehicle 1)
  { from: 10, to: 11, distance: 6.5, congestion: 0.21 },
  { from: 11, to: 2, distance: 7.8, congestion: 0.19 },
  { from: 2, to: 8, distance: 10.4, congestion: 0.22 },
  { from: 11, to: 1, distance: 8.1, congestion: 0.24 },
  { from: 1, to: 9, distance: 7.2, congestion: 0.20 },
  { from: 9, to: 5, distance: 6.9, congestion: 0.18 },
  { from: 5, to: 3, distance: 7.4, congestion: 0.15 },
  { from: 3, to: 4, distance: 5.6, congestion: 0.17 },
  { from: 4, to: 6, distance: 6.2, congestion: 0.23 },
  { from: 5, to: 6, distance: 7.1, congestion: 0.26 },
  { from: 9, to: 10, distance: 8.9, congestion: 0.31 },
  { from: 1, to: 2, distance: 9.3, congestion: 0.27 },
  { from: 8, to: 7, distance: 11.5, congestion: 0.35 },

  // Cluster 2 (Bottom / Vehicle 2)
  { from: 7, to: 21, distance: 7.9, congestion: 0.20 },
  { from: 21, to: 8, distance: 8.4, congestion: 0.25 },
  { from: 21, to: 12, distance: 6.8, congestion: 0.22 },
  { from: 12, to: 22, distance: 7.5, congestion: 0.21 },
  { from: 22, to: 23, distance: 8.1, congestion: 0.24 },
  { from: 23, to: 17, distance: 7.0, congestion: 0.26 },
  { from: 17, to: 13, distance: 8.2, congestion: 0.23 },
  { from: 7, to: 24, distance: 6.7, congestion: 0.19 },
  { from: 24, to: 12, distance: 8.9, congestion: 0.28 },
  { from: 24, to: 13, distance: 9.4, congestion: 0.25 },

  // The critical road affected by injected traffic:
  { from: 6, to: 7, distance: 14.1, congestion: 0.20 },

  // Cluster 3 (Upper Right / Vehicle 3)
  { from: 6, to: 15, distance: 6.5, congestion: 0.22 },
  { from: 15, to: 14, distance: 8.0, congestion: 0.19 },
  { from: 14, to: 16, distance: 7.6, congestion: 0.21 },
  { from: 16, to: 18, distance: 6.8, congestion: 0.24 },
  { from: 18, to: 19, distance: 7.2, congestion: 0.23 },
  { from: 19, to: 20, distance: 6.5, congestion: 0.20 },
  { from: 20, to: 17, distance: 8.4, congestion: 0.27 },
  { from: 15, to: 18, distance: 10.2, congestion: 0.32 },
  { from: 13, to: 20, distance: 9.5, congestion: 0.29 },

  // Cross-grid supporting edges (background network)
  { from: 4, to: 14, distance: 11.8, congestion: 0.28 },
  { from: 3, to: 9, distance: 8.3, congestion: 0.24 },
  { from: 10, to: 7, distance: 8.7, congestion: 0.33 },
  { from: 16, to: 19, distance: 9.9, congestion: 0.31 },
  { from: 2, to: 21, distance: 12.1, congestion: 0.35 },
  { from: 22, to: 17, distance: 10.5, congestion: 0.29 },
  { from: 14, to: 6, distance: 9.2, congestion: 0.26 },
  { from: 18, to: 20, distance: 8.8, congestion: 0.25 },
  { from: 10, to: 24, distance: 11.4, congestion: 0.34 },
  { from: 15, to: 16, distance: 9.1, congestion: 0.27 },
  { from: 24, to: 22, distance: 9.8, congestion: 0.30 },
  { from: 21, to: 24, distance: 7.2, congestion: 0.22 },
  { from: 5, to: 10, distance: 9.6, congestion: 0.28 },
  { from: 1, to: 8, distance: 14.3, congestion: 0.36 },
  { from: 12, to: 23, distance: 11.0, congestion: 0.32 },
  { from: 20, to: 23, distance: 10.2, congestion: 0.30 },
  { from: 9, to: 4, distance: 11.0, congestion: 0.31 },
  { from: 15, to: 13, distance: 11.5, congestion: 0.33 },
  { from: 7, to: 13, distance: 12.0, congestion: 0.32 },
  { from: 17, to: 12, distance: 13.4, congestion: 0.34 },
  { from: 8, to: 12, distance: 14.8, congestion: 0.37 },
  { from: 19, to: 17, distance: 11.6, congestion: 0.29 },
  { from: 16, to: 20, distance: 13.2, congestion: 0.35 }
];

// Base optimized routes for the 3 vehicles
export const BASE_VEHICLE_ROUTES: VehicleRoute[] = [
  {
    vehicleId: 1,
    name: 'Vehicle 1',
    color: '#00A3FF', // Neon Blue
    path: [0, 10, 11, 2, 8, 1, 9, 5, 3, 4, 6, 0],
    distance: 42.15,
    time: 78.40,
    load: 83
  },
  {
    vehicleId: 2,
    name: 'Vehicle 2',
    color: '#F59E0B', // Vibrant Orange / Gold
    path: [0, 7, 21, 12, 22, 23, 17, 13, 0],
    distance: 39.85,
    time: 74.31,
    load: 76
  },
  {
    vehicleId: 3,
    name: 'Vehicle 3',
    color: '#A855F7', // Bright Purple
    path: [0, 6, 15, 14, 16, 18, 19, 20, 0],
    distance: 42.76,
    time: 85.50,
    load: 91
  }
];

// Re-optimized routes after road 6->7 traffic injection
export const REOPTIMIZED_VEHICLE_ROUTES: VehicleRoute[] = [
  {
    vehicleId: 1,
    name: 'Vehicle 1',
    color: '#00A3FF',
    path: [0, 10, 9, 5, 3, 4, 6, 0],
    distance: 38.90,
    time: 75.10,
    load: 63
  },
  {
    vehicleId: 2,
    name: 'Vehicle 2',
    color: '#F59E0B',
    path: [0, 24, 21, 8, 2, 1, 11, 12, 22, 23, 13, 0],
    distance: 46.20,
    time: 86.88,
    load: 96
  },
  {
    vehicleId: 3,
    name: 'Vehicle 3',
    color: '#A855F7',
    path: [0, 15, 14, 16, 18, 19, 20, 17, 0],
    distance: 43.05,
    time: 84.20,
    load: 91
  }
];

// Benchmark summary items (Top row of Benchmark View)
export const BENCHMARK_SUMMARY_ITEMS: BenchmarkSummaryItem[] = [
  {
    id: 'fitness',
    title: 'Fitness Score',
    qpsoVal: 0.428,
    qpsoStd: 0.032,
    ortoolsVal: 0.472,
    ortoolsStd: 0.045,
    improvementPercent: 9.32
  },
  {
    id: 'distance',
    title: 'Total Distance',
    unit: 'km',
    qpsoVal: 124.76,
    qpsoStd: 6.21,
    ortoolsVal: 131.58,
    ortoolsStd: 7.14,
    improvementPercent: 5.18
  },
  {
    id: 'time',
    title: 'Total Time',
    unit: 'min',
    qpsoVal: 238.21,
    qpsoStd: 11.37,
    ortoolsVal: 252.73,
    ortoolsStd: 13.52,
    improvementPercent: 5.74
  },
  {
    id: 'congestion',
    title: 'Avg Congestion',
    qpsoVal: 0.312,
    qpsoStd: 0.041,
    ortoolsVal: 0.371,
    ortoolsStd: 0.053,
    improvementPercent: 15.88
  },
  {
    id: 'runtime',
    title: 'Runtime',
    unit: 'sec',
    qpsoVal: 3.02,
    qpsoStd: 0.81,
    ortoolsVal: 1.87,
    ortoolsStd: 0.42,
    improvementPercent: -61.50, // slower
    isRuntime: true
  }
];

// Detailed 10 runs for the table
export const BENCHMARK_RUNS: BenchmarkRun[] = [
  {
    run_id: 1,
    seed: 42,
    QPSO: { fitness: 0.412, distance: 119.84, time: 229.11, congestion: 0.298, runtime: 2.45 },
    OR_Tools: { fitness: 0.462, distance: 127.21, time: 246.31, congestion: 0.356, runtime: 1.72 },
    winner: 'QPSO',
    improvement: '10.82%'
  },
  {
    run_id: 2,
    seed: 101,
    QPSO: { fitness: 0.451, distance: 126.73, time: 241.27, congestion: 0.315, runtime: 3.22 },
    OR_Tools: { fitness: 0.488, distance: 133.19, time: 255.84, congestion: 0.384, runtime: 2.01 },
    winner: 'QPSO',
    improvement: '7.58%'
  },
  {
    run_id: 3,
    seed: 203,
    QPSO: { fitness: 0.405, distance: 118.92, time: 226.58, congestion: 0.281, runtime: 2.71 },
    OR_Tools: { fitness: 0.456, distance: 124.55, time: 238.76, congestion: 0.342, runtime: 1.69 },
    winner: 'QPSO',
    improvement: '11.18%'
  },
  {
    run_id: 4,
    seed: 314,
    QPSO: { fitness: 0.439, distance: 123.45, time: 236.80, congestion: 0.327, runtime: 3.18 },
    OR_Tools: { fitness: 0.483, distance: 132.41, time: 254.92, congestion: 0.392, runtime: 1.95 },
    winner: 'QPSO',
    improvement: '9.11%'
  },
  {
    run_id: 5,
    seed: 405,
    QPSO: { fitness: 0.421, distance: 121.36, time: 233.12, congestion: 0.303, runtime: 2.68 },
    OR_Tools: { fitness: 0.469, distance: 129.12, time: 249.64, congestion: 0.360, runtime: 1.84 },
    winner: 'QPSO',
    improvement: '10.23%'
  },
  {
    run_id: 6,
    seed: 512,
    QPSO: { fitness: 0.432, distance: 125.10, time: 239.40, congestion: 0.318, runtime: 2.95 },
    OR_Tools: { fitness: 0.475, distance: 131.90, time: 253.10, congestion: 0.375, runtime: 1.88 },
    winner: 'QPSO',
    improvement: '9.05%'
  },
  {
    run_id: 7,
    seed: 628,
    QPSO: { fitness: 0.418, distance: 122.50, time: 234.20, congestion: 0.301, runtime: 2.84 },
    OR_Tools: { fitness: 0.465, distance: 128.80, time: 248.50, congestion: 0.364, runtime: 1.78 },
    winner: 'QPSO',
    improvement: '10.11%'
  },
  {
    run_id: 8,
    seed: 719,
    QPSO: { fitness: 0.444, distance: 127.80, time: 243.60, congestion: 0.329, runtime: 3.40 },
    OR_Tools: { fitness: 0.480, distance: 134.20, time: 256.40, congestion: 0.380, runtime: 1.92 },
    winner: 'QPSO',
    improvement: '7.50%'
  },
  {
    run_id: 9,
    seed: 888,
    QPSO: { fitness: 0.425, distance: 124.00, time: 237.10, congestion: 0.310, runtime: 2.80 },
    OR_Tools: { fitness: 0.468, distance: 130.60, time: 251.20, congestion: 0.368, runtime: 1.85 },
    winner: 'QPSO',
    improvement: '9.19%'
  },
  {
    run_id: 10,
    seed: 999,
    QPSO: { fitness: 0.413, distance: 120.90, time: 230.90, congestion: 0.297, runtime: 2.92 },
    OR_Tools: { fitness: 0.474, distance: 132.80, time: 254.70, congestion: 0.378, runtime: 1.94 },
    winner: 'QPSO',
    improvement: '12.87%'
  }
];

// Chart 1: Convergence data (Fitness vs Iteration)
export const CONVERGENCE_DATA: ConvergencePoint[] = [
  { iteration: 0, qpso: 0.90, ortools: 0.92 },
  { iteration: 10, qpso: 0.76, ortools: 0.85 },
  { iteration: 20, qpso: 0.65, ortools: 0.78 },
  { iteration: 30, qpso: 0.57, ortools: 0.72 },
  { iteration: 40, qpso: 0.50, ortools: 0.68 },
  { iteration: 50, qpso: 0.47, ortools: 0.64 },
  { iteration: 60, qpso: 0.45, ortools: 0.61 },
  { iteration: 80, qpso: 0.438, ortools: 0.57 },
  { iteration: 100, qpso: 0.432, ortools: 0.53 },
  { iteration: 120, qpso: 0.430, ortools: 0.51 },
  { iteration: 140, qpso: 0.429, ortools: 0.495 },
  { iteration: 160, qpso: 0.428, ortools: 0.485 },
  { iteration: 180, qpso: 0.428, ortools: 0.478 },
  { iteration: 200, qpso: 0.428, ortools: 0.472 }
];

// Chart 2: Fitness distribution (Bell curve points)
export const FITNESS_DISTRIBUTION_DATA: DistributionPoint[] = [
  { score: 0.30, qpso: 0.1, ortools: 0.0 },
  { score: 0.34, qpso: 0.6, ortools: 0.0 },
  { score: 0.37, qpso: 2.8, ortools: 0.1 },
  { score: 0.40, qpso: 9.5, ortools: 0.5 },
  { score: 0.42, qpso: 14.8, ortools: 1.8 },
  { score: 0.43, qpso: 15.2, ortools: 3.5 },
  { score: 0.44, qpso: 12.6, ortools: 5.9 },
  { score: 0.46, qpso: 4.8, ortools: 11.8 },
  { score: 0.47, qpso: 2.1, ortools: 14.6 },
  { score: 0.48, qpso: 0.8, ortools: 13.9 },
  { score: 0.50, qpso: 0.2, ortools: 8.5 },
  { score: 0.53, qpso: 0.0, ortools: 2.4 },
  { score: 0.56, qpso: 0.0, ortools: 0.4 },
  { score: 0.60, qpso: 0.0, ortools: 0.0 }
];

// Chart 3: Runtime vs Customers
export const SCALABILITY_DATA: ScalabilityPoint[] = [
  { customers: 10, qpso: 1.2, ortools: 0.6 },
  { customers: 20, qpso: 2.8, ortools: 1.8 },
  { customers: 30, qpso: 4.1, ortools: 2.6 },
  { customers: 40, qpso: 5.2, ortools: 3.5 },
  { customers: 50, qpso: 6.4, ortools: 4.3 },
  { customers: 75, qpso: 7.8, ortools: 5.4 },
  { customers: 100, qpso: 9.6, ortools: 6.9 }
];

// Chart 4: Improvement (%)
export const IMPROVEMENT_DATA: ImprovementMetricPoint[] = [
  { metric: 'Fitness', improvement: 9.32 },
  { metric: 'Distance', improvement: 5.18 },
  { metric: 'Time', improvement: 5.74 },
  { metric: 'Congestion', improvement: 15.88 }
];
