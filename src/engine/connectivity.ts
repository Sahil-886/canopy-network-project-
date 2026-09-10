/**
 * Stage 3e: Ecological connectivity analysis using Union-Find.
 * Evaluates wildlife dispersal feasibility under maximum travel limit and identifies habitat groups.
 */

import { UnionFind } from './unionFind';
import { type Plot, type CorridorEdge, type Group } from './types';

/**
 * Accessible color palette for multi-group habitat identification (Okabe-Ito).
 * Verified distinguishable for all color-vision deficiencies.
 */
export const OKABE_ITO_PALETTE: ReadonlyArray<string> = [
  '#009E73', // Bluish Green
  '#0072B2', // Blue
  '#E69F00', // Orange
  '#D55E00', // Vermillion
  '#CC79A7', // Reddish Purple
  '#56B4E9', // Sky Blue
  '#F0E442', // Yellow
  '#333333', // Charcoal Dark
];

export interface ConnectivityResult {
  readonly groups: Group[];
  readonly annotatedMstEdges: CorridorEdge[];
  readonly numGroups: number;
}

/**
 * Partitions micro-forests into connected wildlife habitat groups under the travel limit.
 * Unites forest pairs whose cheapest corridor is reachable within the species dispersal range.
 */
export function analyzeConnectivity(
  selectedPlots: ReadonlyArray<Plot>,
  allEdges: ReadonlyArray<CorridorEdge>,
  mstEdges: ReadonlyArray<CorridorEdge>,
  travelLimitM: number
): ConnectivityResult {
  const plotIds = selectedPlots.map((p) => p.id);
  const uf = new UnionFind(plotIds);

  // Union pairs whose cheapest corridor distance is within the travel limit
  for (const edge of allEdges) {
    if (edge.lengthM <= travelLimitM) {
      uf.union(edge.from, edge.to);
    }
  }

  // Annotate MST corridors: mark links exceeding travel limit as non-viable
  const annotatedMstEdges: CorridorEdge[] = mstEdges.map((edge) => ({
    ...edge,
    viable: edge.lengthM <= travelLimitM,
  }));

  // Build group records
  const compMap = uf.getComponents();
  const groups: Group[] = [];
  let colorIdx = 0;

  for (const [_, members] of compMap.entries()) {
    groups.push({
      id: groups.length + 1,
      plotIds: members,
      color: OKABE_ITO_PALETTE[colorIdx % OKABE_ITO_PALETTE.length],
    });
    colorIdx++;
  }

  return {
    groups,
    annotatedMstEdges,
    numGroups: groups.length,
  };
}
