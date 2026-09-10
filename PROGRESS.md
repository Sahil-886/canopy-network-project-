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
│   ├── Hero.tsx          # Live network hero animation with Google Maps styling
│   ├── ProblemSection.tsx# Speaker 1: Problem framing (SDG 11.7, 15, Miyawaki, corridors)
│   ├── MethodSection.tsx # Speaker 2: Three-stage solution (Where, What, How)
│   ├── AlgorithmsTable.tsx # 2nd-year DSA specimen table
│   ├── Demo/
│   │   ├── Demo.tsx      # Interactive demo container & coordinator
│   │   ├── Canvas.tsx    # Google Maps cartography (zoom, pan, pins, scale bar, modes)
│   │   ├── Controls.tsx  # Sliders, seed, new city, layer toggles, CSV import/export
│   │   ├── MetricsPanel.tsx # Side-by-side optimized vs baseline metrics
│   │   ├── ForestPanel.tsx  # Google Maps place card with 0/1 knapsack DP breakdown
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
├── kruskal_prim.test.ts  # Kruskal MST properties and Prim O(V²) cross-check
├── knapsack.test.ts      # 0/1 knapsack DP vs brute force on 200 random instances
├── greedy.test.ts        # Greedy set cover with single-best comparison tests
├── coverage.test.ts      # Spatial reach buffers
├── csv.test.ts           # CSV parser validation and errors
└── seeds.test.ts         # Seeds 1–10 determinism and <300ms performance
```

## Phase Checklist

### Phase 0 — Must Ship [COMPLETED]
- [x] Engine: prng (mulberry32), config, core types
- [x] Engine: city generator (arterials, river/lake, core, parks, vacant land)
- [x] Engine: Stage 1a plots with BFS (`plots.ts`)
- [x] Engine: Stage 1b coverage reach (`coverage.ts`)
- [x] Engine: Stage 1c budgeted greedy set cover (`greedy.ts`)
- [x] Engine: Stage 2a 0/1 knapsack DP (`knapsack.ts`)
- [x] Engine: Stage 3a min-heap (`minHeap.ts`) and Dijkstra (`dijkstra.ts`)
- [x] Engine: Stage 3b merge sort (`mergeSort.ts`), Union-Find (`unionFind.ts`), Kruskal MST (`kruskal.ts`)
- [x] Engine: Stage 3d shared corridors with Set (`corridors.ts`)
- [x] Engine: Stage 3e connectivity check with Union-Find (`connectivity.ts`)
- [x] Engine: baseline comparison (`baseline.ts`)
- [x] Engine: orchestrator `runPipeline` (`index.ts`)
- [x] UI: Botanical field guide design tokens & theme
- [x] UI: Hero with animated network
- [x] UI: Problem section (Speaker 1, SDG 11.7 & 15)
- [x] UI: Solution in three stages (Speaker 2)
- [x] UI: DSA table (all 11 algorithms implemented, no quadtree/Steiner)
- [x] UI: Interactive demo with seed, New city, 4 sliders, Optimize, layer toggles, forest panel, animation
- [x] UI: Results section with metrics
- [x] UI: Close section, tech stack, team placeholders
- [x] Docs: `docs/VIVA.md` complete with viva Q&A
- [x] Tests: 11 Vitest test suites (26 tests passing)

### Phase 1 — Enhanced Experience [COMPLETED]
- [x] Stage 3c: Prim's O(V²) MST cross-check (`prim.ts`) with "Kruskal total = Prim total"
- [x] Step-through mode with dynamic real-data captions
- [x] Brushes (H, B, R, W, P, V) with click-drag painting
- [x] CSV import & export (`csv.ts`) with precise validation
- [x] Equal-coverage cost calculation
- [x] 20-seed live benchmark (mean ± SD)
- [x] URL hash sync

### Phase 2 & Google Maps Cartographic Upgrade [COMPLETED]
- [x] Google Maps Cartographic Palette (crisp white streets with gray casing, calm blue water, architectural building footprints, natural green parks)
- [x] Mouse wheel zoom in/out with cursor anchoring
- [x] Drag to pan across district
- [x] Floating `+` and `−` zoom buttons + Recenter button
- [x] Dynamic metric scale bar (e.g. 250 m, 500 m)
- [x] Top-left Mode Switcher (Standard Map vs Ecological View)
- [x] Numbered micro-forest place pins (🌲 `1`, `2`, `3`)
- [x] Google Maps-style InfoWindow hover tooltips & place inspection card
- [x] Knapsack DP table visualization
- [x] PNG / JSON export
