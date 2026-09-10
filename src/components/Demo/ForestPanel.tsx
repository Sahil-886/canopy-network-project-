import { useState, useMemo } from 'react';
import type { Plot, SpeciesAllocation } from '../../engine/types';
import { getKnapsackTable } from '../../engine/knapsack';

interface ForestPanelProps {
  forest: Plot;
  allocation?: SpeciesAllocation;
  newlyCoveredCount: number;
  onClose: () => void;
}

export default function ForestPanel({
  forest,
  allocation,
  newlyCoveredCount,
  onClose,
}: ForestPanelProps) {
  const [showDpTable, setShowDpTable] = useState(false);

  const dpData = useMemo(() => {
    if (!showDpTable) return null;
    return getKnapsackTable(forest, 3);
  }, [forest, showDpTable]);

  return (
    <div className="field-panel border-[#1F6B45] my-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#D7DECE] pb-3 mb-4">
        <div>
          <span className="text-xs font-bold text-[#1F6B45] uppercase tracking-wide">
            Selected Micro-Forest #{forest.id}
          </span>
          <h4 className="text-lg font-serif font-bold text-[#1C3527]">
            Miyawaki Forest Profile
          </h4>
          <span className="text-xs text-[#3D5A49]">
            Centroid: ({forest.cx.toFixed(1)}, {forest.cy.toFixed(1)}) &bull; {forest.cells.length} cells
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#3D5A49] hover:text-[#1C3527] text-lg font-bold p-1 leading-none"
          aria-label="Close forest details panel"
        >
          &times;
        </button>
      </div>

      {/* Key Forest Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE]">
          <span className="text-xs text-[#3D5A49] block">Planted Area</span>
          <span className="text-base font-bold text-[#1C3527]">
            {forest.areaM2.toLocaleString()} m&sup2;
          </span>
        </div>
        <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE]">
          <span className="text-xs text-[#3D5A49] block">Total Cost</span>
          <span className="text-base font-bold text-[#1C3527]">
            &#8377;{(forest.cost / 100_000).toFixed(2)} lakh
          </span>
        </div>
        <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE]">
          <span className="text-xs text-[#3D5A49] block">New Residents Covered</span>
          <span className="text-base font-bold text-[#1F6B45]">
            +{newlyCoveredCount.toLocaleString()}
          </span>
        </div>
        <div className="p-2.5 rounded bg-[#F5F6F0] border border-[#D7DECE]">
          <span className="text-xs text-[#3D5A49] block">Biodiversity Score</span>
          <span className="text-base font-bold text-[#B7791F]">
            {allocation ? allocation.biodiversityScore : '—'} pts
          </span>
        </div>
      </div>

      {/* Species Knapsack Breakdown */}
      {allocation && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-[#1C3527] uppercase tracking-wider">
              Stage 2 0/1 Knapsack Native Species Mix ({allocation.speciesCount} species, {allocation.layersCovered}/4 layers)
            </h5>
            <button
              type="button"
              onClick={() => setShowDpTable(!showDpTable)}
              className="text-xs font-semibold text-[#1F6B45] hover:underline"
            >
              {showDpTable ? 'Hide DP Grid' : 'View DP Knapsack Grid &rarr;'}
            </button>
          </div>

          <div className="overflow-x-auto border border-[#D7DECE] rounded bg-[#F5F6F0]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E7ECE2] text-[#1C3527] border-b border-[#D7DECE]">
                  <th className="p-2">Species</th>
                  <th className="p-2">Layer</th>
                  <th className="p-2 text-right">Saplings</th>
                  <th className="p-2 text-right">Est. Sapling Cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allocation.saplingsPerSpecies)
                  .filter(([_, count]) => count > 0)
                  .map(([name, count]) => {
                    const samplePack = allocation.packs.find((p) => p.species.name === name);
                    const layer = samplePack?.species.layer ?? 'Tree';
                    const price = samplePack?.species.saplingPrice ?? 100;
                    return (
                      <tr key={name} className="border-b border-[#D7DECE]/60 hover:bg-[#E7ECE2]/50">
                        <td className="p-2 font-medium text-[#1C3527]">{name}</td>
                        <td className="p-2 text-[#3D5A49]">{layer}</td>
                        <td className="p-2 text-right font-mono font-semibold text-[#1C3527]">{count}</td>
                        <td className="p-2 text-right font-mono text-[#3D5A49]">&#8377;{(count * price).toLocaleString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Educational DP Table Visualizer */}
          {showDpTable && dpData && (
            <div className="mt-4 p-3 rounded bg-[#F5F6F0] border border-[#D7DECE]">
              <div className="text-xs font-bold text-[#1C3527] mb-1">
                Dynamic Programming Grid: Recurrence Table [Item &times; Scaled Budget]
              </div>
              <p className="text-xs text-[#3D5A49] mb-3">
                dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight_i] + value_i). Downscaled capacity W = {dpData.W}, showing optimal sub-structure.
              </p>
              <div className="max-h-48 overflow-auto border border-[#D7DECE] rounded text-[10px] font-mono bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#E7ECE2] sticky top-0">
                      <th className="p-1 border border-[#D7DECE]">Item</th>
                      {Array.from({ length: Math.min(15, dpData.W + 1) }, (_, w) => (
                        <th key={w} className="p-1 border border-[#D7DECE] text-center">
                          w={w * Math.max(1, Math.floor(dpData.W / 14))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dpData.packs.slice(0, 10).map((pack, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-1 border border-[#D7DECE] font-semibold truncate max-w-[120px]">
                          {pack.species.name} (P{pack.packIndex + 1})
                        </td>
                        {Array.from({ length: Math.min(15, dpData.W + 1) }, (_, col) => {
                          const wIdx = col * Math.max(1, Math.floor(dpData.W / 14));
                          const val = dpData.dp[i + 1]?.[wIdx] ?? 0;
                          return (
                            <td key={col} className="p-1 border border-[#D7DECE] text-center text-[#1C3527]">
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
