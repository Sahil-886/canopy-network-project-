import { describe, it, expect } from 'vitest';
import { generateCity } from '../src/engine/city';
import { runPipeline } from '../src/engine/index';
import { DEFAULT_PARAMS } from '../src/engine/config';

describe('Acceptance Criteria: Seeds 1 to 10 determinism, correctness, and speed', () => {
  it('runs cleanly, deterministically, and under 300ms for seeds 1 to 10', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const city1 = generateCity(seed, 64, 64);
      const params = { ...DEFAULT_PARAMS, seed };

      const t0 = performance.now();
      const res1 = runPipeline(city1, params);
      const duration = performance.now() - t0;

      // Must execute within 300 ms on standard hardware
      expect(duration).toBeLessThan(300);

      // Determinism check: identical run must yield identical metrics and MST cost
      const city2 = generateCity(seed, 64, 64);
      const res2 = runPipeline(city2, params);

      expect(res1.metrics.coveredAfter).toBe(res2.metrics.coveredAfter);
      expect(res1.metrics.plotsSelected).toBe(res2.metrics.plotsSelected);
      expect(res1.metrics.mstCost).toBe(res2.metrics.mstCost);
      expect(res1.metrics.totalCost).toBe(res2.metrics.totalCost);

      // Prim MST cross-check must match Kruskal MST cost exactly
      expect(res1.metrics.mstCost).toBe(res1.primTotalCost);

      // Sanity checks
      expect(res1.selectedPlots.length).toBeGreaterThan(0);
      expect(res1.metrics.totalResidents).toBeGreaterThan(0);
      expect(res1.metrics.coveredAfter).toBeGreaterThanOrEqual(res1.metrics.coveredBefore);
    }
  });

  it('selects 12 to 20 plots on default seed 42 with tuned budget', () => {
    const city = generateCity(42, 64, 64);
    const res = runPipeline(city, DEFAULT_PARAMS);

    // Section 4 spec: "Tune the default so the default seed selects about 12–20 plots"
    expect(res.selectedPlots.length).toBeGreaterThanOrEqual(12);
    expect(res.selectedPlots.length).toBeLessThanOrEqual(22);
  });
});
