# CanopyNet

> **"Not just forests, a network."**  
> Graph-based micro-forest optimization answering: where to plant, what to plant, and how to connect.

---

## TODO_OWNER Checklist
The following fields in `src/content.ts` require owner completion before academic evaluation or presentation:
- [ ] **Team Members**: Fill in student names and roles in `TEAM_INFO` (`src/content.ts`).
- [ ] **Course and Institution**: Specify degree course, semester, and college name in `TEAM_INFO` (`src/content.ts`).
- [ ] **GitHub Repository**: Update official repository URL in `BUILD_INFO` (`src/content.ts`).
- [ ] **Cost Figures Sign-Off**: Confirm or tune preparation cost per m² (`PREP_COST_PER_M2 = 80`) and sapling prices in `src/engine/config.ts`.
- [ ] **Botanical Species Sign-Off**: Verification of the 12 illustrative species and ecological weights by a botanist in `src/engine/config.ts`.

---

## 1. Product Overview
CanopyNet addresses three critical questions in urban forestry:
1. **Where to plant**: which vacant plots become Miyawaki-style micro-forests so the most residents live within 300 m of a forest, within a fixed municipal budget.
2. **What to plant**: which species mix gives each forest the most multi-layer biodiversity within its sapling budget.
3. **How to connect**: which corridors link the forests into one continuous network at the minimum total cost, and which forests remain isolated.

The application mirrors a two-speaker academic pitch:
- **Speaker 1 (The Problem)**: Unconnected micro-forests become ecological islands. Habitat corridors are essential for urban wildlife and biodiversity (aligned with SDG 11.7 and SDG 15.5).
- **Speaker 2 (The Solution)**: A 3-stage DSA pipeline combining Breadth-First Search, budgeted greedy set cover, 0/1 knapsack dynamic programming, Dijkstra's shortest paths, Kruskal's MST, Prim's O(V²) cross-check, shared corridor hash sets, and Union-Find connectivity analysis.

---

## 2. Algorithm Scope (Second-Year DSA Focus)

Every algorithm is written by hand in pure TypeScript with zero third-party graph or math libraries.

| Concept | Used For | Time Complexity | File |
|---|---|---|---|
| **2D Array** | The city district grid (64×64 cells, each 25 m × 25 m) | $O(W \times H)$ | `src/engine/city.ts` |
| **BFS (Flood Fill)** | Finding vacant plots; 4×4 tiling for >16 cells | $O(W \times H)$ | `src/engine/plots.ts` |
| **Greedy Heuristic** | Choosing plots under budget (set cover) with single-best comparison | $O(k \cdot \|P\|)$ | `src/engine/greedy.ts` |
| **Merge Sort** | Sorting corridor edges and plots stably | $O(E \log E)$ | `src/engine/mergeSort.ts` |
| **0/1 Knapsack (DP)** | Species mix per forest across 4 vertical canopy layers | $O(N \cdot W)$ | `src/engine/knapsack.ts` |
| **Min-Heap** | Priority queue inside Dijkstra's algorithm | $O(\log V)$ | `src/engine/minHeap.ts` |
| **Dijkstra's Algorithm** | Cheapest corridor route around buildings on 4-connected grid | $O(E \log V)$ | `src/engine/dijkstra.ts` |
| **Kruskal's MST** | Linking all reachable forests at minimum total cost | $O(E \log E)$ | `src/engine/kruskal.ts` |
| **Prim's MST (O(V²))** | Cross-check verifying "Kruskal total = Prim total" | $O(V^2)$ | `src/engine/prim.ts` |
| **Union-Find (DSU)** | Cycle prevention in Kruskal & connectivity check under travel limit | $O(\alpha(V))$ | `src/engine/unionFind.ts`, `src/engine/connectivity.ts` |
| **Hash Set** | Counting overlapping shared corridor cells once | $O(L)$ | `src/engine/corridors.ts` |

For an in-depth oral examination preparation guide, see [`docs/VIVA.md`](docs/VIVA.md).

---

## 3. Key Interactive Features

- **Client-Side Simulation**: 100% client-side, 0 API keys or server runtime fetches. Deterministic seeded PRNG (Mulberry32).
- **Botanical Field Guide Aesthetics**: Curated color palette (Paper `#F5F6F0`, Sage `#E7ECE2`, Pine `#1C3527`, Forest `#1F6B45`, Leaf `#3DA56A`, Moss `#A8C39A`, Ochre `#B7791F`, Plum `#8E3B6E`).
- **Interactive Land Painting**: Click-drag painting with 6 land brushes (Homes, Building, Road, Water, Park, Vacant).
- **Custom CSV Import & Export**: Import arbitrary rectangular land maps (16×16 to 100×100) with character validation; export current grid as a template.
- **Guided 7-Step Walkthrough**: Previous/Next navigation with real-data dynamic captions.
- **Forest Inspection & DP Table**: Click any forest to view sapling allocation and inspect the 2D dynamic programming grid.
- **20-Seed Live Benchmark**: Background execution computing mean $\pm$ standard deviation across 20 synthetic cities.
- **Live Equivalence Proof**: Built-in runtime check demonstrating Kruskal MST total equals Prim MST total.

---

## 4. Getting Started

### Prerequisites
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0

### Commands
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Vitest test suite (all 11 test suites)
npm test

# Build production bundle
npm run build
```

---

## 5. Honest Data & Limitations
- **Data Honesty**: All numbers and metrics are computed dynamically at runtime and labeled: *"Synthetic city, illustrative parameters"*.
- **Distance Metric**: Reach is measured via Euclidean straight-line distance, not walking-network distance.
- **Sequential Heuristic**: Forest placement is solved first, followed by corridor networking, rather than joint placement-connectivity co-optimization.
- **Cost Independence**: Corridor construction expenses are reported separately and not deducted from the initial planting budget.
- **Future Directions**: Integration with real municipal OpenStreetMap GIS GeoJSON data, walking network isochrones, and field validation with practicing arborists.
