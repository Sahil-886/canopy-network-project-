/**
 * Master engine orchestrator executing the 3-stage CanopyNet optimization pipeline.
 * Runs BFS, budgeted greedy cover, knapsack DP, Dijkstra, Kruskal, Prim, and connectivity analysis.
 */

import { findVacantPlots } from './plots';
import { computePlotCoverage, computeInitialParkCoverage } from './coverage';
import { budgetedGreedyCover } from './greedy';
import { allocateSpeciesKnapsack } from './knapsack';
import { computeAllCorridorPaths } from './dijkstra';
import { kruskalMST } from './kruskal';
import { primMSTCost } from './prim';
import { computeSharedCorridors } from './corridors';
import { analyzeConnectivity } from './connectivity';
import { runBaseline, computeEqualCoverageCost } from './baseline';
import {
  type Grid,
  type Params,
  type PipelineResult,
  type Metrics,
  type TimingsMs,
  LandType,
} from './types';

/**
 * Runs the end-to-end urban forestry optimization pipeline on a city grid.
 * Executes and benchmarks all algorithmic phases, comparing results against an unoptimized baseline.
 */
export function runPipeline(city: Grid, params: Params): PipelineResult {
  const tStart = performance.now();

  // Stage 1a: Identify plantable vacant plots via BFS flood fill
  const t0 = performance.now();
  const rawPlots = findVacantPlots(city, params.density);
  const tPlots = performance.now() - t0;

  // Stage 1b: Compute spatial reach from each plot to residential homes
  const t1 = performance.now();
  const plots = computePlotCoverage(city, rawPlots, params.radiusM);
  const initialCoveredHomes = computeInitialParkCoverage(city, params.radiusM);
  const tCoverage = performance.now() - t1;

  // Stage 1c: Select plots under budget using budgeted greedy set cover
  const t2 = performance.now();
  const greedyRes = budgetedGreedyCover(city, plots, params.budgetLakh, initialCoveredHomes);
  const tGreedy = performance.now() - t2;

  // Stage 2a: Allocate native species per chosen forest using 0/1 knapsack DP
  const t3 = performance.now();
  const allocations = greedyRes.selectedPlots.map((plot) =>
    allocateSpeciesKnapsack(plot, params.density)
  );
  const tKnapsack = performance.now() - t3;

  // Stage 3a: Compute least-resistance corridors between forests with Dijkstra
  const t4 = performance.now();
  const allEdges = computeAllCorridorPaths(city, greedyRes.selectedPlots);
  const tDijkstra = performance.now() - t4;

  // Stage 3b: Build Minimum Spanning Tree with Kruskal's algorithm
  const t5 = performance.now();
  const plotIds = greedyRes.selectedPlots.map((p) => p.id);
  const kruskalRes = kruskalMST(plotIds, allEdges);
  const tKruskal = performance.now() - t5;

  // Stage 3c: Cross-check MST cost with simple O(V²) Prim's algorithm
  const t6 = performance.now();
  const primTotalCost = primMSTCost(plotIds, allEdges);
  const tPrim = performance.now() - t6;

  // Stage 3d: Consolidate shared corridor paths using Set
  const t7 = performance.now();
  const sharedCorridor = computeSharedCorridors(city, kruskalRes.mstEdges);
  const tCorridors = performance.now() - t7;

  // Stage 3e: Analyze habitat connectivity under the wildlife travel limit
  const t8 = performance.now();
  const connectivityRes = analyzeConnectivity(
    greedyRes.selectedPlots,
    allEdges,
    kruskalRes.mstEdges,
    params.travelLimitM
  );
  const tConnectivity = performance.now() - t8;

  // Stage 4: Run unoptimized baseline and equal-coverage search
  const t9 = performance.now();
  const baselineRes = runBaseline(
    city,
    plots,
    params.budgetLakh,
    initialCoveredHomes,
    params.density
  );
  const tBaseline = performance.now() - t9;

  // Calculate live district metrics for the optimized plan
  let totalPop = 0;
  let coveredBefore = 0;
  let coveredAfter = 0;

  for (let i = 0; i < city.population.length; i++) {
    const pop = city.population[i];
    totalPop += pop;
    if (initialCoveredHomes.has(i)) coveredBefore += pop;
    if (greedyRes.finalCoveredHomes.has(i)) coveredAfter += pop;
  }

  let totalPlantedArea = 0;
  let totalCost = 0;
  for (const p of greedyRes.selectedPlots) {
    totalPlantedArea += p.areaM2;
    totalCost += p.cost;
  }

  let totalSaplings = 0;
  let totalBiodiversity = 0;
  const distinctSpecies = new Set<string>();
  const distinctLayers = new Set<string>();

  for (const alloc of allocations) {
    for (const [name, count] of Object.entries(alloc.saplingsPerSpecies)) {
      if (count > 0) distinctSpecies.add(name);
    }
    for (const p of alloc.packs) {
      distinctLayers.add(p.species.layer);
    }
    totalSaplings += alloc.packs.reduce((acc, p) => acc + p.saplings, 0);
    totalBiodiversity += alloc.biodiversityScore;
  }

  const totalDistrictAreaM2 = city.width * city.height * 625;
  let parkAreaM2 = 0;
  for (let i = 0; i < city.land.length; i++) {
    if (city.land[i] === LandType.PARK) parkAreaM2 += 625;
  }

  const greenCoverPctBefore = (parkAreaM2 / totalDistrictAreaM2) * 100;
  const greenCoverPctAfter = ((parkAreaM2 + totalPlantedArea) / totalDistrictAreaM2) * 100;

  const metrics: Metrics = {
    totalResidents: totalPop,
    coveredBefore,
    coveredAfter,
    coveragePctBefore: totalPop > 0 ? (coveredBefore / totalPop) * 100 : 0,
    coveragePctAfter: totalPop > 0 ? (coveredAfter / totalPop) * 100 : 0,
    plotsSelected: greedyRes.selectedPlots.length,
    plantedAreaM2: totalPlantedArea,
    totalCost,
    budgetLakh: params.budgetLakh,
    totalSaplings,
    totalBiodiversity,
    speciesCount: distinctSpecies.size,
    layersCovered: distinctLayers.size,
    mstCost: kruskalRes.totalCost,
    primCost: primTotalCost,
    corridorLengthBeforeM: sharedCorridor.lengthBeforeM,
    corridorLengthAfterM: sharedCorridor.lengthAfterM,
    roadCellsCrossed: sharedCorridor.roadCellsCrossed,
    groupsCount: connectivityRes.numGroups,
    greenCoverPctBefore,
    greenCoverPctAfter,
  };

  const equalCoverage = computeEqualCoverageCost(
    city,
    plots,
    params.budgetLakh,
    coveredAfter,
    initialCoveredHomes,
    params.density
  );

  const tTotal = performance.now() - tStart;

  const timingsMs: TimingsMs = {
    plots: tPlots,
    coverage: tCoverage,
    greedy: tGreedy,
    knapsack: tKnapsack,
    dijkstra: tDijkstra,
    kruskal: tKruskal,
    prim: tPrim,
    corridors: tCorridors,
    connectivity: tConnectivity,
    baseline: tBaseline,
    total: tTotal,
  };

  return {
    grid: city,
    plots,
    picks: greedyRes.picks,
    selectedPlots: greedyRes.selectedPlots,
    allocations,
    allEdges,
    mstEdges: connectivityRes.annotatedMstEdges,
    primTotalCost,
    sharedCorridor,
    groups: connectivityRes.groups,
    metrics,
    baseline: baselineRes.metrics,
    timingsMs,
    initialCoveredHomes,
    finalCoveredHomes: greedyRes.finalCoveredHomes,
    baselineCoveredHomes: baselineRes.coveredHomes,
    equalCoverage,
  };
}
