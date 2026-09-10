/**
 * Mulberry32 seeded pseudo-random number generator.
 * Provides fast, deterministic, reproducible 32-bit floating-point numbers in [0, 1).
 */

/**
 * Creates a deterministic pseudo-random number generator from an integer seed.
 * Uses bitwise operations and integer multiplication to update internal state.
 */
export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a uniformly distributed integer between min and max inclusive.
 * Scales the unit interval output of the PRNG to the target integer range.
 */
export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm.
 * Swaps each element with an element chosen uniformly at random from remaining positions.
 */
export function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
