import { describe, it, expect } from 'vitest';
import { findVacantPlots } from '../src/engine/plots';
import { LandType, type Grid } from '../src/engine/types';

describe('Stage 1a: BFS vacant plot identification', () => {
  it('identifies distinct connected components on a hand-drawn 6x6 grid', () => {
    // 0 = Homes, 5 = Vacant
    // Let's create two separate vacant plots: one of 3 cells, one of 2 cells
    const width = 6;
    const height = 6;
    const land = new Uint8Array(width * height).fill(LandType.HOMES);
    const population = new Uint16Array(width * height).fill(50);

    // Plot 1: (1,1), (1,2), (2,1)
    land[1 * width + 1] = LandType.VACANT;
    land[2 * width + 1] = LandType.VACANT;
    land[1 * width + 2] = LandType.VACANT;

    // Plot 2: (4,4), (4,5)
    land[4 * width + 4] = LandType.VACANT;
    land[5 * width + 4] = LandType.VACANT;

    const grid: Grid = { width, height, land, population };
    const plots = findVacantPlots(grid, 3);

    expect(plots.length).toBe(2);
    const sizes = plots.map((p) => p.cells.length).sort((a, b) => a - b);
    expect(sizes).toEqual([2, 3]);

    // Check area calculation: 1 cell = 625 m²
    const plot3 = plots.find((p) => p.cells.length === 3)!;
    expect(plot3.areaM2).toBe(3 * 625);
    expect(plot3.cost).toBeGreaterThan(0);
  });

  it('subdivides components with more than 16 cells using 4x4 spatial tiles', () => {
    // 8x8 grid with a large 5x5 block of vacant cells (25 cells > 16)
    const width = 8;
    const height = 8;
    const land = new Uint8Array(width * height).fill(LandType.HOMES);
    const population = new Uint16Array(width * height).fill(50);

    for (let y = 1; y <= 5; y++) {
      for (let x = 1; x <= 5; x++) {
        land[y * width + x] = LandType.VACANT;
      }
    }

    const grid: Grid = { width, height, land, population };
    const plots = findVacantPlots(grid, 3);

    // Should be partitioned into multiple sub-plots, each <= 16 cells
    expect(plots.length).toBeGreaterThan(1);
    for (const p of plots) {
      expect(p.cells.length).toBeLessThanOrEqual(16);
    }
  });
});
