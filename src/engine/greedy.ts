/**
 * Stage 1c: Budgeted maximum coverage using greedy set cover heuristic.
 * Selects micro-forest plots with highest marginal residents covered per rupee.
 */

import { LAKH } from './config';
import { type Grid, type Plot, type PickRecord } from './types';

export interface GreedyResult {
  readonly selectedPlots: Plot[];
  readonly picks: PickRecord[];
  readonly finalCoveredHomes: Set<number>;
}

/**
 * Executes budgeted greedy set cover to choose micro-forest planting plots.
 * Iteratively picks the plot with highest newly covered residents per rupee, then compares with single best.
 */
export function budgetedGreedyCover(
  grid: Grid,
  plots: Plot[],
  budgetLakh: number,
  initialCoveredHomes: Set<number>
): GreedyResult {
  const totalBudget = budgetLakh * LAKH;
  let remainingBudget = totalBudget;
  const currentCoveredHomes = new Set<number>(initialCoveredHomes);

  let cumResidents = 0;
  for (const h of initialCoveredHomes) {
    cumResidents += grid.population[h];
  }
  const startingResidents = cumResidents;

  const selectedPlots: Plot[] = [];
  const selectedIds = new Set<number>();
  const picks: PickRecord[] = [];
  let cumCost = 0;

  while (true) {
    let bestPlot: Plot | null = null;
    let bestRatio = -1;
    let bestNewResidents = 0;

    for (const plot of plots) {
      if (selectedIds.has(plot.id)) continue;
      if (plot.cost > remainingBudget) continue;

      let newResidents = 0;
      for (const homeIdx of plot.coveredHomes) {
        if (!currentCoveredHomes.has(homeIdx)) {
          newResidents += grid.population[homeIdx];
        }
      }

      if (newResidents <= 0) continue;

      const ratio = newResidents / plot.cost;
      if (ratio > bestRatio || (ratio === bestRatio && bestPlot && plot.id < bestPlot.id)) {
        bestRatio = ratio;
        bestNewResidents = newResidents;
        bestPlot = plot;
      }
    }

    if (!bestPlot || bestNewResidents <= 0) {
      break;
    }

    selectedIds.add(bestPlot.id);
    selectedPlots.push(bestPlot);
    remainingBudget -= bestPlot.cost;
    cumCost += bestPlot.cost;
    cumResidents += bestNewResidents;

    for (const homeIdx of bestPlot.coveredHomes) {
      currentCoveredHomes.add(homeIdx);
    }

    picks.push({
      plotId: bestPlot.id,
      newlyCoveredResidents: bestNewResidents,
      cost: bestPlot.cost,
      ratio: bestRatio,
      cumResidents,
      cumCost,
    });
  }

  // Compare with the single best affordable plot to avoid tiny-plot trap
  let singleBestPlot: Plot | null = null;
  let singleBestGain = -1;

  for (const plot of plots) {
    if (plot.cost > totalBudget) continue;
    let gain = 0;
    for (const homeIdx of plot.coveredHomes) {
      if (!initialCoveredHomes.has(homeIdx)) {
        gain += grid.population[homeIdx];
      }
    }
    if (gain > singleBestGain || (gain === singleBestGain && singleBestPlot && plot.id < singleBestPlot.id)) {
      singleBestGain = gain;
      singleBestPlot = plot;
    }
  }

  const greedyGain = cumResidents - startingResidents;
  if (singleBestPlot && singleBestGain > greedyGain) {
    // Single plot outperforms greedy combination
    const singleSet = new Set<number>(initialCoveredHomes);
    for (const h of singleBestPlot.coveredHomes) {
      singleSet.add(h);
    }

    return {
      selectedPlots: [singleBestPlot],
      picks: [
        {
          plotId: singleBestPlot.id,
          newlyCoveredResidents: singleBestGain,
          cost: singleBestPlot.cost,
          ratio: singleBestGain / singleBestPlot.cost,
          cumResidents: startingResidents + singleBestGain,
          cumCost: singleBestPlot.cost,
        },
      ],
      finalCoveredHomes: singleSet,
    };
  }

  return {
    selectedPlots,
    picks,
    finalCoveredHomes: currentCoveredHomes,
  };
}
