import { describe, it, expect } from 'vitest';
import { budgetedGreedyCover } from '../src/engine/greedy';
import { LandType, type Grid, type Plot } from '../src/engine/types';

describe('Stage 1c: Budgeted greedy set cover', () => {
  it('picks plots in greedy order by newly covered residents per rupee', () => {
    // 10x10 grid with 4 homes
    const width = 10;
    const height = 10;
    const land = new Uint8Array(width * height).fill(LandType.VACANT);
    const population = new Uint16Array(width * height).fill(0);

    // Homes
    population[10] = 100;
    population[20] = 100;
    population[30] = 100;

    // Plot A: costs 100,000, covers home 10 & 20 (200 residents => ratio 0.002)
    // Plot B: costs 100,000, covers home 30 (100 residents => ratio 0.001)
    const plotA: Plot = {
      id: 1,
      cells: [0],
      areaM2: 625,
      cost: 100000,
      cx: 0,
      cy: 0,
      saplingBudget: 50000,
      coveredHomes: [10, 20],
    };

    const plotB: Plot = {
      id: 2,
      cells: [1],
      areaM2: 625,
      cost: 100000,
      cx: 1,
      cy: 0,
      saplingBudget: 50000,
      coveredHomes: [30],
    };

    const grid: Grid = { width, height, land, population };

    // Budget of 1.5 lakh allows picking only 1 plot
    const res = budgetedGreedyCover(grid, [plotB, plotA], 1.5, new Set());
    expect(res.selectedPlots.length).toBe(1);
    expect(res.selectedPlots[0].id).toBe(1); // Plot A picked first because higher ratio
  });

  it('keeps single best plot when greedy combination is inferior', () => {
    // Plot 1 & 2: cost 50,000 each, cover 10 people each = 20 people total
    // Plot 3: cost 90,000, covers 50 people
    // Budget 100,000
    const width = 5;
    const height = 5;
    const land = new Uint8Array(25).fill(LandType.VACANT);
    const population = new Uint16Array(25).fill(0);
    population[0] = 10;
    population[1] = 10;
    population[2] = 50;

    const plot1: Plot = {
      id: 1,
      cells: [10],
      areaM2: 625,
      cost: 50000,
      cx: 0,
      cy: 2,
      saplingBudget: 25000,
      coveredHomes: [0],
    };

    const plot2: Plot = {
      id: 2,
      cells: [11],
      areaM2: 625,
      cost: 50000,
      cx: 1,
      cy: 2,
      saplingBudget: 25000,
      coveredHomes: [1],
    };

    const plot3: Plot = {
      id: 3,
      cells: [12],
      areaM2: 625,
      cost: 90000,
      cx: 2,
      cy: 2,
      saplingBudget: 45000,
      coveredHomes: [2],
    };

    const grid: Grid = { width, height, land, population };
    const res = budgetedGreedyCover(grid, [plot1, plot2, plot3], 1.0, new Set());

    // Single best plot 3 (covers 50) beats plots 1+2 (cover 20)
    expect(res.selectedPlots.length).toBe(1);
    expect(res.selectedPlots[0].id).toBe(3);
  });
});
