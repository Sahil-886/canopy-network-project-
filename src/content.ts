/**
 * All user-facing text copy, algorithm metadata, and TODO_OWNER placeholders for CanopyNet.
 * Adheres strictly to the two-speaker presentation structure and honest data rules.
 */

// =============================================================================
// TODO_OWNER PLACEHOLDERS (The only allowed placeholders in the project)
// =============================================================================
// TODO_OWNER: Team member names
// TODO_OWNER: College and course / hackathon name
// TODO_OWNER: Institution name
// TODO_OWNER: GitHub repository URL
// TODO_OWNER: Final cost figures sign-off
// TODO_OWNER: Species list sign-off
// =============================================================================

export const SITE = {
  title: 'CanopyNet',
  subtitle: 'Graph-based micro-forest optimization',
  headline: 'Not just forests, a network.',
  subline:
    'CanopyNet chooses where to plant micro-forests, what to plant in them, and how to connect them into one living network.',
  heroButton: 'Run the optimizer',
};

export const DATA_HONESTY_LABEL = 'Synthetic city, illustrative parameters';

export const PROBLEM = {
  title: 'The problem',
  speaker: 'Speaker 1: The urban forestry challenge',
  paragraphs: [
    'Urban areas around the world are facing intense heat-island effects and habitat loss. Micro-forests planted using methods like the Miyawaki technique are gaining momentum, spearheaded by organizations such as Afforestt and SayTrees. However, in crowded cities, these projects often end up as scattered, isolated green patches.',
    'A disconnected forest is an ecological island. Small birds, pollinators, and urban wildlife require continuous vegetative corridors to feed, disperse, and sustain gene flow. If two habitats are separated by unbroken concrete and high-speed roadways, wildlife cannot safely cross.',
    'Municipalities and conservation groups face two fundamental questions under constrained budgets: exactly where to plant to bring nature close to the maximum number of residents, and how to link those patches into a contiguous network.',
  ],
  sdgAlignment: [
    {
      goal: 'SDG 11',
      title: 'Sustainable Cities and Communities',
      description:
        'Target 11.7: By 2030, provide universal access to safe, inclusive, and accessible, green and public spaces, in particular for women and children, older persons, and persons with disabilities.',
    },
    {
      goal: 'SDG 15',
      title: 'Life on Land',
      description:
        'Target 15.5: Take urgent and significant action to reduce the degradation of natural habitats, halt the loss of biodiversity, and protect and prevent the extinction of threatened species.',
    },
  ],
};

export const SOLUTION = {
  title: 'The three-stage solution',
  speaker: 'Speaker 2: Algorithmic pipeline',
  keyIdea: 'Connectivity matters as much as coverage.',
  stages: [
    {
      id: 'stage-1',
      number: 'Stage 1',
      name: 'Where to plant',
      subheading: 'BFS vacant land grouping & budgeted greedy set cover',
      description:
        'We model the city as a 2D array. Breadth-First Search (BFS) flood fills contiguous vacant cells into candidate plots, subdividing large tracts via 4×4 spatial tiles. We compute each plot’s straight-line coverage within 300 m (the 3-30-300 urban forestry benchmark). A budgeted greedy set cover algorithm selects plots that cover the most unreached residents per rupee, then cross-checks against the single best plot.',
      whyAlgorithm:
        'Trying every combination of plots is exponentially slow (NP-hard). The greedy heuristic makes the locally optimal choice each round and runs in milliseconds.',
      stageIndex: 0,
    },
    {
      id: 'stage-2',
      number: 'Stage 2',
      name: 'What to plant',
      subheading: '0/1 knapsack dynamic programming across 4 vertical layers',
      description:
        'Each selected micro-forest receives a dedicated sapling budget proportional to its size and planting density (3–5 saplings/m²). We divide species into packs across four natural layers: Canopy, Tree, Sub-tree, and Shrub. A 0/1 knapsack dynamic programming algorithm allocates packs to maximize ecological biodiversity while enforcing diminishing returns for repeated species.',
      whyAlgorithm:
        'Greedy value-per-rupee can leave unused budget slack with discrete integer sapling packs. Dynamic programming guarantees the exact optimal mix without brute-force search.',
      stageIndex: 1,
    },
    {
      id: 'stage-3',
      number: 'Stage 3',
      name: 'How to connect',
      subheading: 'Dijkstra shortest paths, Kruskal MST, shared paths, and Union-Find',
      description:
        'We construct a resistance surface where buildings and homes are impassable walls, roads and water have cost penalties, and parks/vacant land are easiest to traverse. Multi-source Dijkstra with a Min-Heap computes least-resistance paths between all forests. Kruskal’s MST connects them at the minimum global corridor cost. Shared corridor stretches are deduplicated using a hash set. Finally, Union-Find tests connectivity under the wildlife travel limit, identifying isolated habitat clusters.',
      whyAlgorithm:
        'Dijkstra bends corridors naturally through alleys and roadside strips instead of ploughing through buildings. Kruskal’s MST links all reachable nodes without cycles at minimal expense.',
      stageIndex: 2,
    },
  ],
};

export const DSA_TABLE = [
  {
    concept: '2D Array',
    usedFor: 'City district grid and spatial state',
    whyHere: 'Cache-friendly representation of urban land types and human population',
    complexity: 'O(W × H)',
    file: 'src/engine/city.ts',
  },
  {
    concept: 'BFS (Flood Fill)',
    usedFor: 'Finding vacant plots & 4×4 tiling',
    whyHere: 'Discovers 4-connected vacant land components and subdivides large tracts',
    complexity: 'O(W × H)',
    file: 'src/engine/plots.ts',
  },
  {
    concept: 'Greedy Heuristic',
    usedFor: 'Budgeted set cover for plot selection',
    whyHere: 'Fast polynomial-time approximation for NP-hard budgeted maximum coverage',
    complexity: 'O(k · |P|)',
    file: 'src/engine/greedy.ts',
  },
  {
    concept: 'Merge Sort',
    usedFor: 'Sorting corridor edges and plots',
    whyHere: 'Guaranteed O(N log N) worst-case stable sort with deterministic tie-breaking',
    complexity: 'O(N log N)',
    file: 'src/engine/mergeSort.ts',
  },
  {
    concept: '0/1 Knapsack (DP)',
    usedFor: 'Native species mix per forest',
    whyHere: 'Mathematically exact budget allocation with diminishing biodiversity returns',
    complexity: 'O(N · W)',
    file: 'src/engine/knapsack.ts',
  },
  {
    concept: 'Min-Heap',
    usedFor: 'Priority queue inside Dijkstra',
    whyHere: 'Extracts minimum-resistance frontier cell in O(log V) time',
    complexity: 'O(log V)',
    file: 'src/engine/minHeap.ts',
  },
  {
    concept: 'Dijkstra’s Algorithm',
    usedFor: 'Cheapest corridor route around buildings',
    whyHere: 'Finds optimal paths over a non-uniform resistance grid avoiding walls',
    complexity: 'O(E log V)',
    file: 'src/engine/dijkstra.ts',
  },
  {
    concept: 'Kruskal’s MST',
    usedFor: 'Linking all forests at minimum total cost',
    whyHere: 'Connects all micro-forests into a unified graph with minimal total corridor resistance',
    complexity: 'O(E log E)',
    file: 'src/engine/kruskal.ts',
  },
  {
    concept: 'Prim’s MST (O(V²))',
    usedFor: 'Cross-checking Kruskal MST result',
    whyHere: 'Independent verification proving Kruskal total equals Prim total directly in UI',
    complexity: 'O(V²)',
    file: 'src/engine/prim.ts',
  },
  {
    concept: 'Union-Find (DSU)',
    usedFor: 'Connectivity check under travel limit',
    whyHere: 'Groups forests into connected wildlife components using near-constant time operations',
    complexity: 'O(α(V))',
    file: 'src/engine/connectivity.ts',
  },
  {
    concept: 'Hash Set',
    usedFor: 'Deduplicating shared corridor cells',
    whyHere: 'Counts overlapping corridor stretches once to report realistic physical construction footprint',
    complexity: 'O(L)',
    file: 'src/engine/corridors.ts',
  },
];

export const SPECIES_NOTE = 'Illustrative, to be validated by a botanist';

export const LIMITATIONS = [
  'Synthetic city with illustrative parameters, not actual municipal GIS land-use parcels.',
  'Coverage uses straight-line Euclidean distance rather than street-network walking distance.',
  'Two-stage heuristic: forest placement and corridor connectivity are solved sequentially, not jointly.',
  'Corridor construction cost is reported separately and not deducted from the initial planting budget.',
  'Land prep expenses, sapling costs, species weights, and resistance multipliers are illustrative assumptions.',
];

export const FUTURE_WORK = [
  'Direct ingestion of real municipal OpenStreetMap and GIS land-use GeoJSON layers.',
  'Pedestrian street-network isochrones replacing Euclidean radius buffers.',
  'Simultaneous joint optimization of plot placement and network corridor topology.',
  'Steiner-tree corridor networks with intermediate junction waypoints.',
  'Empirical ecological field validation with practicing urban arborists and foresters.',
];

export const BUILD_INFO = {
  stack: 'Vite, React 19, TypeScript (strict), Tailwind CSS, Canvas 2D, Vitest',
  execution: 'Runs entirely in your browser. 100% client-side with zero backend dependencies.',
  // TODO_OWNER: GitHub repo URL placeholder
  githubUrl: 'https://github.com/TODO_OWNER/canopy-network-maximizer',
};

export const TEAM_INFO = {
  // TODO_OWNER: Team member details
  members: [
    { name: 'TODO_OWNER', role: 'Algorithm Implementation & Frontend' },
    { name: 'TODO_OWNER', role: 'System Architecture & Modeling' },
  ],
  // TODO_OWNER: Course / Hackathon
  course: 'TODO_OWNER',
  // TODO_OWNER: College / Institution
  institution: 'TODO_OWNER',
};
