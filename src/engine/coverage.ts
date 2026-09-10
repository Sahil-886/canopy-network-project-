/**
 * Stage 1b: Spatial coverage determination for candidate plots and existing parks.
 * Finds residential home cells within straight-line radius using bounded box queries.
 */

import { CELL_SIZE_M } from './config';
import { type Grid, type Plot, LandType } from './types';

/**
 * Computes which residential home cells fall within coverage radius of each plot.
 * Restricts spatial distance checks to the bounding box surrounding each plot.
 */
export function computePlotCoverage(
  grid: Grid,
  plots: Plot[],
  radiusM: number
): Plot[] {
  const { width, height, land } = grid;
  const radiusCells = Math.ceil(radiusM / CELL_SIZE_M);
  const radiusSqCells = (radiusM / CELL_SIZE_M) * (radiusM / CELL_SIZE_M);

  return plots.map((plot) => {
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    const plotCoords: [number, number][] = [];
    for (const c of plot.cells) {
      const px = c % width;
      const py = Math.floor(c / width);
      plotCoords.push([px, py]);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const boxMinX = Math.max(0, minX - radiusCells);
    const boxMaxX = Math.min(width - 1, maxX + radiusCells);
    const boxMinY = Math.max(0, minY - radiusCells);
    const boxMaxY = Math.min(height - 1, maxY + radiusCells);

    const coveredHomes: number[] = [];

    for (let hy = boxMinY; hy <= boxMaxY; hy++) {
      for (let hx = boxMinX; hx <= boxMaxX; hx++) {
        const hIdx = hy * width + hx;
        if (land[hIdx] !== LandType.HOMES) continue;

        // Check straight-line distance to plot's nearest cell
        let minSqDist = Infinity;
        for (let i = 0; i < plotCoords.length; i++) {
          const dx = hx - plotCoords[i][0];
          const dy = hy - plotCoords[i][1];
          const sqDist = dx * dx + dy * dy;
          if (sqDist < minSqDist) {
            minSqDist = sqDist;
            if (minSqDist <= radiusSqCells) break;
          }
        }

        if (minSqDist <= radiusSqCells) {
          coveredHomes.push(hIdx);
        }
      }
    }

    return {
      ...plot,
      coveredHomes,
    };
  });
}

/**
 * Identifies all home cells already within coverage radius of existing public parks.
 * Homes within range of existing parks are treated as baseline-covered at start.
 */
export function computeInitialParkCoverage(
  grid: Grid,
  radiusM: number
): Set<number> {
  const { width, height, land } = grid;
  const radiusCells = Math.ceil(radiusM / CELL_SIZE_M);
  const radiusSqCells = (radiusM / CELL_SIZE_M) * (radiusM / CELL_SIZE_M);
  const coveredSet = new Set<number>();

  const parkCoords: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (land[idx] === LandType.PARK) {
        parkCoords.push([x, y]);
      }
    }
  }

  if (parkCoords.length === 0) return coveredSet;

  for (let hy = 0; hy < height; hy++) {
    for (let hx = 0; hx < width; hx++) {
      const hIdx = hy * width + hx;
      if (land[hIdx] !== LandType.HOMES) continue;

      for (let i = 0; i < parkCoords.length; i++) {
        const dx = hx - parkCoords[i][0];
        const dy = hy - parkCoords[i][1];
        if (Math.abs(dx) <= radiusCells && Math.abs(dy) <= radiusCells) {
          const sqDist = dx * dx + dy * dy;
          if (sqDist <= radiusSqCells) {
            coveredSet.add(hIdx);
            break;
          }
        }
      }
    }
  }

  return coveredSet;
}
