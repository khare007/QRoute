import {
  BackendRunScenarioResponse,
  BackendInjectTrafficResponse,
  BackendBenchmarkResponse,
  AlgorithmMetrics
} from '../types';
import {
  BASE_QPSO_METRICS,
  BASE_OR_TOOLS_METRICS,
  TRAFFIC_IMPACT_DATA,
  BENCHMARK_RUNS
} from '../data/mockData';

let apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getApiBaseUrl = (): string => apiBaseUrl;
export const setApiBaseUrl = (url: string): void => {
  apiBaseUrl = url.replace(/\/$/, '');
};

/**
 * Check whether FastAPI backend at localhost:8000 is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  // If running in a remote cloud preview over HTTPS, browsers block requests to http://localhost
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
}): Promise<{
  data: BackendRunScenarioResponse;
  source: 'backend' | 'offline_fallback';
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${apiBaseUrl}/api/run-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: options?.scenario || 'Base Scenario',
        num_customers: options?.customers || 20,
        customers: options?.customers || 20,
        vehicles: options?.vehicles || 3
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const sanitizeMetrics = (m: any, defaultBase: AlgorithmMetrics): AlgorithmMetrics => ({
        fitness: Number(m?.fitness ?? defaultBase.fitness),
        distance: Number(m?.distance ?? defaultBase.distance),
        time: Number(m?.time ?? ((m?.distance ?? defaultBase.distance) * 0.45)),
        congestion: Number(m?.congestion ?? defaultBase.congestion),
        runtime: Number(m?.runtime ?? defaultBase.runtime)
      });

      if (json.QPSO_metrics) {
        json.QPSO_metrics = sanitizeMetrics(json.QPSO_metrics, BASE_QPSO_METRICS);
      }
      if (json.OR_Tools_metrics) {
        json.OR_Tools_metrics = sanitizeMetrics(json.OR_Tools_metrics, BASE_OR_TOOLS_METRICS);
      }
      if (json.new_metrics) {
        json.new_metrics = sanitizeMetrics(json.new_metrics, BASE_QPSO_METRICS);
      }

      return { data: json, source: 'backend' };
    }
  } catch (err) {
    console.warn('FastAPI backend offline or unavailable. Using high-fidelity demo fallback.', err);
  }

  // Graceful Demo Fallback
  return {
    data: {
      status: 'success',
      QPSO_routes: [
        [0, 10, 11, 2, 8, 1, 9, 5, 3, 4, 6, 0],
        [0, 7, 21, 12, 22, 23, 17, 13, 0],
        [0, 6, 15, 14, 16, 18, 19, 20, 0]
      ],
      QPSO_metrics: { ...BASE_QPSO_METRICS },
      OR_Tools_metrics: { ...BASE_OR_TOOLS_METRICS },
      convergence_data: [0.90, 0.75, 0.60, 0.50, 0.45, 0.428]
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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${apiBaseUrl}/api/inject-traffic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edge: params?.edge || [6, 7],
        congestion: params?.congestion ?? 0.90
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      const sanitizeMetrics = (m: any, defaultBase: AlgorithmMetrics): AlgorithmMetrics => ({
        fitness: Number(m?.fitness ?? defaultBase.fitness),
        distance: Number(m?.distance ?? defaultBase.distance),
        time: Number(m?.time ?? ((m?.distance ?? defaultBase.distance) * 0.45)),
        congestion: Number(m?.congestion ?? defaultBase.congestion),
        runtime: Number(m?.runtime ?? defaultBase.runtime)
      });

      if (json.new_metrics) {
        json.new_metrics = sanitizeMetrics(json.new_metrics, BASE_QPSO_METRICS);
      }

      return { data: json, source: 'backend' };
    }
  } catch (err) {
    console.warn('FastAPI backend offline or unavailable. Using high-fidelity demo fallback.', err);
  }

  // Graceful Demo Fallback
  return {
    data: {
      status: 'traffic_injected',
      message: 'Congestion updated on edge 6->7 (0.20 -> 0.90)',
      new_routes: [
        [0, 10, 9, 5, 3, 4, 6, 0],
        [0, 24, 21, 8, 2, 1, 11, 12, 22, 23, 13, 0],
        [0, 15, 14, 16, 18, 19, 20, 17, 0]
      ],
      new_metrics: { ...TRAFFIC_IMPACT_DATA.afterMetrics }
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
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
    console.warn('FastAPI backend offline or unavailable. Using high-fidelity demo fallback.', err);
  }

  // Graceful Demo Fallback
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
