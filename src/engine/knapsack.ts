/**
 * Stage 2a: Species mix selection using the classic 0/1 knapsack dynamic programming algorithm.
 * Allocates native species packs within budget to maximize multi-layer biodiversity.
 */

import { SPECIES_LIST } from './config';
import { type Plot, type Species, type SpeciesPack, type SpeciesAllocation } from './types';

/**
 * Solves 0/1 knapsack to select species packs for a micro-forest patch.
 * Maximizes ecological value with diminishing returns for repeat packs within the sapling budget.
 */
export function allocateSpeciesKnapsack(
  plot: Plot,
  density: number = 3,
  speciesList: ReadonlyArray<Species> = SPECIES_LIST
): SpeciesAllocation {
  const targetSaplings = Math.round(plot.areaM2 * density);
  const packSaplings = Math.max(1, Math.round(targetSaplings / 12));

  // Build 3 packs per species with diminishing returns: x10, x6, x3
  const packs: SpeciesPack[] = [];
  const multipliers = [10, 6, 3];

  for (const sp of speciesList) {
    for (let p = 0; p < 3; p++) {
      const cost = packSaplings * sp.saplingPrice;
      const value = sp.ecoWeight * multipliers[p];
      packs.push({
        species: sp,
        packIndex: p,
        saplings: packSaplings,
        cost,
        value,
      });
    }
  }

  // Scale capacity to ensure W <= 1,000 for fast dynamic programming
  const rawBudget = plot.saplingBudget;
  const unitSize = rawBudget > 1000 ? Math.ceil(rawBudget / 1000) : 1;
  const W = Math.min(1000, Math.floor(rawBudget / unitSize));

  const N = packs.length;
  const weights = packs.map((p) => Math.max(1, Math.round(p.cost / unitSize)));
  const values = packs.map((p) => p.value);

  // Fill classic DP table: dp[i][w]
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Int32Array(W + 1) as unknown as number[]);

  for (let i = 1; i <= N; i++) {
    const wt = weights[i - 1];
    const val = values[i - 1];
    for (let w = 0; w <= W; w++) {
      if (wt <= w) {
        const take = dp[i - 1][w - wt] + val;
        dp[i][w] = take > dp[i - 1][w] ? take : dp[i - 1][w];
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to identify selected packs
  let currW = W;
  const chosenPacks: SpeciesPack[] = [];

  for (let i = N; i >= 1; i--) {
    if (dp[i][currW] !== dp[i - 1][currW]) {
      const chosen = packs[i - 1];
      chosenPacks.push(chosen);
      currW -= weights[i - 1];
    }
  }

  chosenPacks.reverse();

  // Aggregate results per species and layer
  const saplingsPerSpecies: Record<string, number> = {};
  const layersSeen = new Set<string>();
  let totalCost = 0;
  let biodiversityScore = 0;

  for (const p of chosenPacks) {
    saplingsPerSpecies[p.species.name] = (saplingsPerSpecies[p.species.name] ?? 0) + p.saplings;
    layersSeen.add(p.species.layer);
    totalCost += p.cost;
    biodiversityScore += p.value;
  }

  return {
    plotId: plot.id,
    packs: chosenPacks,
    saplingsPerSpecies,
    cost: totalCost,
    biodiversityScore,
    speciesCount: Object.keys(saplingsPerSpecies).length,
    layersCovered: layersSeen.size,
  };
}

/**
 * Returns raw DP table for visual inspection in educational views.
 * Enables students to examine the 2D dynamic programming grid and backtrack path.
 */
export function getKnapsackTable(
  plot: Plot,
  density: number = 3,
  speciesList: ReadonlyArray<Species> = SPECIES_LIST
): { dp: number[][]; weights: number[]; values: number[]; packs: SpeciesPack[]; W: number } {
  const targetSaplings = Math.round(plot.areaM2 * density);
  const packSaplings = Math.max(1, Math.round(targetSaplings / 12));

  const packs: SpeciesPack[] = [];
  const multipliers = [10, 6, 3];
  for (const sp of speciesList) {
    for (let p = 0; p < 3; p++) {
      packs.push({
        species: sp,
        packIndex: p,
        saplings: packSaplings,
        cost: packSaplings * sp.saplingPrice,
        value: sp.ecoWeight * multipliers[p],
      });
    }
  }

  const unitSize = plot.saplingBudget > 1000 ? Math.ceil(plot.saplingBudget / 1000) : 1;
  const W = Math.min(1000, Math.floor(plot.saplingBudget / unitSize));
  const N = packs.length;
  const weights = packs.map((p) => Math.max(1, Math.round(p.cost / unitSize)));
  const values = packs.map((p) => p.value);

  const dp: number[][] = Array.from({ length: N + 1 }, () => new Int32Array(W + 1) as unknown as number[]);
  for (let i = 1; i <= N; i++) {
    const wt = weights[i - 1];
    const val = values[i - 1];
    for (let w = 0; w <= W; w++) {
      if (wt <= w) {
        const take = dp[i - 1][w - wt] + val;
        dp[i][w] = take > dp[i - 1][w] ? take : dp[i - 1][w];
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return { dp, weights, values, packs, W };
}
