/**
 * Stage 3d: Shared corridor path consolidation using a hash set.
 * Deduplicates overlapping corridor segments to report physical corridor length.
 */

import { CELL_SIZE_M } from './config';
import { type Grid, type CorridorEdge, type SharedCorridor, LandType } from './types';

/**
 * Extracts unified footprint of all MST corridors using a Set.
 * Ensures overlapping corridor segments are counted exactly once for construction impact.
 */
export function computeSharedCorridors(
  grid: Grid,
  mstEdges: ReadonlyArray<CorridorEdge>
): SharedCorridor {
  const cellIndices = new Set<number>();
  let lengthBeforeM = 0;

  for (const edge of mstEdges) {
    lengthBeforeM += edge.lengthM;
    for (const cell of edge.path) {
      cellIndices.add(cell);
    }
  }

  // Length after deduplication: count of unique corridor footprint cells
  const lengthAfterM = cellIndices.size * CELL_SIZE_M;

  // Tally unique road cells intersected by the corridor network
  let roadCellsCrossed = 0;
  for (const cell of cellIndices) {
    if (grid.land[cell] === LandType.ROAD) {
      roadCellsCrossed++;
    }
  }

  return {
    cellIndices,
    lengthBeforeM,
    lengthAfterM,
    roadCellsCrossed,
  };
}
