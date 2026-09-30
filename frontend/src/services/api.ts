import {
  BackendRunScenarioResponse,
  BackendInjectTrafficResponse,
  BackendBenchmarkResponse,
  AlgorithmMetrics,
  BackendRouteData,
  ConvergencePoint
} from '../types';
import {
  BASE_QPSO_METRICS,
  BASE_OR_TOOLS_METRICS,
  TRAFFIC_IMPACT_DATA,
  BENCHMARK_RUNS
} from '../data/mockData';
import { getRouteRealMapCoords, calculateRouteRoadDistanceKm } from '../utils/delhiCoordinates';

const PROD_BACKEND_URL = 'https://quantum-vpr-backend-496528007942.us-central1.run.app';

let apiBaseUrl =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.')
    ? PROD_BACKEND_URL
    : 'http://localhost:8000');

export const getApiBaseUrl = (): string => apiBaseUrl;
export const setApiBaseUrl = (url: string): void => {
  apiBaseUrl = url.replace(/\/$/, '');
};

/**
 * Check whether FastAPI backend at localhost:8000 is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiBaseUrl.startsWith('http://localhost')) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${apiBaseUrl}/docs`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.status < 500;
  } catch {
    return false;
  }
}

/**
 * Trigger POST /api/run-scenario
 */
export async function runScenarioApi(options?: {
  scenario?: string;
  customers?: number;
  vehicles?: number;
  dataset?: string;
}): Promise<{
  data: BackendRunScenarioResponse;
  source: 'backend' | 'offline_fallback';
}> {
  const customerCount = Math.max(1, Math.min(100, options?.customers || 20));
  const vehicleCount = Math.max(1, Math.min(10, options?.vehicles || 3));
  const dataset = options?.dataset || 'Synthetic Graph';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${apiBaseUrl}/api/run-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: options?.scenario || 'Base Scenario',
        customers: customerCount,
        num_customers: customerCount,
        vehicles: vehicleCount,
        dataset: dataset
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return { data: json, source: 'backend' };
    }
  } catch (err) {
    console.warn('FastAPI backend offline or unavailable. Using dynamic data fallback.', err);
  }

  // Dynamic fallback partitioned strictly for the exact customer count (1..N, max 100)
  const nodeIds = Array.from({ length: customerCount }, (_, i) => i + 1);
  const qpsoRoutes: number[][] = [];
  const chunkSize = Math.ceil(nodeIds.length / vehicleCount);

  for (let v = 0; v < vehicleCount; v++) {
    const slice = nodeIds.slice(v * chunkSize, (v + 1) * chunkSize);
    if (slice.length > 0) {
      qpsoRoutes.push([0, ...slice, 0]);
    } else {
      qpsoRoutes.push([0, 0]);
    }
  }

  const routesData: BackendRouteData[] = qpsoRoutes.map((seq, idx) => {
    const realDist = calculateRouteRoadDistanceKm(seq);
    return {
      vehicle_id: idx + 1,
      vehicleId: idx + 1,
      name: `Vehicle ${idx + 1}`,
      sequence: seq,
      path: seq,
      real_map_coords: getRouteRealMapCoords(seq),
      distance: realDist,
      time: Number((realDist * 1.85).toFixed(1)),
      load: Math.min(100, seq.length * 12)
    };
  });

  const totalDist = Number(routesData.reduce((acc, r) => acc + (r.distance || 0), 0).toFixed(2));
  const totalTime = Number((totalDist * 1.85).toFixed(1));

  const dynamicQpsoMetrics: AlgorithmMetrics = {
    fitness: Number((0.36 + (customerCount / 100) * 0.08).toFixed(3)),
    distance: totalDist,
    time: totalTime,
    congestion: Number((0.25 + (customerCount / 100) * 0.08).toFixed(3)),
    runtime: Number((0.25 + (customerCount / 100) * 0.20).toFixed(2))
  };

  const dynamicOrToolsMetrics: AlgorithmMetrics = {
    fitness: Number((dynamicQpsoMetrics.fitness * 1.10).toFixed(3)),
    distance: Number((totalDist * 1.055).toFixed(2)),
    time: Number((totalTime * 1.061).toFixed(1)),
    congestion: Number((dynamicQpsoMetrics.congestion * 1.18).toFixed(3)),
    runtime: 0.12
  };

  const dynamicConvergence: ConvergencePoint[] = [
    { iteration: 0, qpso: 0.90, ortools: 0.92 },
    { iteration: 10, qpso: Number((0.76 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.85 },
    { iteration: 20, qpso: Number((0.65 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.78 },
    { iteration: 40, qpso: Number((0.50 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.68 },
    { iteration: 60, qpso: Number((0.45 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.61 },
    { iteration: 100, qpso: Number((0.432 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.53 },
    { iteration: 150, qpso: Number((0.429 * (dynamicQpsoMetrics.fitness / 0.428)).toFixed(3)), ortools: 0.49 },
    { iteration: 200, qpso: dynamicQpsoMetrics.fitness, ortools: dynamicOrToolsMetrics.fitness }
  ];

  return {
    data: {
      status: 'success',
      routes: routesData,
      QPSO_routes: qpsoRoutes,
      real_map_coords: routesData.map((r) => r.real_map_coords || []),
      QPSO_metrics: dynamicQpsoMetrics,
      OR_Tools_metrics: dynamicOrToolsMetrics,
      convergence_data: dynamicConvergence
    },
    source: 'offline_fallback'
  };
}

/**
 * Trigger POST /api/inject-traffic
 */
export async function injectTrafficApi(params?: {
  edge?: [number, number];
  congestion?: number;
}): Promise<{
  data: BackendInjectTrafficResponse;
  source: 'backend' | 'offline_fallback';
}> {
  const edge = params?.edge || [6, 7];
  const congestion = params?.congestion ?? 0.90;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${apiBaseUrl}/api/inject-traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edge: edge,
        congestion: congestion
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return { data: json, source: 'backend' };
    }
  } catch (err) {
    console.warn('FastAPI backend offline or unavailable. Using dynamic traffic data.', err);
  }

  // Graceful Traffic Fallback with Delhi Map Coords
  const fallbackRoutes = [
    [0, 10, 9, 5, 3, 4, 0],
    [0, 24, 21, 8, 2, 1, 11, 12, 22, 23, 13, 0],
    [0, 15, 14, 16, 18, 19, 20, 17, 0]
  ];

  const routesWithCoords: BackendRouteData[] = fallbackRoutes.map((seq, idx) => ({
    vehicle_id: idx + 1,
    vehicleId: idx + 1,
    name: `Vehicle ${idx + 1}`,
    sequence: seq,
    path: seq,
    real_map_coords: getRouteRealMapCoords(seq),
    distance: Number((28 + seq.length * 5.1).toFixed(2)),
    time: Number((50 + seq.length * 8.6).toFixed(1)),
    load: Math.min(100, seq.length * 13)
  }));

  return {
    data: {
      status: 'traffic_injected',
      message: `Congestion updated on edge ${edge[0]}->${edge[1]} (0.20 -> ${congestion.toFixed(2)})`,
      new_routes: fallbackRoutes,
      routes: routesWithCoords,
      new_metrics: {
        ...TRAFFIC_IMPACT_DATA.afterMetrics,
        congestion: Number((0.31 + (congestion - 0.20) * 0.15).toFixed(3)),
        fitness: Number((0.428 + (congestion - 0.20) * 0.12).toFixed(3))
      }
    },
    source: 'offline_fallback'
  };
}

/**
 * Trigger POST /api/run-benchmark
 */
export async function runBenchmarkApi(options?: {
  runs?: number;
}): Promise<{
  data: BackendBenchmarkResponse;
  source: 'backend' | 'offline_fallback';
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${apiBaseUrl}/api/run-benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runs: options?.runs || 10
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      return { data: json, source: 'backend' };
    }
  } catch (err) {
    console.warn('FastAPI backend offline or unavailable. Using benchmark dataset.', err);
  }

  return {
    data: {
      status: 'success',
      benchmark_data: {
        runs: [...BENCHMARK_RUNS]
      }
    },
    source: 'offline_fallback'
  };
}
