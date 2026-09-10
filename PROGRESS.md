# CanopyNet — Implementation Progress

## File Tree

```
src/
├── engine/
│   ├── config.ts         # Grid params, costs, species, defaults, CSV codes
│   ├── prng.ts           # Mulberry32 seeded PRNG
│   ├── types.ts          # Core types: Grid, Plot, Params, PipelineResult
│   ├── city.ts           # Seeded synthetic city generator (2D array)
│   ├── plots.ts          # Stage 1a: BFS flood fill on 2D array, 4x4 tiling for >16 cells
│   ├── coverage.ts       # Stage 1b: Spatial reach from plot to homes within radius
│   ├── greedy.ts         # Stage 1c: Budgeted greedy set cover with single-best comparison
│   ├── knapsack.ts       # Stage 2a: 0/1 knapsack DP for species packs
│   ├── minHeap.ts        # Priority queue for Dijkstra
│   ├── dijkstra.ts       # Stage 3a: Multi-source Dijkstra on 4-connected grid
│   ├── mergeSort.ts      # Custom merge sort for edges and plots
│   ├── unionFind.ts      # Disjoint-set data structure
│   ├── kruskal.ts        # Stage 3b: Kruskal's MST using merge sort & union-find
│   ├── prim.ts           # Stage 3c: Prim's O(V²) MST cross-check
│   ├── corridors.ts      # Stage 3d: Shared corridor path extraction using Set
│   ├── connectivity.ts   # Stage 3e: Union-Find connectivity under travel limit
│   ├── baseline.ts       # Baseline non-optimized comparison & equal-coverage cost
│   ├── csv.ts            # CSV import/export with validation
│   └── index.ts          # Orchestrator: runPipeline(city, params)
├── components/
│   ├── App.tsx           # Main application shell matching two-speaker pitch
│   ├── Hero.tsx          # Live network hero animation
│   ├── ProblemSection.tsx# Speaker 1: Problem framing (SDG 11.7, 15, Miyawaki, corridors)
│   ├── MethodSection.tsx # Speaker 2: Three-stage solution (Where, What, How)
│   ├── AlgorithmsTable.tsx # 2nd-year DSA specimen table
│   ├── Demo/
│   │   ├── Demo.tsx      # Interactive demo container & coordinator
│   │   ├── Canvas.tsx    # Canvas 2D with DPR, click-drag painting, forests, corridors
│   │   ├── Controls.tsx  # Sliders, seed, new city, layer toggles, CSV import/export
│   │   ├── MetricsPanel.tsx # Side-by-side optimized vs baseline metrics
│   │   ├── ForestPanel.tsx  # Forest details with 0/1 knapsack species breakdown
│   │   ├── StepThrough.tsx  # Guided walkthrough with real data captions
│   │   └── BrushToolbar.tsx # Painting brushes (H, B, R, W, P, V)
│   ├── ResultsSection.tsx# Live metrics, equal-coverage cost, 20-seed benchmark, limitations
│   ├── CloseSection.tsx  # Close, tech stack, team info
│   └── Footer.tsx        # Project footer and honest data label
├── content.ts            # Site copy, TODO_OWNER fields
├── main.tsx              # React entry
└── index.css             # Botanical field guide design tokens & styling
docs/
└── VIVA.md               # Complete student viva prep guide for all 11 DSA concepts
tests/
├── bfs.test.ts           # BFS plot detection and 4x4 tiling tests
├── mergesort.test.ts     # Merge sort verification against Array.prototype.sort
├── minheap.test.ts       # Min-heap push/pop order tests
├── dijkstra.test.ts      # Dijkstra path cost on grid with walls
├── unionfind.test.ts     # Union-Find correctness tests
├── kruskal.test.ts       # Kruskal MST properties and edge cases
├── prim.test.ts          # Prim O(V²) cross-check equals Kruskal total
├── knapsack.test.ts      # 0/1 knapsack DP vs brute force on 200 random instances
├── greedy.test.ts        # Greedy set cover with single-best comparison tests
├── csv.test.ts           # CSV parser validation and errors
└── seeds.test.ts         # Seeds 1–10 determinism and <300ms performance
```

## Core Types
- `LandType`: `0: HOMES (H)`, `1: BUILDING (B)`, `2: ROAD (R)`, `3: WATER (W)`, `4: PARK (P)`, `5: VACANT (V)`
- `Grid`: `{ width: number, height: number, land: Uint8Array, population: Uint16Array }`
- `Plot`: `{ id: number, cells: number[], areaM2: number, cost: number, cx: number, cy: number, saplingBudget: number }`
- `Params`: `{ seed: number, budgetLakh: number, radiusM: number, travelLimitM: number, density: number, width: number, height: number }`
- `PickRecord`: `{ plotId: number, newlyCoveredResidents: number, cost: number, ratio: number, cumResidents: number, cumCost: number }`
- `SpeciesPack`: `{ species: Species, packIndex: number, saplings: number, cost: number, value: number }`
- `SpeciesAllocation`: `{ plotId: number, packs: SpeciesPack[], saplingsPerSpecies: Record<string, number>, cost: number, biodiversityScore: number, speciesCount: number, layersCovered: number }`
- `CorridorEdge`: `{ from: number, to: number, cost: number, lengthM: number, path: number[], viable: boolean }`
- `Group`: `{ id: number, plotIds: number[], color: string }`
- `Metrics`: Live computed metrics for optimized and baseline runs
- `PipelineResult`: `{ plots, picks, selectedPlots, allocations, paths, mst, primTotal, sharedCorridor, groups, metrics, baseline, timingsMs }`

## Phase Checklist

### Phase 0 — Must Ship
- [ ] Engine: prng (mulberry32), config, core types
- [ ] Engine: city generator (arterials, river/lake, core, parks, vacant land)
- [ ] Engine: Stage 1a plots with BFS (`plots.ts`)
- [ ] Engine: Stage 1b coverage reach (`coverage.ts`)
- [ ] Engine: Stage 1c budgeted greedy set cover (`greedy.ts`)
- [ ] Engine: Stage 2a 0/1 knapsack DP (`knapsack.ts`)
- [ ] Engine: Stage 3a min-heap (`minHeap.ts`) and Dijkstra (`dijkstra.ts`)
- [ ] Engine: Stage 3b merge sort (`mergeSort.ts`), Union-Find (`unionFind.ts`), Kruskal MST (`kruskal.ts`)
- [ ] Engine: Stage 3d shared corridors with Set (`corridors.ts`)
- [ ] Engine: Stage 3e connectivity check with Union-Find (`connectivity.ts`)
- [ ] Engine: baseline comparison (`baseline.ts`)
- [ ] Engine: orchestrator `runPipeline` (`index.ts`)
- [ ] UI: Botanical field guide design tokens & theme (Paper, Sage, Pine, Forest, Leaf, Moss, Ochre, Plum)
- [ ] UI: Hero with animated network
- [ ] UI: Problem section (Speaker 1, SDG 11.7 & 15)
- [ ] UI: Solution in three stages (Speaker 2)
- [ ] UI: DSA table (all 11 algorithms implemented, no quadtree/Steiner)
- [ ] UI: Interactive demo with seed, New city, 4 sliders, Optimize, layer toggles, forest panel, animation
- [ ] UI: Results section with metrics
- [ ] UI: Close section, tech stack, team placeholders
- [ ] Docs: `docs/VIVA.md` complete with viva Q&A
- [ ] Tests: Vitest tests on all components
- [ ] Quality: Seeds 1–10 determinism, <300ms, responsive 375px+, WCAG AA

### Phase 1 — Enhanced Experience
- [ ] Stage 3c: Prim's O(V²) MST cross-check (`prim.ts`) with "Kruskal total = Prim total"
- [ ] Step-through mode with dynamic real-data captions
- [ ] Brushes (H, B, R, W, P, V) with click-drag painting
- [ ] CSV import & export (`csv.ts`) with precise validation
- [ ] Equal-coverage cost calculation
- [ ] 20-seed live benchmark (mean ± SD)
- [ ] URL hash sync

### Phase 2 — Additional Explorations
- [ ] Knapsack DP table visualization
- [ ] Stepping stones suggestion along too-long links
- [ ] PNG / JSON export

## Milestones
- **M0**: Spec alignment & clean structure [IN PROGRESS]
- **M1**: Engine implementation (Stages 1, 2, 3, baseline, tests) [PENDING]
- **M2**: UI and styling overhaul to Botanical Field Guide aesthetic [PENDING]
- **M3**: Demo integration (painting, step-through, forest panel, CSV) [PENDING]
- **M4**: Documentation (VIVA.md, README) & verification [PENDING]
