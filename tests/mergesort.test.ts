import { describe, it, expect } from 'vitest';
import { mergeSort } from '../src/engine/mergeSort';

describe('Merge Sort', () => {
  it('matches built-in sort on random numerical arrays', () => {
    for (let test = 0; test < 50; test++) {
      const len = Math.floor(Math.random() * 100);
      const arr: number[] = [];
      for (let i = 0; i < len; i++) {
        arr.push(Math.floor(Math.random() * 1000) - 500);
      }

      const expected = [...arr].sort((a, b) => a - b);
      const actual = mergeSort(arr, (a, b) => a - b);

      expect(actual).toEqual(expected);
    }
  });

  it('handles empty and single-element arrays correctly', () => {
    expect(mergeSort([], (a: number, b: number) => a - b)).toEqual([]);
    expect(mergeSort([42], (a: number, b: number) => a - b)).toEqual([42]);
  });

  it('correctly sorts objects with complex comparators', () => {
    const items = [
      { id: 1, cost: 50 },
      { id: 2, cost: 20 },
      { id: 3, cost: 80 },
      { id: 4, cost: 20 },
    ];

    const sorted = mergeSort(items, (a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.id - b.id;
    });

    expect(sorted.map((x) => x.id)).toEqual([2, 4, 1, 3]);
  });
});
