/**
 * Stage 3b: Kruskal's algorithm for Minimum Spanning Tree (MST).
 * Finds the cheapest set of corridors connecting all reachable micro-forests without cycles.
 */

import { mergeSort } from './mergeSort';
import { UnionFind } from './unionFind';
import { type CorridorEdge } from './types';

export interface KruskalResult {
  readonly mstEdges: CorridorEdge[];
  readonly totalCost: number;
}

/**
 * Computes the minimum spanning forest over candidate corridor edges.
 * Sorts edges by cost using merge sort and adds each edge that connects separate components.
 */
export function kruskalMST(
  nodeIds: ReadonlyArray<number>,
  edges: ReadonlyArray<CorridorEdge>
): KruskalResult {
  if (nodeIds.length <= 1) {
    return { mstEdges: [], totalCost: 0 };
  }

  // Sort edges in ascending order of resistance cost using merge sort
  const sortedEdges = mergeSort(edges, (a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });

  const uf = new UnionFind(nodeIds);
  const mstEdges: CorridorEdge[] = [];
  let totalCost = 0;

  for (const edge of sortedEdges) {
    if (uf.union(edge.from, edge.to)) {
      mstEdges.push(edge);
      totalCost += edge.cost;
      if (mstEdges.length === nodeIds.length - 1) {
        break; // Spanning tree complete
      }
    }
  }

  return { mstEdges, totalCost };
}
