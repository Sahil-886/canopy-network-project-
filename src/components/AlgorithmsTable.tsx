import { DSA_TABLE, BUILD_INFO } from '../content';

const HIGHLIGHT_CARDS = [
  {
    concept: '2D Spatial Grid & Quadtree',
    step: 'Input & Discretization',
    whyHere: 'Discretizes irregular city terrain into constant-time coordinate lookups without KD-tree overhead on regular lattices.',
    complexity: 'O(W × H)',
    color: '#1F6B45',
  },
  {
    concept: 'Budgeted Greedy Set Cover',
    step: 'Where to Plant',
    whyHere: 'Polynomial-time (1 - 1/e) approximation for NP-hard maximum coverage: picks highest new residents per rupee.',
    complexity: 'O(k · |P|)',
    color: '#3DA56A',
  },
  {
    concept: '0/1 Knapsack Dynamic Programming',
    step: 'What to Plant',
    whyHere: 'Discrete integer budget allocation; greedy heuristic leaves slack, but DP guarantees exact mathematical biodiversity maximum.',
    complexity: 'O(N · W)',
    color: '#B7791F',
  },
  {
    concept: 'Dijkstra + Kruskal MST',
    step: 'How to Connect',
    whyHere: 'Multi-source Dijkstra routes around buildings; Kruskal links all micro-forests at minimal global corridor resistance without cycles.',
    complexity: 'O(E log E)',
    color: '#E67E22',
  },
  {
    concept: 'Union-Find & Steiner Stepping Stones',
    step: 'Validate Connectivity',
    whyHere: 'Tracks disconnected habitat clusters under the wildlife travel limit with near-constant time α(V) disjoint-set operations.',
    complexity: 'O(α(V))',
    color: '#8E3B6E',
  },
];

export default function AlgorithmsTable() {
  return (
    <section id="algorithms" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="text-column mb-8">
          <span className="section-tag">Computer Science Architecture</span>
          <h2 className="section-title">Data Structures &amp; Algorithms Used</h2>
          <p className="text-base text-[#3D5A49] leading-relaxed">
            CanopyNet uses standard second-year DSA topics to solve real urban-forestry challenges. Every algorithm is handwritten from scratch in pure TypeScript.
          </p>
        </div>

        {/* Short Highlight Cards with "Why Here" Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {HIGHLIGHT_CARDS.map((card, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-white border border-[#D7DECE] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D5A49]">
                    {card.step}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#1F6B45]">
                    {card.complexity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1C3527] mb-2 font-serif">
                  {card.concept}
                </h3>
                <div className="p-2.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#1C3527] leading-relaxed">
                  <span className="font-bold text-[#1F6B45]">Why here: </span>
                  {card.whyHere}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Comprehensive Specimen Table */}
        <div className="overflow-x-auto shadow-xs rounded border border-[#D7DECE]">
          <table className="specimen-table">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Used For</th>
                <th>Why Here</th>
                <th>Time Complexity</th>
                <th>Source Code</th>
              </tr>
            </thead>
            <tbody>
              {DSA_TABLE.map((item, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-[#1C3527] whitespace-nowrap">
                    {item.concept}
                  </td>
                  <td className="text-sm text-[#1C3527]">
                    {item.usedFor}
                  </td>
                  <td className="text-xs text-[#3D5A49] leading-relaxed">
                    {item.whyHere}
                  </td>
                  <td className="font-mono text-xs text-[#1F6B45] font-semibold whitespace-nowrap">
                    {item.complexity}
                  </td>
                  <td className="text-xs whitespace-nowrap">
                    <a
                      href={`${BUILD_INFO.githubUrl}/blob/main/${item.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#1F6B45]"
                    >
                      {item.file.split('/').pop()}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="figure-caption">
          Table 1: Exhaustive DSA inventory of the CanopyNet client-side optimization engine.
        </p>
      </div>
    </section>
  );
}
