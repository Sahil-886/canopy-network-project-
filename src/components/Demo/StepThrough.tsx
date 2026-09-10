import type { PipelineResult } from '../../engine/types';

interface StepThroughProps {
  currentStep: number;
  totalSteps: number;
  result: PipelineResult | null;
  onStepChange: (step: number) => void;
  onExit: () => void;
}

export default function StepThrough({
  currentStep,
  totalSteps,
  result,
  onStepChange,
  onExit,
}: StepThroughProps) {
  if (!result) return null;

  // Build real-data dynamic captions for each step
  const getStepCaption = (step: number): { stage: string; title: string; caption: string } => {
    switch (step) {
      case 1:
        return {
          stage: 'Stage 1a',
          title: 'BFS Vacant Plot Detection',
          caption: `2D array BFS flood fill identified ${result.plots.length} candidate micro-forest plots, subdividing large tracts via 4×4 spatial tiles.`,
        };
      case 2:
        return {
          stage: 'Stage 1b',
          title: '300 m Spatial Reach Buffers',
          caption: `Computed residential population within straight-line 300 m radius for all candidate plots; ${result.initialCoveredHomes.size} homes were already reached by existing parks.`,
        };
      case 3: {
        const topPick = result.picks[0];
        const lastPick = result.picks[result.picks.length - 1];
        const pickSummary = lastPick
          ? `Selected ${result.picks.length} plots by marginal gain: Pick 1 covered +${topPick?.newlyCoveredResidents.toLocaleString()} residents, and final pick added +${lastPick.newlyCoveredResidents.toLocaleString()} residents.`
          : 'Greedy set cover selected optimal micro-forest sites within budget.';
        return {
          stage: 'Stage 1c',
          title: 'Budgeted Greedy Set Cover',
          caption: pickSummary,
        };
      }
      case 4: {
        const totalSaplings = result.metrics.totalSaplings;
        const bio = result.metrics.totalBiodiversity;
        return {
          stage: 'Stage 2a',
          title: '0/1 Knapsack Native Species Mix',
          caption: `Knapsack DP allocated ${totalSaplings.toLocaleString()} saplings across ${result.metrics.speciesCount} native species and ${result.metrics.layersCovered}/4 layers, yielding ${bio.toLocaleString()} biodiversity points.`,
        };
      }
      case 5:
        return {
          stage: 'Stage 3a',
          title: 'Dijkstra Least-Cost Corridors',
          caption: `Multi-source Dijkstra routed corridors along roads and alleys, successfully navigating around ${result.selectedPlots.length} forests without breaching building walls.`,
        };
      case 6:
        return {
          stage: 'Stage 3b & 3c',
          title: 'Kruskal MST & Prim Cross-Check',
          caption: `Kruskal MST formed minimum-cost corridors; Prim's simple O(V²) cross-check confirmed exact equivalence (${result.metrics.mstCost.toFixed(0)} = ${result.primTotalCost.toFixed(0)}).`,
        };
      case 7: {
        const numGroups = result.groups.length;
        const groupText = numGroups === 1
          ? 'Formed 1 contiguous connected wildlife network under the travel limit.'
          : `Split into ${numGroups} isolated habitat groups under the travel limit; non-viable links dashed in Plum.`;
        return {
          stage: 'Stage 3d & 3e',
          title: 'Consolidated Paths & Connectivity Check',
          caption: `${groupText} Hash set consolidated ${result.sharedCorridor.lengthBeforeM.toLocaleString()} m of corridors into ${result.sharedCorridor.lengthAfterM.toLocaleString()} m of shared footprint.`,
        };
      }
      default:
        return {
          stage: 'Overview',
          title: 'Complete Optimized Network',
          caption: 'All algorithmic stages assembled. Toggle individual layers below or inspect specific micro-forests by clicking.',
        };
    }
  };

  const { stage, title, caption } = getStepCaption(currentStep);

  return (
    <div className="mb-4 p-4 rounded bg-[#E7ECE2] border-l-4 border-[#1F6B45] border-y border-r border-[#D7DECE] shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1F6B45] text-[#F5F6F0] uppercase tracking-wide">
            {stage}
          </span>
          <span className="text-sm font-serif font-bold text-[#1C3527]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-40 disabled:pointer-events-none"
          >
            &larr; Prev
          </button>
          <span className="text-xs font-mono text-[#3D5A49] px-2">
            {currentStep}/{totalSteps}
          </span>
          <button
            type="button"
            onClick={() => onStepChange(Math.min(totalSteps, currentStep + 1))}
            disabled={currentStep === totalSteps}
            className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-40 disabled:pointer-events-none"
          >
            Next &rarr;
          </button>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-[#8E3B6E] font-semibold hover:underline ml-2"
            >
              Exit Tour
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-[#1C3527] leading-relaxed">
        {caption}
      </p>

      {/* Step indicator dots */}
      <div className="flex gap-1.5 mt-3">
        {Array.from({ length: totalSteps + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onStepChange(i)}
            title={`Jump to step ${i}`}
            className={`h-1.5 rounded-full transition-all ${
              currentStep === i
                ? 'w-6 bg-[#1F6B45]'
                : 'w-2 bg-[#D7DECE] hover:bg-[#A8C39A]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
