import { SOLUTION } from '../content';

interface MethodSectionProps {
  onSelectStage: (stageIndex: number) => void;
}

const FLOWCHART_STEPS = [
  {
    num: 1,
    title: 'Input & Discretization',
    algo: '2D Grid & Spatial Cells',
    desc: 'Divide city into uniform 25m cells (or Quadtree parcels in dense areas).',
    badge: 'Input',
    stageIndex: 0,
  },
  {
    num: 2,
    title: 'Land & Resistance Filter',
    algo: 'BFS & Resistance Matrix',
    desc: 'Exclude buildings, homes & water; isolate contiguous vacant plots.',
    badge: 'Filter',
    stageIndex: 0,
  },
  {
    num: 3,
    title: 'Budgeted Set Cover',
    algo: 'Greedy Approximation',
    desc: 'Pick plots maximizing newly reached residents within 300m per rupee.',
    badge: 'Stage 1',
    stageIndex: 0,
  },
  {
    num: 4,
    title: 'Species Allocation',
    algo: '0/1 Knapsack (DP)',
    desc: 'Allocate native species across 4 vertical layers for maximal biodiversity.',
    badge: 'Stage 2',
    stageIndex: 1,
  },
  {
    num: 5,
    title: 'Corridor Routing',
    algo: 'Dijkstra + Kruskal MST',
    desc: 'Route corridors around buildings; link forests at lowest total cost.',
    badge: 'Stage 3',
    stageIndex: 2,
  },
  {
    num: 6,
    title: 'Validate Connectivity',
    algo: 'Union-Find (DSU)',
    desc: 'Check wildlife dispersal limit; identify clusters and Steiner junctions.',
    badge: 'Verification',
    stageIndex: 2,
  },
];

export default function MethodSection({ onSelectStage }: MethodSectionProps) {
  const handleStageClick = (stageIndex: number) => {
    onSelectStage(stageIndex);
    const demoEl = document.getElementById('demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="solution" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded bg-[#1F6B45]/10 text-[#1F6B45] font-mono text-xs font-bold tracking-wider uppercase">
              {SOLUTION.speaker}
            </span>
            <span className="text-xs text-[#3D5A49] font-sans">
              Oral Presentation &bull; Graph Optimization Pipeline
            </span>
          </div>

          <h2 className="section-title mb-6">{SOLUTION.title}</h2>

          {/* Spoken Narrative Card */}
          <div className="bg-white border-l-4 border-[#1F6B45] rounded-r-xl p-6 sm:p-8 shadow-sm mb-6 space-y-3">
            <p className="text-base text-[#1C3527] leading-relaxed">
              &ldquo;We treated this as a graph optimization problem, in three stages:
            </p>
            <ul className="space-y-2 text-sm text-[#1C3527] pl-2">
              <li>
                <strong>One &mdash; where to plant:</strong> a <span className="font-semibold text-[#1F6B45]">greedy set-cover algorithm</span> picks land patches giving maximum coverage with minimum overlap.
              </li>
              <li>
                <strong>Two &mdash; what to plant:</strong> a <span className="font-semibold text-[#1F6B45]">knapsack-style DP</span> allocates species and budget across those patches to maximize biodiversity without overspending.
              </li>
              <li>
                <strong>Three &mdash; our core idea &mdash; connecting them:</strong> we treat each forest as a graph node and use <span className="font-semibold text-[#1F6B45]">MST and Steiner tree logic</span> to link them with the shortest possible corridors, turning scattered patches into one connected green network. A <strong>Union-Find</strong> structure keeps checking that the whole network stays connected.
              </li>
            </ul>
            <div className="p-3.5 rounded-lg bg-[#F5F6F0] border border-[#D7DECE] mt-3">
              <p className="text-base font-serif italic text-[#1F6B45] font-bold leading-snug">
                &ldquo;Most tools stop at &lsquo;where to plant.&rsquo; We go further &mdash; connectivity matters as much as coverage, because connected biodiversity scales, isolated biodiversity doesn&rsquo;t.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* 6-Step End-to-End Flowchart Diagram */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1C3527]">
              End-to-End Algorithmic Pipeline Flowchart
            </span>
            <span className="text-xs text-[#3D5A49]">Click any step to inspect in the interactive simulator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {FLOWCHART_STEPS.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => handleStageClick(step.stageIndex)}
                className="cursor-pointer group relative p-3.5 rounded-lg bg-white border border-[#D7DECE] hover:border-[#1F6B45] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#E7ECE2] text-[#1F6B45] group-hover:bg-[#1F6B45] group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-semibold text-[#3D5A49] px-1.5 py-0.5 rounded bg-[#F5F6F0] border border-[#D7DECE]">
                      {step.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1C3527] group-hover:text-[#1F6B45] transition-colors leading-tight mb-1">
                    {step.title}
                  </h4>
                  <div className="text-[11px] font-mono font-semibold text-[#B7791F] mb-1.5">
                    {step.algo}
                  </div>
                  <p className="text-xs text-[#3D5A49] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#1F6B45] font-semibold">
                  <span>Simulate Step &rarr;</span>
                  {idx < FLOWCHART_STEPS.length - 1 && (
                    <span className="hidden lg:inline text-gray-300 font-bold">&rsaquo;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The 3 Core Academic Pitch Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SOLUTION.stages.map((stage) => (
            <div
              key={stage.id}
              className="field-panel flex flex-col justify-between hover:border-[#1F6B45] transition-colors bg-white rounded-lg shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1F6B45] uppercase tracking-wide">
                    {stage.number}
                  </span>
                  <span className="text-xs text-[#3D5A49] font-mono">
                    Phase {stage.stageIndex + 1}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1C3527] mb-2">
                  {stage.name}
                </h3>
                <div className="text-xs font-semibold text-[#1C3527] mb-3 pb-2 border-b border-[#D7DECE]">
                  {stage.subheading}
                </div>
                <p className="text-sm text-[#3D5A49] leading-relaxed mb-4">
                  {stage.description}
                </p>
                <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE] text-xs text-[#1C3527] italic mb-6">
                  <strong>Why this algorithm:</strong> {stage.whyAlgorithm}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStageClick(stage.stageIndex)}
                className="btn-outline w-full text-center"
              >
                Inspect {stage.number} in Demo &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
