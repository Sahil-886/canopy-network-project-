import { describe, it, expect } from 'vitest';
import { UnionFind } from '../src/engine/unionFind';

describe('Union-Find Disjoint Set', () => {
  it('initializes singletons and tracks component count correctly', () => {
    const uf = new UnionFind([1, 2, 3, 4, 5]);
    expect(uf.count()).toBe(5);
    expect(uf.connected(1, 2)).toBe(false);
  });

  it('unions sets and updates connectivity', () => {
    const uf = new UnionFind([1, 2, 3, 4]);
    expect(uf.union(1, 2)).toBe(true);
    expect(uf.connected(1, 2)).toBe(true);
    expect(uf.count()).toBe(3);

    // Duplicate union returns false
    expect(uf.union(1, 2)).toBe(false);
    expect(uf.count()).toBe(3);

    expect(uf.union(3, 4)).toBe(true);
    expect(uf.count()).toBe(2);

    expect(uf.union(2, 4)).toBe(true);
    expect(uf.count()).toBe(1);
    expect(uf.connected(1, 4)).toBe(true);
  });

  it('correctly reports component groupings', () => {
    const uf = new UnionFind([10, 20, 30, 40]);
    uf.union(10, 20);
    uf.union(30, 40);

    const comps = uf.getComponents();
    expect(comps.size).toBe(2);

    const root1 = uf.find(10);
    const root2 = uf.find(30);

    expect(comps.get(root1)?.sort()).toEqual([10, 20]);
    expect(comps.get(root2)?.sort()).toEqual([30, 40]);
  });
});
