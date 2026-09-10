/**
 * Steiner tree junction heuristic and stepping-stone habitat gap bridging.
 * Identifies unselected vacant plots along severed corridor paths to reconnect isolated habitat groups.
 */

import { type Plot, type CorridorEdge, type Grid } from './types';

/**
 * Discovers candidate stepping-stone plots along corridor links that exceed the wildlife travel limit.
 * Searches along the midpoints of non-viable corridor paths to locate affordable bridging parcels.
 */
export function findSteppingStones(
  _grid: Grid,
  allPlots: ReadonlyArray<Plot>,
  selectedPlotIds: Set<number>,
  mstEdges: ReadonlyArray<CorridorEdge>,
  travelLimitM: number
): Plot[] {
  const suggested: Plot[] = [];
  const suggestedIds = new Set<number>();

  for (const edge of mstEdges) {
    if (edge.lengthM > travelLimitM && edge.path.length > 4) {
      // Locate the physical midpoint of the disconnected corridor path
      const midCell = edge.path[Math.floor(edge.path.length / 2)];
      const midX = midCell % _grid.width;
      const midY = Math.floor(midCell / _grid.width);

      let closestPlot: Plot | null = null;
      let minDistance = Infinity;

      for (const plot of allPlots) {
        if (selectedPlotIds.has(plot.id) || suggestedIds.has(plot.id)) continue;

        const dist = Math.hypot(plot.cx - midX, plot.cy - midY) * 25;
        if (dist < minDistance && dist < edge.lengthM * 0.45) {
          minDistance = dist;
          closestPlot = plot;
        }
      }

      if (closestPlot) {
        suggested.push(closestPlot);
        suggestedIds.add(closestPlot.id);
      }
    }
  }

  return suggested;
}
