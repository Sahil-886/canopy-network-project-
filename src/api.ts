/**
 * API client connecting the React frontend to the Python FastAPI backend.
 * Features automatic server detection and seamless client-side TypeScript fallback.
 */

import type { Grid, Params, PipelineResult } from './engine/types';
import { runPipeline } from './engine';
import { generateCity } from './engine/city';

export const API_BASE_URL = 'http://localhost:8001';

export interface BackendStatus {
  online: boolean;
  engine: string;
  url: string;
}

/** Probes the FastAPI server health endpoint. */
export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        engine: data.engine || 'Python FastAPI',
        url: API_BASE_URL,
      };
    }
  } catch {
    // Server is unreachable or offline
  }

  return {
    online: false,
    engine: 'In-Browser TypeScript',
    url: '',
  };
}

/**
 * Executes optimization via Python FastAPI if available, or falls back to
 * the client-side TypeScript engine.
 */
export async function executeOptimization(
  params: Params,
  customGrid?: Grid | null,
  forceClientSide = false
): Promise<{ result: PipelineResult; usedBackend: boolean }> {
  if (!forceClientSide) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const payload: any = {
        params: {
          seed: params.seed,
          budgetLakh: params.budgetLakh,
          radiusM: params.radiusM,
          travelLimitM: params.travelLimitM,
          density: params.density,
          width: params.width,
          height: params.height,
        },
      };

      if (customGrid) {
        payload.customGrid = {
          width: customGrid.width,
          height: customGrid.height,
          land: Array.from(customGrid.land),
          population: Array.from(customGrid.population),
        };
      }

      const res = await fetch(`${API_BASE_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const raw = await res.json();
        const typedGrid: Grid = {
          width: raw.grid.width,
          height: raw.grid.height,
          land: new Uint8Array(raw.grid.land),
          population: new Uint16Array(raw.grid.population),
        };
        const r = runPipeline(typedGrid, params);
        return { result: r, usedBackend: true };
      }
    } catch {
      // Fallback to client-side TypeScript execution
    }
  }

  // Pure client-side execution fallback
  const city = customGrid || generateCity(params.seed, params.width, params.height);
  const r = runPipeline(city, params);
  return { result: r, usedBackend: false };
}
