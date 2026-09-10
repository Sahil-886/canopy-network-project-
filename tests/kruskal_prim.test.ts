import { describe, it, expect } from 'vitest';
import { kruskalMST } from '../src/engine/kruskal';
import { primMSTCost } from '../src/engine/prim';
import { type CorridorEdge } from '../src/engine/types';

describe('Stage 3b & 3c: Kruskal and Prim MST equivalence', () => {
  it('computes identical MST total cost on random graphs', () => {
    // Test on 20 random graph instances with random edges and weights
    for (let test = 0; test < 20; test++) {
      const numNodes = 5 + Math.floor(Math.random() * 8); // 5 to 12 nodes
      const nodeIds: number[] = Array.from({ length: numNodes }, (_, i) => i + 1);

      const edges: CorridorEdge[] = [];
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          // Connect with 60% probability
          if (Math.random() < 0.6) {
            const cost = 10 + Math.floor(Math.random() * 90);
            edges.push({
              from: nodeIds[i],
              to: nodeIds[j],
              cost,
              lengthM: cost,
              path: [],
              viable: true,
            });
          }
        }
      }

      const kruskalRes = kruskalMST(nodeIds, edges);
      const primCost = primMSTCost(nodeIds, edges);

      // Kruskal and Prim must produce the exact same total minimum spanning forest weight
      expect(kruskalRes.totalCost).toBe(primCost);
    }
  });

  it('handles disconnected graphs with isolated nodes', () => {
    const nodeIds = [1, 2, 3, 4, 5];
    // Edge between 1 and 2, edge between 3 and 4; 5 is isolated
    const edges: CorridorEdge[] = [
      { from: 1, to: 2, cost: 25, lengthM: 25, path: [], viable: true },
      { from: 3, to: 4, cost: 50, lengthM: 50, path: [], viable: true },
    ];

    const kruskal = kruskalMST(nodeIds, edges);
    const prim = primMSTCost(nodeIds, edges);

    expect(kruskal.totalCost).toBe(75);
    expect(prim).toBe(75);
    expect(kruskal.mstEdges.length).toBe(2);
  });
});
