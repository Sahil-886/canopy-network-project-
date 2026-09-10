/**
 * Stage 1a: Vacant plot identification using Breadth-First Search (BFS) flood fill.
 * Groups adjacent vacant cells and subdivides oversized patches into viable micro-forests.
 */

import { CELL_AREA_M2, PREP_COST_PER_M2, AVG_SAPLING_PRICE } from './config';
import { type Grid, type Plot, LandType } from './types';

/**
 * Finds all plantable vacant plots on the 2D grid using BFS flood fill.
 * Discovers connected vacant cells and partitions components over 16 cells by 4x4 tiles.
 */
export function findVacantPlots(grid: Grid, density: number = 3): Plot[] {
  const { width, height, land } = grid;
  const visited = new Uint8Array(width * height);
  const plots: Plot[] = [];
  let nextId = 1;

  const inBounds = (x: number, y: number): boolean => x >= 0 && x < width && y >= 0 && y < height;
  const idx = (x: number, y: number): number => y * width + x;

  const dx = [0, 0, -1, 1];
  const dy = [-1, 1, 0, 0];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startIdx = idx(x, y);
      if (land[startIdx] !== LandType.VACANT || visited[startIdx] === 1) {
        continue;
      }

      // Run BFS to collect all 4-connected vacant cells in this raw component
      const queue: number[] = [startIdx];
      visited[startIdx] = 1;
      const componentCells: number[] = [];

      let head = 0;
      while (head < queue.length) {
        const curr = queue[head++];
        componentCells.push(curr);

        const cx = curr % width;
        const cy = Math.floor(curr / width);

        for (let dir = 0; dir < 4; dir++) {
          const nx = cx + dx[dir];
          const ny = cy + dy[dir];
          if (inBounds(nx, ny)) {
            const nIdx = idx(nx, ny);
            if (land[nIdx] === LandType.VACANT && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }
      }

      if (componentCells.length <= 16) {
        // Suitable size for micro-forest plot
        plots.push(createPlotFromCells(nextId++, componentCells, width, density));
      } else {
        // Subdivide large plot: group cells by 4x4 tile and run BFS within each tile
        const tiles = new Map<string, number[]>();
        for (const cell of componentCells) {
          const cx = cell % width;
          const cy = Math.floor(cell / width);
          const tileKey = `${Math.floor(cx / 4)}_${Math.floor(cy / 4)}`;
          let list = tiles.get(tileKey);
          if (!list) {
            list = [];
            tiles.set(tileKey, list);
          }
          list.push(cell);
        }

        for (const tileCells of tiles.values()) {
          const subPlots = bfsTileComponents(tileCells, width, height, density, nextId);
          for (const sp of subPlots) {
            plots.push(sp);
            nextId++;
          }
        }
      }
    }
  }

  return plots;
}

/**
 * Runs BFS inside a single 4x4 spatial tile to find connected sub-plots.
 * Ensures that sub-divided plots remain contiguous micro-forest candidates.
 */
function bfsTileComponents(
  tileCells: number[],
  width: number,
  height: number,
  density: number,
  startId: number
): Plot[] {
  const cellSet = new Set(tileCells);
  const localVisited = new Set<number>();
  const subPlots: Plot[] = [];
  let currentId = startId;

  const dx = [0, 0, -1, 1];
  const dy = [-1, 1, 0, 0];

  for (const startCell of tileCells) {
    if (localVisited.has(startCell)) continue;

    const queue: number[] = [startCell];
    localVisited.add(startCell);
    const plotCells: number[] = [];

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      plotCells.push(curr);

      const cx = curr % width;
      const cy = Math.floor(curr / width);

      for (let dir = 0; dir < 4; dir++) {
        const nx = cx + dx[dir];
        const ny = cy + dy[dir];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (cellSet.has(nIdx) && !localVisited.has(nIdx)) {
            localVisited.add(nIdx);
            queue.push(nIdx);
          }
        }
      }
    }

    if (plotCells.length > 0) {
      subPlots.push(createPlotFromCells(currentId++, plotCells, width, density));
    }
  }

  return subPlots;
}

/**
 * Constructs a Plot object calculating spatial centroid, area, and planting budget.
 * Calculates costs based on preparation expenses per m² and native sapling density.
 */
export function createPlotFromCells(
  id: number,
  cells: number[],
  gridWidth: number,
  density: number
): Plot {
  let sumX = 0;
  let sumY = 0;
  for (const c of cells) {
    sumX += c % gridWidth;
    sumY += Math.floor(c / gridWidth);
  }

  const cx = sumX / cells.length;
  const cy = sumY / cells.length;
  const areaM2 = cells.length * CELL_AREA_M2;
  const cost = areaM2 * (PREP_COST_PER_M2 + density * AVG_SAPLING_PRICE);
  const saplingBudget = areaM2 * density * AVG_SAPLING_PRICE;

  return {
    id,
    cells,
    areaM2,
    cost,
    cx,
    cy,
    saplingBudget,
    coveredHomes: [],
  };
}
