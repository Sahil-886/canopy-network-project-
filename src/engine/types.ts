/**
 * Core type definitions for the CanopyNet engine.
 * Pure TypeScript types and constants with zero DOM/React dependencies.
 */

export const LandType = {
  HOMES: 0,
  BUILDING: 1,
  ROAD: 2,
  WATER: 3,
  PARK: 4,
  VACANT: 5,
} as const;

export type LandType = (typeof LandType)[keyof typeof LandType];

export const LAND_TYPE_NAMES: Record<LandType, string> = {
  [LandType.HOMES]: 'Homes',
  [LandType.BUILDING]: 'Building',
  [LandType.ROAD]: 'Road',
  [LandType.WATER]: 'Water',
  [LandType.PARK]: 'Park',
  [LandType.VACANT]: 'Vacant',
};

export const LAND_TYPE_CSV_CODES: Record<LandType, string> = {
  [LandType.HOMES]: 'H',
  [LandType.BUILDING]: 'B',
  [LandType.ROAD]: 'R',
  [LandType.WATER]: 'W',
  [LandType.PARK]: 'P',
  [LandType.VACANT]: 'V',
};

export const CSV_CODE_TO_LAND_TYPE: Record<string, LandType> = {
  H: LandType.HOMES,
  B: LandType.BUILDING,
  R: LandType.ROAD,
  W: LandType.WATER,
  P: LandType.PARK,
  V: LandType.VACANT,
};

/** 2D grid representation stored in flat typed arrays for cache efficiency. */
export interface Grid {
  readonly width: number;
  readonly height: number;
  /** Row-major cell land types (width * height). */
  readonly land: Uint8Array;
  /** Population count per cell (meaningful for HOMES). */
  readonly population: Uint16Array;
}

/** A plantable vacant plot found via BFS. */
export interface Plot {
  readonly id: number;
  /** List of cell indices in row-major order. */
  readonly cells: number[];
  readonly areaM2: number;
  readonly cost: number;
  readonly cx: number;
  readonly cy: number;
  readonly saplingBudget: number;
  /** Indices of home cells within straight-line coverage radius. */
  readonly coveredHomes: number[];
}

/** Record of a single greedy selection step. */
export interface PickRecord {
  readonly plotId: number;
  readonly newlyCoveredResidents: number;
  readonly cost: number;
  readonly ratio: number;
  readonly cumResidents: number;
  readonly cumCost: number;
}

export const SpeciesLayer = {
  CANOPY: 'Canopy',
  TREE: 'Tree',
  SUB_TREE: 'Sub-tree',
  SHRUB: 'Shrub',
} as const;

export type SpeciesLayer = (typeof SpeciesLayer)[keyof typeof SpeciesLayer];

export interface Species {
  readonly name: string;
  readonly layer: SpeciesLayer;
  readonly saplingPrice: number;
  readonly ecoWeight: number; // 1 to 5
}

/** Single item in the 0/1 knapsack formulation representing a species pack. */
export interface SpeciesPack {
  readonly species: Species;
  readonly packIndex: number; // 0, 1, or 2
  readonly saplings: number;
  readonly cost: number;
  readonly value: number;
}

/** Species mix and biodiversity outcome for a selected micro-forest. */
export interface SpeciesAllocation {
  readonly plotId: number;
  readonly packs: SpeciesPack[];
  readonly saplingsPerSpecies: Record<string, number>;
  readonly cost: number;
  readonly biodiversityScore: number;
  readonly speciesCount: number;
  readonly layersCovered: number;
}

/** An edge in the corridor graph connecting two micro-forests. */
export interface CorridorEdge {
  readonly from: number;
  readonly to: number;
  readonly cost: number;
  readonly lengthM: number;
  readonly path: number[]; // Cell indices from source to destination
  readonly viable: boolean; // True if lengthM <= wildlife travel limit
}

/** Connected habitat component under wildlife travel limit. */
export interface Group {
  readonly id: number;
  readonly plotIds: number[];
  readonly color: string; // Okabe-Ito accessible color
}

/** Corridors with shared sections counted once via hash set. */
export interface SharedCorridor {
  readonly cellIndices: Set<number>;
  readonly lengthBeforeM: number;
  readonly lengthAfterM: number;
  readonly roadCellsCrossed: number;
}

/** Runtime metrics for one simulation pass. */
export interface Metrics {
  readonly totalResidents: number;
  readonly coveredBefore: number;
  readonly coveredAfter: number;
  readonly coveragePctBefore: number;
  readonly coveragePctAfter: number;
  readonly plotsSelected: number;
  readonly plantedAreaM2: number;
  readonly totalCost: number;
  readonly budgetLakh: number;
  readonly totalSaplings: number;
  readonly totalBiodiversity: number;
  readonly speciesCount: number;
  readonly layersCovered: number;
  readonly mstCost: number;
  readonly primCost: number;
  readonly corridorLengthBeforeM: number;
  readonly corridorLengthAfterM: number;
  readonly roadCellsCrossed: number;
  readonly groupsCount: number;
  readonly greenCoverPctBefore: number;
  readonly greenCoverPctAfter: number;
}

/** Execution duration for each algorithm step in milliseconds. */
export interface TimingsMs {
  readonly plots: number;
  readonly coverage: number;
  readonly greedy: number;
  readonly knapsack: number;
  readonly dijkstra: number;
  readonly kruskal: number;
  readonly prim: number;
  readonly corridors: number;
  readonly connectivity: number;
  readonly baseline: number;
  readonly total: number;
}

/** Pipeline run parameters. */
export interface Params {
  readonly seed: number;
  readonly budgetLakh: number;
  readonly radiusM: number;
  readonly travelLimitM: number;
  readonly density: number;
  readonly width: number;
  readonly height: number;
}

/** Complete output of runPipeline. */
export interface PipelineResult {
  readonly grid: Grid;
  readonly plots: Plot[];
  readonly picks: PickRecord[];
  readonly selectedPlots: Plot[];
  readonly allocations: SpeciesAllocation[];
  readonly allEdges: CorridorEdge[];
  readonly mstEdges: CorridorEdge[];
  readonly primTotalCost: number;
  readonly sharedCorridor: SharedCorridor;
  readonly groups: Group[];
  readonly metrics: Metrics;
  readonly baseline: Metrics;
  readonly timingsMs: TimingsMs;
  readonly initialCoveredHomes: Set<number>;
  readonly finalCoveredHomes: Set<number>;
  readonly baselineCoveredHomes: Set<number>;
  readonly equalCoverage?: {
    extraSpendLakh: number;
    finalBudgetLakh: number;
  } | null;
}
