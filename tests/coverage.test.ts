import { describe, it, expect } from 'vitest';
import { computePlotCoverage, computeInitialParkCoverage } from '../src/engine/coverage';
import { LandType, type Grid, type Plot } from '../src/engine/types';

describe('Stage 1b: Spatial coverage query', () => {
  it('correctly identifies residential homes within 300m radius', () => {
    // 10x10 grid (25m per cell)
    // 300m = 12 cells
    const width = 10;
    const height = 10;
    const land = new Uint8Array(width * height).fill(LandType.HOMES);
    const population = new Uint16Array(width * height).fill(50);

    // Plot at cell (0, 0)
    const plot: Plot = {
      id: 1,
      cells: [0],
      areaM2: 625,
      cost: 100000,
      cx: 0,
      cy: 0,
      saplingBudget: 50000,
      coveredHomes: [],
    };

    const grid: Grid = { width, height, land, population };
    const [coveredPlot] = computePlotCoverage(grid, [plot], 75); // 75m = 3 cells

    // Homes within 75m (dx^2 + dy^2 <= 9):
    // (0,0) is plot
    // (1,0): dist 25m <= 75m -> included
    // (2,0): dist 50m <= 75m -> included
    // (3,0): dist 75m <= 75m -> included
    // (4,0): dist 100m > 75m -> excluded
    expect(coveredPlot.coveredHomes).toContain(1 * width + 0);
    expect(coveredPlot.coveredHomes).toContain(2 * width + 0);
    expect(coveredPlot.coveredHomes).toContain(3 * width + 0);
    expect(coveredPlot.coveredHomes).not.toContain(4 * width + 0);
  });

  it('computes initial coverage of public parks', () => {
    const width = 8;
    const height = 8;
    const land = new Uint8Array(width * height).fill(LandType.HOMES);
    const population = new Uint16Array(width * height).fill(50);

    // Park at (0, 0)
    land[0] = LandType.PARK;

    const grid: Grid = { width, height, land, population };
    const parkCoverage = computeInitialParkCoverage(grid, 50); // 50m = 2 cells

    expect(parkCoverage.has(1)).toBe(true);
    expect(parkCoverage.has(2)).toBe(true);
    expect(parkCoverage.has(3)).toBe(false);
  });
});
