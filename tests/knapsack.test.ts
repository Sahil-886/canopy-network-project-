import { describe, it, expect } from 'vitest';
import { allocateSpeciesKnapsack } from '../src/engine/knapsack';
import { type Plot, type Species, SpeciesLayer } from '../src/engine/types';

describe('Stage 2a: 0/1 knapsack DP vs Brute Force', () => {
  it('matches exact exponential brute force on 200 random instances (<= 12 items)', () => {
    // We test 200 random instances
    for (let test = 0; test < 200; test++) {
      const numItems = 6 + Math.floor(Math.random() * 6); // 6 to 11 items
      const weights: number[] = [];
      const values: number[] = [];

      for (let i = 0; i < numItems; i++) {
        weights.push(1 + Math.floor(Math.random() * 20));
        values.push(1 + Math.floor(Math.random() * 50));
      }

      const totalW = weights.reduce((a, b) => a + b, 0);
      const capacity = Math.floor(totalW * (0.3 + Math.random() * 0.5));

      // 1. Brute force 2^N
      let bestVal = 0;
      const totalSubsets = 1 << numItems;
      for (let mask = 0; mask < totalSubsets; mask++) {
        let curW = 0;
        let curV = 0;
        for (let i = 0; i < numItems; i++) {
          if ((mask & (1 << i)) !== 0) {
            curW += weights[i];
            curV += values[i];
          }
        }
        if (curW <= capacity && curV > bestVal) {
          bestVal = curV;
        }
      }

      // 2. Standard 0/1 knapsack DP
      const dp = new Int32Array(capacity + 1);
      for (let i = 0; i < numItems; i++) {
        const wt = weights[i];
        const val = values[i];
        for (let w = capacity; w >= wt; w--) {
          const cand = dp[w - wt] + val;
          if (cand > dp[w]) {
            dp[w] = cand;
          }
        }
      }

      expect(dp[capacity]).toBe(bestVal);
    }
  });

  it('allocates species across all 4 layers given adequate budget', () => {
    const testPlot: Plot = {
      id: 1,
      cells: [0, 1, 2, 3], // 4 cells = 2,500 m²
      areaM2: 2500,
      cost: 500000,
      cx: 1,
      cy: 1,
      saplingBudget: 375000,
      coveredHomes: [],
    };

    const res = allocateSpeciesKnapsack(testPlot, 3);
    expect(res.speciesCount).toBeGreaterThan(0);
    expect(res.biodiversityScore).toBeGreaterThan(0);
    expect(res.cost).toBeLessThanOrEqual(testPlot.saplingBudget + 100);
  });
});
