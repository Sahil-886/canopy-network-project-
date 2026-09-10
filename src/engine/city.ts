/**
 * Seeded synthetic city generator for plausible urban districts.
 * Produces roads, water, dense residential cores, parks, and vacant plots on a 2D array.
 */

import { CELL_SIZE_M } from './config';
import { createPRNG, randInt } from './prng';
import { type Grid, LandType, LAND_TYPE_NAMES } from './types';

/**
 * Generates a synthetic urban district grid using a seeded PRNG.
 * Creates an arterial road grid, water bodies, mixed building blocks, parks, and vacant plots.
 */
export function generateCity(seed: number, width: number = 64, height: number = 64): Grid {
  const rng = createPRNG(seed);
  const w = width;
  const h = height;
  const land = new Uint8Array(w * h);
  const population = new Uint16Array(w * h);

  // Initialize all cells as HOMES (residential)
  land.fill(LandType.HOMES);

  const idx = (x: number, y: number): number => y * w + x;
  const inBounds = (x: number, y: number): boolean => x >= 0 && x < w && y >= 0 && y < h;

  // 1. Regular road grid with wobble
  const roadSpacingX = randInt(rng, 8, 12);
  const roadSpacingY = randInt(rng, 8, 12);

  for (let r = roadSpacingY; r < h; r += roadSpacingY) {
    let y = r;
    for (let x = 0; x < w; x++) {
      if (inBounds(x, y)) land[idx(x, y)] = LandType.ROAD;
      if (rng() < 0.15) {
        y = Math.max(0, Math.min(h - 1, y + (rng() < 0.5 ? -1 : 1)));
      }
    }
  }

  for (let c = roadSpacingX; c < w; c += roadSpacingX) {
    let x = c;
    for (let y = 0; y < h; y++) {
      if (inBounds(x, y)) land[idx(x, y)] = LandType.ROAD;
      if (rng() < 0.15) {
        x = Math.max(0, Math.min(w - 1, x + (rng() < 0.5 ? -1 : 1)));
      }
    }
  }

  // 2. Two to three irregular arterial roads crossing the district diagonally
  const numArterials = randInt(rng, 2, 3);
  for (let a = 0; a < numArterials; a++) {
    let x = randInt(rng, 0, w - 1);
    let y = rng() < 0.5 ? 0 : randInt(rng, 0, h - 1);
    const dx = rng() < 0.5 ? 1 : -1;
    while (inBounds(x, y)) {
      land[idx(x, y)] = LandType.ROAD;
      if (inBounds(x + 1, y)) land[idx(x + 1, y)] = LandType.ROAD;
      y += 1;
      if (rng() < 0.6) x = Math.max(0, Math.min(w - 1, x + dx));
    }
  }

  // 3. Water body: winding river or natural lake
  if (rng() < 0.55) {
    let rx = randInt(rng, Math.floor(w * 0.3), Math.floor(w * 0.7));
    const riverWidth = randInt(rng, 2, 3);
    for (let y = 0; y < h; y++) {
      for (let rw = 0; rw < riverWidth; rw++) {
        if (inBounds(rx + rw, y)) land[idx(rx + rw, y)] = LandType.WATER;
      }
      if (rng() < 0.35) rx = Math.max(0, Math.min(w - riverWidth, rx + (rng() < 0.5 ? -1 : 1)));
    }
  } else {
    const lx = randInt(rng, Math.floor(w * 0.25), Math.floor(w * 0.75));
    const ly = randInt(rng, Math.floor(h * 0.25), Math.floor(h * 0.75));
    const lr = randInt(rng, 5, 8);
    for (let dy = -lr; dy <= lr; dy++) {
      for (let dx = -lr; dx <= lr; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= lr + rng() * 1.5 - 0.75 && inBounds(lx + dx, ly + dy)) {
          land[idx(lx + dx, ly + dy)] = LandType.WATER;
        }
      }
    }
  }

  // 4. Commercial and industrial building blocks
  const numBuildingClusters = randInt(rng, 5, 9);
  for (let c = 0; c < numBuildingClusters; c++) {
    const cx = randInt(rng, 4, w - 6);
    const cy = randInt(rng, 4, h - 6);
    const bw = randInt(rng, 3, 6);
    const bh = randInt(rng, 3, 6);
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        if (inBounds(px, py) && land[idx(px, py)] === LandType.HOMES) {
          land[idx(px, py)] = LandType.BUILDING;
        }
      }
    }
  }

  // 5. Existing public parks (3 to 6 parks)
  const numParks = randInt(rng, 3, 6);
  let parksPlaced = 0;
  let parkAttempts = 0;
  while (parksPlaced < numParks && parkAttempts < 120) {
    parkAttempts++;
    const px = randInt(rng, 3, w - 6);
    const py = randInt(rng, 3, h - 6);
    const pw = randInt(rng, 3, 5);
    const ph = randInt(rng, 3, 5);
    let ok = true;
    for (let dy = 0; dy < ph && ok; dy++) {
      for (let dx = 0; dx < pw && ok; dx++) {
        if (!inBounds(px + dx, py + dy)) { ok = false; break; }
        const t = land[idx(px + dx, py + dy)];
        if (t === LandType.WATER || t === LandType.ROAD) ok = false;
      }
    }
    if (ok) {
      for (let dy = 0; dy < ph; dy++) {
        for (let dx = 0; dx < pw; dx++) {
          land[idx(px + dx, py + dy)] = LandType.PARK;
        }
      }
      parksPlaced++;
    }
  }

  // 6. Vacant land (sparse in core, more common toward borders)
  const centerX = w / 2;
  const centerY = h / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cellIdx = idx(x, y);
      if (land[cellIdx] !== LandType.HOMES && land[cellIdx] !== LandType.BUILDING) continue;
      const distFromCenter = Math.hypot(x - centerX, y - centerY) / maxDist;
      const prob = 0.04 + 0.12 * distFromCenter;
      if (rng() < prob) {
        land[cellIdx] = LandType.VACANT;
      }
    }
  }

  // Larger vacant plots (school grounds, abandoned lots)
  const numLargeVacant = randInt(rng, 4, 7);
  for (let i = 0; i < numLargeVacant; i++) {
    const vx = randInt(rng, 2, w - 5);
    const vy = randInt(rng, 2, h - 5);
    const vw = randInt(rng, 2, 4);
    const vh = randInt(rng, 2, 4);
    for (let dy = 0; dy < vh; dy++) {
      for (let dx = 0; dx < vw; dx++) {
        const px = vx + dx;
        const py = vy + dy;
        if (inBounds(px, py)) {
          const t = land[idx(px, py)];
          if (t === LandType.HOMES || t === LandType.BUILDING) {
            land[idx(px, py)] = LandType.VACANT;
          }
        }
      }
    }
  }

  // Vacant strips along riverbanks or lake shores
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (land[idx(x, y)] !== LandType.WATER) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (inBounds(nx, ny) && land[idx(nx, ny)] === LandType.HOMES && rng() < 0.3) {
            land[idx(nx, ny)] = LandType.VACANT;
          }
        }
      }
    }
  }

  // Ensure vacant land is at least 8-15%
  let vacantCount = 0;
  const total = w * h;
  for (let i = 0; i < total; i++) {
    if (land[i] === LandType.VACANT) vacantCount++;
  }
  if (vacantCount / total < 0.08) {
    for (let y = 0; y < h && vacantCount / total < 0.09; y++) {
      for (let x = 0; x < w && vacantCount / total < 0.09; x++) {
        const dist = Math.hypot(x - centerX, y - centerY) / maxDist;
        if (land[idx(x, y)] === LandType.HOMES && dist > 0.5 && rng() < 0.2) {
          land[idx(x, y)] = LandType.VACANT;
          vacantCount++;
        }
      }
    }
  }

  // 7. Population for homes (20 to 120, higher near core)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cellIdx = idx(x, y);
      if (land[cellIdx] === LandType.HOMES) {
        const distRatio = Math.min(1, Math.hypot(x - centerX, y - centerY) / maxDist);
        const minPop = Math.floor(20 + 35 * (1 - distRatio));
        const maxPop = Math.floor(65 + 55 * (1 - distRatio));
        population[cellIdx] = randInt(rng, minPop, maxPop);
      } else {
        population[cellIdx] = 0;
      }
    }
  }

  return { width: w, height: h, land, population };
}

/**
 * Calculates distribution counts for all land types across the city.
 * Used for validation, diagnostics, and displaying environmental breakdown.
 */
export function getLandStats(grid: Grid): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 0; i < grid.land.length; i++) {
    const type = grid.land[i] as LandType;
    const name = LAND_TYPE_NAMES[type] ?? 'Unknown';
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

/**
 * Sums the total human population across all residential grid cells.
 * Traverses the population typed array to compute district-wide residents.
 */
export function totalResidents(grid: Grid): number {
  let sum = 0;
  for (let i = 0; i < grid.population.length; i++) {
    sum += grid.population[i];
  }
  return sum;
}

/**
 * Formats grid dimensions in real-world kilometers based on cell size.
 * Converts cell dimensions using the 25 m per cell spatial scale.
 */
export function gridAreaKm(width: number, height: number): string {
  const wKm = (width * CELL_SIZE_M) / 1000;
  const hKm = (height * CELL_SIZE_M) / 1000;
  return `${wKm.toFixed(1)} km × ${hKm.toFixed(1)} km`;
}
