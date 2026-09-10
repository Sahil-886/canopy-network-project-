import { describe, it, expect } from 'vitest';
import { computeAllCorridorPaths } from '../src/engine/dijkstra';
import { LandType, type Grid, type Plot } from '../src/engine/types';

describe('Stage 3a: Dijkstra shortest corridor paths', () => {
  it('navigates around an impassable building wall on a 5x5 grid', () => {
    // 5x5 grid
    // Source plot at (0, 2)
    // Destination plot at (4, 2)
    // Wall of BUILDING cells from (2, 0) to (2, 3), leaving gap at (2, 4)
    const width = 5;
    const height = 5;
    const land = new Uint8Array(width * height).fill(LandType.VACANT);
    const population = new Uint16Array(width * height).fill(0);

    // Impassable wall of buildings down column 2
    land[0 * width + 2] = LandType.BUILDING;
    land[1 * width + 2] = LandType.BUILDING;
    land[2 * width + 2] = LandType.BUILDING;
    land[3 * width + 2] = LandType.BUILDING;
    // (4, 2) is left as VACANT for detour

    const grid: Grid = { width, height, land, population };

    const plot1: Plot = {
      id: 1,
      cells: [2 * width + 0],
      areaM2: 625,
      cost: 100000,
      cx: 0,
      cy: 2,
      saplingBudget: 50000,
      coveredHomes: [],
    };

    const plot2: Plot = {
      id: 2,
      cells: [2 * width + 4],
      areaM2: 625,
      cost: 100000,
      cx: 4,
      cy: 2,
      saplingBudget: 50000,
      coveredHomes: [],
    };

    const edges = computeAllCorridorPaths(grid, [plot1, plot2]);

    expect(edges.length).toBe(1);
    const edge = edges[0];
    expect(edge.from).toBe(1);
    expect(edge.to).toBe(2);

    // Path must pass through (2, 4), the only open cell in column 2
    const passesThroughGap = edge.path.includes(4 * width + 2);
    expect(passesThroughGap).toBe(true);

    // Path must not contain any building cells
    for (const cell of edge.path) {
      expect(land[cell]).not.toBe(LandType.BUILDING);
      expect(land[cell]).not.toBe(LandType.HOMES);
    }
  });

  it('returns empty array when fewer than 2 plots provided', () => {
    const grid: Grid = {
      width: 4,
      height: 4,
      land: new Uint8Array(16).fill(LandType.VACANT),
      population: new Uint16Array(16).fill(0),
    };

    expect(computeAllCorridorPaths(grid, [])).toEqual([]);
  });
});
