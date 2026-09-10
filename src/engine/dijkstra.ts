/**
 * Stage 3a: Dijkstra's shortest path algorithm with a min-heap priority queue.
 * Calculates least-resistance corridor paths navigating around buildings through the city grid.
 */

import { CELL_SIZE_M, CELL_COST_MULTIPLIER } from './config';
import { MinHeap } from './minHeap';
import { type Grid, type Plot, type CorridorEdge, LandType } from './types';

/**
 * Computes shortest corridor paths between all pairs of micro-forests.
 * Runs multi-source Dijkstra from each forest over the 4-connected resistance surface.
 */
export function computeAllCorridorPaths(grid: Grid, selectedPlots: Plot[]): CorridorEdge[] {
  const { width, height, land } = grid;
  const nPlots = selectedPlots.length;
  if (nPlots < 2) return [];

  const edges: CorridorEdge[] = [];
  const dx = [0, 0, -1, 1];
  const dy = [-1, 1, 0, 0];

  const inBounds = (x: number, y: number): boolean => x >= 0 && x < width && y >= 0 && y < height;

  // Run Dijkstra from each forest
  for (let i = 0; i < nPlots; i++) {
    const sourcePlot = selectedPlots[i];
    const dist = new Float64Array(width * height);
    dist.fill(Infinity);
    const parent = new Int32Array(width * height);
    parent.fill(-1);

    const heap = new MinHeap<number>();

    // Multi-source init: all cells of the source micro-forest start at distance 0
    for (const c of sourcePlot.cells) {
      dist[c] = 0;
      heap.push(c, 0);
    }

    while (!heap.isEmpty()) {
      const top = heap.pop();
      if (!top) break;
      const curr = top.element;
      const d = top.priority;

      if (d > dist[curr]) continue;

      const cx = curr % width;
      const cy = Math.floor(curr / width);

      for (let dir = 0; dir < 4; dir++) {
        const nx = cx + dx[dir];
        const ny = cy + dy[dir];
        if (!inBounds(nx, ny)) continue;

        const nextCell = ny * width + nx;
        const cellType = land[nextCell] as LandType;

        // Homes and other buildings act as impenetrable walls
        if (cellType === LandType.HOMES || cellType === LandType.BUILDING) {
          continue;
        }

        const multiplier = CELL_COST_MULTIPLIER[cellType] ?? Infinity;
        if (!isFinite(multiplier)) continue;

        const stepCost = CELL_SIZE_M * multiplier;
        const newDist = d + stepCost;

        if (newDist < dist[nextCell]) {
          dist[nextCell] = newDist;
          parent[nextCell] = curr;
          heap.push(nextCell, newDist);
        }
      }
    }

    // Connect sourcePlot to all targetPlots j > i
    for (let j = i + 1; j < nPlots; j++) {
      const targetPlot = selectedPlots[j];
      let bestTargetCell = -1;
      let minTargetDist = Infinity;

      for (const tc of targetPlot.cells) {
        if (dist[tc] < minTargetDist) {
          minTargetDist = dist[tc];
          bestTargetCell = tc;
        }
      }

      if (bestTargetCell !== -1 && isFinite(minTargetDist)) {
        // Reconstruct cell path from target backwards to source
        const reversePath: number[] = [];
        let curr: number = bestTargetCell;
        while (curr !== -1) {
          reversePath.push(curr);
          curr = parent[curr];
        }
        reversePath.reverse();

        const lengthM = Math.max(1, reversePath.length - 1) * CELL_SIZE_M;

        edges.push({
          from: sourcePlot.id,
          to: targetPlot.id,
          cost: minTargetDist,
          lengthM,
          path: reversePath,
          viable: true,
        });
      }
    }
  }

  return edges;
}
