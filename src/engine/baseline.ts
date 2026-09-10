/**
 * Baseline comparison engine implementing naive non-optimized urban forestry.
 * Selects largest plots first, splits species budgets equally, and builds zero corridors.
 */

import { LAKH, SPECIES_LIST } from './config';
import { mergeSort } from './mergeSort';
import { type Grid, type Plot, type Metrics, type SpeciesAllocation } from './types';

export interface BaselineResult {
  readonly selectedPlots: Plot[];
  readonly allocations: SpeciesAllocation[];
  readonly coveredHomes: Set<number>;
  readonly metrics: Metrics;
}

/**
 * Executes naive unoptimized baseline on the same city and budget.
 * Merge-sorts plots by area descending, allocates species uniformly, and creates no corridors.
 */
export function runBaseline(
  grid: Grid,
  plots: ReadonlyArray<Plot>,
  budgetLakh: number,
  initialCoveredHomes: Set<number>,
  _density: number = 3
): BaselineResult {
  const totalBudget = budgetLakh * LAKH;
  let remainingBudget = totalBudget;

  // Sort candidate plots by area descending using merge sort
  const sortedPlots = mergeSort(plots, (a, b) => {
    if (b.areaM2 !== a.areaM2) return b.areaM2 - a.areaM2;
    return a.id - b.id;
  });

  const selectedPlots: Plot[] = [];
  let totalCost = 0;
  let totalPlantedArea = 0;

  for (const plot of sortedPlots) {
    if (plot.cost <= remainingBudget) {
      selectedPlots.push(plot);
      remainingBudget -= plot.cost;
      totalCost += plot.cost;
      totalPlantedArea += plot.areaM2;
    }
  }

  // Calculate covered homes
  const coveredHomes = new Set<number>(initialCoveredHomes);
  for (const plot of selectedPlots) {
    for (const h of plot.coveredHomes) {
      coveredHomes.add(h);
    }
  }

  // Calculate residents
  let totalPop = 0;
  let coveredBefore = 0;
  let coveredAfter = 0;

  for (let i = 0; i < grid.population.length; i++) {
    const pop = grid.population[i];
    totalPop += pop;
    if (initialCoveredHomes.has(i)) coveredBefore += pop;
    if (coveredHomes.has(i)) coveredAfter += pop;
  }

  // Uniform species allocation: divide sapling budget equally across all 12 species
  const allocations: SpeciesAllocation[] = [];
  let totalSaplings = 0;
  let totalBiodiversity = 0;

  for (const plot of selectedPlots) {
    const budgetPerSpecies = plot.saplingBudget / SPECIES_LIST.length;
    const saplingsPerSpecies: Record<string, number> = {};
    let plotSaplings = 0;
    let plotBio = 0;

    for (const sp of SPECIES_LIST) {
      const count = Math.max(1, Math.floor(budgetPerSpecies / sp.saplingPrice));
      saplingsPerSpecies[sp.name] = count;
      plotSaplings += count;
      plotBio += count * sp.ecoWeight;
    }

    allocations.push({
      plotId: plot.id,
      packs: [],
      saplingsPerSpecies,
      cost: plot.saplingBudget,
      biodiversityScore: plotBio,
      speciesCount: SPECIES_LIST.length,
      layersCovered: 4,
    });

    totalSaplings += plotSaplings;
    totalBiodiversity += plotBio;
  }

  const totalDistrictAreaM2 = grid.width * grid.height * 625;
  let parkAreaM2 = 0;
  for (let i = 0; i < grid.land.length; i++) {
    if (grid.land[i] === 4) parkAreaM2 += 625;
  }

  const greenCoverPctBefore = (parkAreaM2 / totalDistrictAreaM2) * 100;
  const greenCoverPctAfter = ((parkAreaM2 + totalPlantedArea) / totalDistrictAreaM2) * 100;

  const metrics: Metrics = {
    totalResidents: totalPop,
    coveredBefore,
    coveredAfter,
    coveragePctBefore: totalPop > 0 ? (coveredBefore / totalPop) * 100 : 0,
    coveragePctAfter: totalPop > 0 ? (coveredAfter / totalPop) * 100 : 0,
    plotsSelected: selectedPlots.length,
    plantedAreaM2: totalPlantedArea,
    totalCost,
    budgetLakh,
    totalSaplings,
    totalBiodiversity,
    speciesCount: SPECIES_LIST.length,
    layersCovered: 4,
    mstCost: 0,
    primCost: 0,
    corridorLengthBeforeM: 0,
    corridorLengthAfterM: 0,
    roadCellsCrossed: 0,
    groupsCount: selectedPlots.length, // Each forest isolated in its own group
    greenCoverPctBefore,
    greenCoverPctAfter,
  };

  return {
    selectedPlots,
    allocations,
    coveredHomes,
    metrics,
  };
}

/**
 * Computes the additional budget required by baseline to reach optimized coverage.
 * Iteratively raises the baseline budget in 1-lakh increments until parity is achieved.
 */
export function computeEqualCoverageCost(
  grid: Grid,
  plots: ReadonlyArray<Plot>,
  initialBudgetLakh: number,
  targetCoveredResidents: number,
  initialCoveredHomes: Set<number>,
  _density: number = 3
): { extraSpendLakh: number; finalBudgetLakh: number } | null {
  const sortedPlots = mergeSort(plots, (a, b) => {
    if (b.areaM2 !== a.areaM2) return b.areaM2 - a.areaM2;
    return a.id - b.id;
  });

  const maxBudgetLakh = initialBudgetLakh * 5;

  for (let b = initialBudgetLakh; b <= maxBudgetLakh; b += 1) {
    let rem = b * LAKH;
    const covered = new Set<number>(initialCoveredHomes);

    for (const plot of sortedPlots) {
      if (plot.cost <= rem) {
        rem -= plot.cost;
        for (const h of plot.coveredHomes) {
          covered.add(h);
        }
      }
    }

    let coveredResidents = 0;
    for (const h of covered) {
      coveredResidents += grid.population[h];
    }

    if (coveredResidents >= targetCoveredResidents) {
      return {
        extraSpendLakh: b - initialBudgetLakh,
        finalBudgetLakh: b,
      };
    }
  }

  return null;
}
