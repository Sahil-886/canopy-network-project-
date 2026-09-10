# CanopyNet — Algorithm Viva Guide & Presentation Script

A complete guide for second-year engineering students explaining the problem motivation, presentation delivery script, and all 11 core DSA concepts used in CanopyNet.

---

## 🎙️ Spoken Presentation Script (Memorize for Demo Day)

### SPEAKER 1 — Problem
> "Cities are planting micro-forests today — organizations like Afforestt and SayTrees use methods like Miyawaki forestry. But there's a gap: planting decisions are mostly manual, and forests often end up scattered — isolated green patches with no connection between them.
>
> That's a problem because wildlife needs corridors to move between habitats. A disconnected forest, no matter how rich, is still just an island.
>
> So we asked: *How do you decide where to plant, and how do you make sure what you plant connects into one living ecosystem — not isolated patches?*
>
> This ties directly to **SDG 11 — Sustainable Cities**, and **SDG 15 — Life on Land**."

---

### SPEAKER 2 — Solution
> "We treated this as a graph optimization problem, in three stages.
>
> **One — where to plant:** a **greedy set-cover algorithm** picks land patches giving maximum coverage with minimum overlap.
>
> **Two — what to plant:** a **knapsack-style DP** allocates species and budget across those patches to maximize biodiversity without overspending.
>
> **Three — our core idea — connecting them:** we treat each forest as a graph node and use **MST and Steiner tree logic** to link them with the shortest possible corridors, turning scattered patches into one connected green network. A **Union-Find** structure keeps checking that the whole network stays connected.
>
> Most tools stop at 'where to plant.' We go further — **connectivity matters as much as coverage**, because connected biodiversity scales, isolated biodiversity doesn't."

---

### BOTH — Close
> **Speaker 1:** "CanopyNet maximizes canopy cover, minimizes cost and land, and guarantees every patch stays connected."  
> **Speaker 2:** "It's a decision-support tool — any city or NGO can plug in real land data and get an optimized, connected forest plan out."  
> ***Both:*** "That's why we call it CanopyNet — not just forests, a network. Thank you."

---

## Quick Reference Table

| Concept | Used For | Time Complexity | Source File |
|---|---|---|---|
| **2D Array** | City district grid representation | $O(W \times H)$ | `src/engine/city.ts` |
| **BFS (Flood Fill)** | Finding plantable vacant plots & tiling | $O(W \times H)$ | `src/engine/plots.ts` |
| **Greedy Heuristic** | Budgeted set cover for plot selection | $O(k \cdot \|P\|)$ | `src/engine/greedy.ts` |
| **0/1 Knapsack (DP)** | Multi-layer native species pack mix | $O(N \cdot W)$ | `src/engine/knapsack.ts` |
| **Min-Heap** | Priority queue for Dijkstra's algorithm | $O(\log V)$ per operation | `src/engine/minHeap.ts` |
| **Dijkstra's Algorithm** | Least-cost corridor paths around buildings | $O(E \log V)$ per source | `src/engine/dijkstra.ts` |
| **Merge Sort** | Sorting plots and corridor edges | $O(E \log E)$ | `src/engine/mergeSort.ts` |
| **Union-Find (DSU)** | Cycle detection in Kruskal & habitat grouping | $O(\alpha(V))$ amortized | `src/engine/unionFind.ts` |
| **Kruskal's MST** | Linking all forests at minimum total cost | $O(E \log E)$ | `src/engine/kruskal.ts` |
| **Prim's MST** | Cross-check proving Kruskal correctness | $O(V^2)$ | `src/engine/prim.ts` |
| **Hash Set** | Counting overlapping corridor cells once | $O(L)$ where $L$ is path length | `src/engine/corridors.ts` |

---

## 1. 2D Array Grid Representation

- **Problem it solves:** Models the geographic landscape of the city (64×64 cells, each 25 m × 25 m) with land classifications and human population.
- **Input & Output:** Input is district dimensions and seed; output is contiguous typed arrays (`Uint8Array` for land types, `Uint16Array` for population).
- **Time Complexity:** $O(W \times H)$ memory allocation and sequential initialization.
- **One-line intuition:** A flattened 2D matrix where row-major indexing $(y \times W + x)$ provides $O(1)$ coordinate lookups with zero object overhead.

### Likely Viva Questions:
1. **Q: Why use flat typed arrays (`Uint8Array`) instead of a nested array of objects (`Cell[][]`)?**  
   *A:* Flat typed arrays allocate contiguous blocks of memory. This maximizes CPU cache locality, eliminates JavaScript garbage collection churn during animations, and executes lookups in nanoseconds.
2. **Q: How are 2D coordinates $(x, y)$ converted to a 1D array index?**  
   *A:* `index = y * width + x`. To convert back: `x = index % width`, `y = Math.floor(index / width)`.

---

## 2. Breadth-First Search (BFS Flood Fill)

- **Problem it solves:** Discovers contiguous vacant land patches and groups them into plantable plots. Large plots (>16 cells) are subdivided using 4×4 spatial tiles with internal BFS.
- **Input & Output:** Input: city land array. Output: array of `Plot` objects containing cell indices, area in $\text{m}^2$, cost, centroid coordinates, and sapling budget.
- **Time Complexity:** $O(W \times H)$ because each grid cell is enqueued and dequeued at most once.
- **One-line intuition:** Explores 4-connected vacant neighbours outward in concentric rings until boundary edges or occupied land are met.

### Likely Viva Questions:
1. **Q: Why use BFS instead of DFS (Depth-First Search) for flood fill here?**  
   *A:* BFS uses a FIFO queue, preventing call-stack overflow on large grids. It also discovers connected components level by level without deep recursion.
2. **Q: Why do we subdivide vacant components larger than 16 cells into 4×4 tiles?**  
   *A:* Miyawaki micro-forests are designed as dense, pocket-sized urban patches ($250\text{ m}^2$ to $10,000\text{ m}^2$). A massive contiguous vacant tract would consume the entire city budget for a single location; tiling breaks it into independent candidates while preserving internal contiguity.

---

## 3. Budgeted Greedy Set Cover

- **Problem it solves:** NP-hard budgeted maximum coverage problem: selects which candidate plots to plant so that the maximum number of residents live within 300 m of a forest, without exceeding the municipal budget.
- **Input & Output:** Input: candidate plots with precalculated coverage lists, city population, and budget. Output: ordered list of chosen plots and pick records.
- **Time Complexity:** $O(k \cdot |P|)$ where $k$ is the number of picks and $|P|$ is candidate plots.
- **One-line intuition:** At each round, buys the highest marginal coverage per rupee spent, then cross-checks against the single best plot.

### Likely Viva Questions:
1. **Q: Why is greedy not always mathematically optimal here?**  
   *A:* Budgeted maximum coverage is NP-hard (generalization of knapsack and set cover). Greedy can be tricked by picking small, cheap plots that yield high marginal ratios early on, leaving insufficient budget for a larger, highly beneficial plot.
2. **Q: How does CanopyNet protect against this "tiny cheap plot" failure mode?**  
   *A:* We implement the classic $(1 - 1/e) \approx 63\%$ approximation fix: after running the greedy loop, we compare the greedy solution's total reach with the single best affordable plot. Whichever covers more residents is returned.

---

## 4. 0/1 Knapsack Dynamic Programming

- **Problem it solves:** Allocates native species across four vertical forest layers (Canopy, Tree, Sub-tree, Shrub) to maximize biodiversity under each forest's specific sapling budget.
- **Input & Output:** Input: forest sapling budget, target saplings, 36 species packs (3 packs for each of 12 native species). Output: selected species packs, sapling counts, and total biodiversity points.
- **Time Complexity:** $O(N \cdot W)$ where $N = 36$ items and $W \le 1,000$ scaled budget units.
- **One-line intuition:** Fills a 2D recurrence table $dp[i][w] = \max(dp[i-1][w], dp[i-1][w - \text{cost}] + \text{value})$ and backtracks to recover the optimal species pack combination.

### Likely Viva Questions:
1. **Q: Why use Dynamic Programming instead of a greedy value-per-rupee heuristic for species selection?**  
   *A:* Greedy knapsack can get stuck with unused budget slack because species packs come in discrete indivisible costs. 0/1 Knapsack DP guarantees the exact mathematical optimum.
2. **Q: Why do repeat packs for the same species have diminishing values ($\times 10, \times 6, \times 3$)?**  
   *A:* In ecology and Miyawaki forestry, monoculture is fragile. Diminishing returns force the knapsack solver to spread the budget across multiple species and all 4 vertical layers.

---

## 5. Min-Heap (Priority Queue)

- **Problem it solves:** Maintains frontier nodes ordered by cumulative path resistance in Dijkstra's algorithm.
- **Input & Output:** Inserts `(cellIndex, priority)` pairs; extracts the minimum-priority item in $O(\log V)$ time.
- **Time Complexity:** $O(\log V)$ insertion (`push`), $O(\log V)$ extraction (`pop`), $O(1)$ minimum inspection (`peek`).
- **One-line intuition:** A complete binary tree where every parent node has a priority value less than or equal to its children.

### Likely Viva Questions:
1. **Q: What is the benefit of a Min-Heap over a simple array in Dijkstra's algorithm?**  
   *A:* An unsorted array requires an $O(V)$ scan to find the minimum distance vertex at every step ($O(V^2)$ total). A Min-Heap extracts the minimum in $O(\log V)$ time, speeding up the search by several orders of magnitude.
2. **Q: How is the binary heap indexed in a flat array?**  
   *A:* For node at index $i$: left child is at $2i + 1$, right child is at $2i + 2$, parent is at $\lfloor(i - 1) / 2\rfloor$.

---

## 6. Dijkstra's Shortest Path Algorithm

- **Problem it solves:** Discovers the least-resistance corridor route between micro-forests on a 4-connected grid, routing around buildings and residential blocks while penalizing road and water crossings.
- **Input & Output:** Input: city resistance surface, source forest cells. Output: shortest resistance distance and cell-by-cell path to all target forests.
- **Time Complexity:** $O(E \log V)$ where $V = W \times H$ cells and $E \le 4V$.
- **One-line intuition:** Multi-source wavefront expansion that relaxes cell distances along paths of least resistance.

### Likely Viva Questions:
1. **Q: Why use multi-source Dijkstra instead of single-point Dijkstra?**  
   *A:* A micro-forest occupies multiple cells. By initializing all cells of the source forest into the Min-Heap at distance 0, we find the shortest corridor between any cell of Forest A and any cell of Forest B.
2. **Q: What happens if a forest is completely surrounded by buildings?**  
   *A:* Since building cells have infinite resistance ($cost = \infty$), Dijkstra will never relax edges into them. The target forest remains at distance $\infty$, no edge is created, and the MST handles it gracefully as an unreachable component.

---

## 7. Merge Sort

- **Problem it solves:** Deterministically sorts corridor edges by cost (for Kruskal's MST) and candidate plots by area (for the baseline).
- **Input & Output:** Input: unsorted array with custom comparator function. Output: new array sorted in stable ascending/descending order.
- **Time Complexity:** $O(N \log N)$ worst-case, average-case, and best-case.
- **One-line intuition:** Recursively halves the array into single elements, then merges sorted halves back together in order.

### Likely Viva Questions:
1. **Q: Why use Merge Sort over Quicksort here?**  
   *A:* Merge Sort provides a guaranteed $O(N \log N)$ worst-case runtime (Quicksort can degrade to $O(N^2)$ on adversarial inputs) and is inherently stable, ensuring deterministic edge tie-breaking.
2. **Q: Does Merge Sort require extra memory?**  
   *A:* Yes, standard array-based merge sort requires $O(N)$ auxiliary space for merging subarrays. In our client-side app with $|E| \le 500$, this footprint is negligible (a few kilobytes).

---

## 8. Union-Find (Disjoint-Set Union / DSU)

- **Problem it solves:** Tracks connected components of micro-forests. Used in Kruskal's algorithm to detect cycles and in connectivity analysis under the wildlife travel limit.
- **Input & Output:** Elements are forest IDs. Supports `find(x)` with path compression and `union(x, y)` with rank heuristics.
- **Time Complexity:** Amortized $O(\alpha(V))$ per operation, where $\alpha$ is the inverse Ackermann function ($\alpha(V) < 5$ for all practical universe sizes).
- **One-line intuition:** Forest nodes point to parent pointers; path compression points every visited node directly to the set root.

### Likely Viva Questions:
1. **Q: What is path compression?**  
   *A:* During a `find(x)` call, after locating the root of the tree, all traversed nodes on the path have their parent pointers updated directly to point to that root. Future lookups take $O(1)$ time.
2. **Q: Why combine union by rank with path compression?**  
   *A:* Union by rank attaches the shallower tree to the root of the deeper tree, preventing pathological linear degenerate chains. Combined with path compression, it achieves the near-constant $\alpha(N)$ runtime.

---

## 9. Kruskal's Algorithm for Minimum Spanning Tree (MST)

- **Problem it solves:** Identifies the minimum total corridor cost required to connect all plantable micro-forests into a single continuous network.
- **Input & Output:** Input: list of forest nodes and candidate corridor edges. Output: subset of edges forming the Minimum Spanning Forest and the total cost.
- **Time Complexity:** $O(E \log E)$ dominated by sorting the edges with Merge Sort.
- **One-line intuition:** Iterates through edges from cheapest to most expensive, adding each edge if its endpoints belong to different Union-Find components.

### Likely Viva Questions:
1. **Q: Why use an MST instead of simply connecting each forest to its nearest neighbour?**  
   *A:* Connecting each forest to its nearest neighbour can create isolated small cycles and leave other forests completely disconnected, often costing more overall. Kruskal's MST is mathematically proven to connect all reachable nodes at the minimum global total cost.
2. **Q: What happens if the graph is disconnected (some forests cannot reach others)?**  
   *A:* Kruskal's algorithm automatically produces a Spanning Forest: it connects every component internally with an MST, resulting in multiple trees without failing or looping infinitely.

---

## 10. Prim's Algorithm (O(V²) Version)

- **Problem it solves:** Cross-checks and independently proves the correctness of Kruskal's MST calculation directly in the user interface.
- **Input & Output:** Input: node list and edge cost matrix. Output: total MST cost (which must equal the Kruskal total cost).
- **Time Complexity:** $O(V^2)$ where $V$ is the number of selected forests.
- **One-line intuition:** Grows a single tree outward from an initial node by repeatedly choosing the cheapest edge connecting an unvisited vertex to the current tree.

### Likely Viva Questions:
1. **Q: Why include both Kruskal and Prim in the same application?**  
   *A:* Demonstrates deep algorithmic mastery. In our evaluation UI, the live badge "Kruskal total = Prim total" acts as an automated runtime proof of correctness.
2. **Q: When is Prim's $O(V^2)$ algorithm preferred over Kruskal's $O(E \log E)$?**  
   *A:* For dense graphs where $E \approx V^2$, Kruskal takes $O(V^2 \log V)$ due to edge sorting, whereas simple matrix Prim takes $O(V^2)$, making Prim faster without requiring heap overhead.

---

## 11. Hash Set for Shared Corridors

- **Problem it solves:** When multiple MST corridor links overlap along the same physical city street or vacant alley, their footprint is shared. The hash set prevents double-counting physical construction length.
- **Input & Output:** Input: cell paths of all MST edges. Output: `Set<number>` of unique cell coordinates and deduplicated corridor length.
- **Time Complexity:** $O(L)$ where $L$ is the total sum of path lengths across all corridors; $O(1)$ average insertion per cell.
- **One-line intuition:** Inserting cell indices into a hash set collapses identical grid locations into a single unique record.

### Likely Viva Questions:
1. **Q: Why does shared corridor length matter in real urban planning?**  
   *A:* Digging utility trenches or planting native hedgerows along a road once provides a wildlife corridor for multiple forest pairs. Shared counting accurately reflects physical municipal expenditure.
2. **Q: How are road crossings counted?**  
   *A:* We iterate through the unique cells in the hash set: if `grid.land[cell] === LandType.ROAD`, we increment the road crossings counter.
