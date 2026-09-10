/**
 * Engine configuration, model parameters, species, and defaults.
 * All algorithm parameters adhere to standard urban-forestry guidelines.
 */

import { type Params, type Species, SpeciesLayer, LandType } from './types';

/** Cell dimension in metres. */
export const CELL_SIZE_M = 25;

/** Area of one grid cell in square metres. */
export const CELL_AREA_M2 = CELL_SIZE_M * CELL_SIZE_M; // 625 m²

/** Default grid side length in cells. */
export const DEFAULT_GRID_SIZE = 64;

/** Land site preparation cost per m² (₹). Illustrative placeholder. */
export const PREP_COST_PER_M2 = 80;

/** Average native sapling purchase price (₹). Illustrative placeholder. */
export const AVG_SAPLING_PRICE = 100;

/** 1 lakh = 100,000 ₹. */
export const LAKH = 100_000;

/** Default population assigned to painted or imported home cells. */
export const DEFAULT_HOME_POPULATION = 60;

/**
 * Multiplier for entering a cell of a given land type.
 * Moves proceed 4-directionally (up, down, left, right).
 * Homes and buildings are impassable barriers.
 */
export const CELL_COST_MULTIPLIER: Record<LandType, number> = {
  [LandType.HOMES]: Infinity,
  [LandType.BUILDING]: Infinity,
  [LandType.ROAD]: 8,
  [LandType.WATER]: 20,
  [LandType.PARK]: 1,
  [LandType.VACANT]: 1,
};

/**
 * 12 illustrative native species, exactly 3 per canopy layer.
 * Prices and ecological weights (1 to 5) to be validated by a botanist.
 */
export const SPECIES_LIST: ReadonlyArray<Species> = [
  // Canopy layer
  { name: 'Banyan', layer: SpeciesLayer.CANOPY, saplingPrice: 150, ecoWeight: 5 },
  { name: 'Peepal', layer: SpeciesLayer.CANOPY, saplingPrice: 130, ecoWeight: 5 },
  { name: 'Arjun', layer: SpeciesLayer.CANOPY, saplingPrice: 120, ecoWeight: 4 },
  // Tree layer
  { name: 'Jamun', layer: SpeciesLayer.TREE, saplingPrice: 110, ecoWeight: 4 },
  { name: 'Neem', layer: SpeciesLayer.TREE, saplingPrice: 90, ecoWeight: 4 },
  { name: 'Karanj', layer: SpeciesLayer.TREE, saplingPrice: 95, ecoWeight: 3 },
  // Sub-tree layer
  { name: 'Bahava (Amaltas)', layer: SpeciesLayer.SUB_TREE, saplingPrice: 85, ecoWeight: 3 },
  { name: 'Kanchan', layer: SpeciesLayer.SUB_TREE, saplingPrice: 80, ecoWeight: 3 },
  { name: 'Bel', layer: SpeciesLayer.SUB_TREE, saplingPrice: 90, ecoWeight: 4 },
  // Shrub layer
  { name: 'Adulsa', layer: SpeciesLayer.SHRUB, saplingPrice: 50, ecoWeight: 2 },
  { name: 'Nirgudi', layer: SpeciesLayer.SHRUB, saplingPrice: 45, ecoWeight: 2 },
  { name: 'Karvand', layer: SpeciesLayer.SHRUB, saplingPrice: 55, ecoWeight: 3 },
];

/**
 * Default pipeline execution parameters.
 * Default budget of 40 lakh selects ~14-18 plots on the default seed.
 * Default wildlife travel limit of 1,200m forms a single connected network.
 */
export const DEFAULT_PARAMS: Params = {
  seed: 42,
  budgetLakh: 40,
  radiusM: 300,
  travelLimitM: 1200,
  density: 3,
  width: DEFAULT_GRID_SIZE,
  height: DEFAULT_GRID_SIZE,
};
