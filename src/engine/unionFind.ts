/**
 * Disjoint-set data structure (Union-Find) with path compression and union by rank.
 * Maintains disjoint sets of elements with nearly constant O(alpha(N)) amortized operations.
 */

/**
 * Disjoint set tracking connectivity between integer elements.
 * Employs rank heuristics to keep trees balanced and flattens paths on lookup.
 */
export class UnionFind {
  private parent: Map<number, number> = new Map();
  private rank: Map<number, number> = new Map();
  private numComponents: number = 0;

  /**
   * Initializes disjoint set with an optional list of elements.
   * Places each provided element into its own independent singleton set.
   */
  constructor(elements?: Iterable<number>) {
    if (elements) {
      for (const el of elements) {
        this.add(el);
      }
    }
  }

  /**
   * Adds a new individual element into its own isolated set if not already present.
   * Sets parent pointer to itself and initializes its tree rank to zero.
   */
  public add(x: number): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      this.numComponents++;
    }
  }

  /**
   * Finds the representative root of the set containing element x.
   * Flattens the lookup path by redirecting visited nodes directly to the root.
   */
  public find(x: number): number {
    this.add(x);
    let root = x;
    while (root !== this.parent.get(root)) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  /**
   * Merges the sets containing elements x and y into a single connected set.
   * Attaches the shallower tree to the deeper root using rank heuristics.
   */
  public union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) {
      return false; // Already in same set
    }

    const rankX = this.rank.get(rootX)!;
    const rankY = this.rank.get(rootY)!;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }

    this.numComponents--;
    return true;
  }

  /**
   * Tests whether elements x and y belong to the same connected component.
   * Compares the representative roots returned by find operations.
   */
  public connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  /**
   * Returns the current total count of distinct disjoint sets.
   * Decrements by one with each successful union of two previously separate sets.
   */
  public count(): number {
    return this.numComponents;
  }

  /**
   * Groups all elements into lists according to their connected component roots.
   * Traverses all known elements and organizes them by representative leader.
   */
  public getComponents(): Map<number, number[]> {
    const groups = new Map<number, number[]>();
    for (const el of this.parent.keys()) {
      const root = this.find(el);
      let list = groups.get(root);
      if (!list) {
        list = [];
        groups.set(root, list);
      }
      list.push(el);
    }
    return groups;
  }
}
