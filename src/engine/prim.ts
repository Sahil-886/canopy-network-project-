/**
 * Stage 3c: Prim's O(V²) algorithm for Minimum Spanning Forest cross-validation.
 * Computes MST total cost independently to prove equivalence with Kruskal's algorithm.
 */

import { type CorridorEdge } from './types';

/**
 * Executes standard O(V²) Prim's algorithm on the edge graph across all components.
 * Restarts from unvisited nodes to ensure complete coverage of disconnected graphs.
 */
export function primMSTCost(
  nodeIds: ReadonlyArray<number>,
  edges: ReadonlyArray<CorridorEdge>
): number {
  const n = nodeIds.length;
  if (n <= 1) return 0;

  // Map each nodeId to a contiguous index 0..n-1
  const idToIndex = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    idToIndex.set(nodeIds[i], i);
  }

  // Build dense adjacency matrix of cheapest edge costs
  const matrix: Float64Array = new Float64Array(n * n);
  matrix.fill(Infinity);

  for (const edge of edges) {
    const u = idToIndex.get(edge.from);
    const v = idToIndex.get(edge.to);
    if (u !== undefined && v !== undefined) {
      const idx1 = u * n + v;
      const idx2 = v * n + u;
      if (edge.cost < matrix[idx1]) {
        matrix[idx1] = edge.cost;
        matrix[idx2] = edge.cost;
      }
    }
  }

  const inTree = new Uint8Array(n);
  const minCost = new Float64Array(n);
  let totalCost = 0;

  // Process all connected components
  for (let componentStart = 0; componentStart < n; componentStart++) {
    if (inTree[componentStart] === 1) continue;

    minCost.fill(Infinity);
    minCost[componentStart] = 0;

    while (true) {
      // Find unvisited node with minimal edge connection to current tree
      let u = -1;
      let lowestCost = Infinity;

      for (let i = 0; i < n; i++) {
        if (inTree[i] === 0 && minCost[i] < lowestCost) {
          lowestCost = minCost[i];
          u = i;
        }
      }

      if (u === -1 || lowestCost === Infinity) {
        break;
      }

      inTree[u] = 1;
      totalCost += lowestCost;

      // Relax candidate edge weights from node u to remaining unvisited nodes
      for (let v = 0; v < n; v++) {
        if (inTree[v] === 0) {
          const edgeWeight = matrix[u * n + v];
          if (edgeWeight < minCost[v]) {
            minCost[v] = edgeWeight;
          }
        }
      }
    }
  }

  return totalCost;
}
