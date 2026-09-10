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
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4 my-4">
      {/* Google Maps Style Place Card Header */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            🌲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-gray-900">
                Micro-Forest #{forest.id}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                Miyawaki Reserve
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              Coordinates: ({forest.cx.toFixed(1)}, {forest.cy.toFixed(1)}) &bull; {forest.cells.length} cells
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 leading-none rounded hover:bg-gray-100"
          aria-label="Close forest details card"
        >
          &times;
        </button>
      </div>

      {/* Place Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-2.5 rounded-md bg-[#F9FAFB] border border-gray-200">
          <span className="text-[11px] font-medium text-gray-500 block">Total Area</span>
          <span className="text-sm font-bold text-gray-900">
            {forest.areaM2.toLocaleString()} m&sup2;
          </span>
        </div>
        <div className="p-2.5 rounded-md bg-[#F9FAFB] border border-gray-200">
          <span className="text-[11px] font-medium text-gray-500 block">Planting Cost</span>
          <span className="text-sm font-bold text-gray-900">
            &#8377;{(forest.cost / 100_000).toFixed(2)} lakh
          </span>
        </div>
        <div className="p-2.5 rounded-md bg-[#F9FAFB] border border-gray-200">
          <span className="text-[11px] font-medium text-gray-500 block">New Population Reach</span>
          <span className="text-sm font-bold text-[#2E7D32]">
            +{newlyCoveredCount.toLocaleString()} residents
          </span>
        </div>
        <div className="p-2.5 rounded-md bg-[#F9FAFB] border border-gray-200">
          <span className="text-[11px] font-medium text-gray-500 block">Biodiversity Score</span>
          <span className="text-sm font-bold text-[#E67E22]">
            {allocation ? allocation.biodiversityScore : '—'} pts
          </span>
        </div>
      </div>

      {/* Native Species Mix Allocation */}
      {allocation && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Species Composition ({allocation.speciesCount} species, {allocation.layersCovered}/4 layers)
            </h5>
            <button
              type="button"
              onClick={() => setShowDpTable(!showDpTable)}
              className="text-xs font-semibold text-[#1F6B45] hover:underline"
            >
              {showDpTable ? 'Hide Knapsack DP Grid' : 'Inspect 0/1 Knapsack DP Grid &rarr;'}
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-md bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] text-gray-700 border-b border-gray-200">
                  <th className="p-2 font-semibold">Native Species</th>
                  <th className="p-2 font-semibold">Canopy Layer</th>
                  <th className="p-2 font-semibold text-right">Saplings</th>
                  <th className="p-2 font-semibold text-right">Sapling Budget</th>
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
                      <tr key={name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-2 font-medium text-gray-900">{name}</td>
                        <td className="p-2 text-gray-600">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700">
                            {layer}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-gray-900">{count}</td>
                        <td className="p-2 text-right font-mono text-gray-600">&#8377;{(count * price).toLocaleString()}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Educational DP Table Visualizer */}
          {showDpTable && dpData && (
            <div className="mt-3 p-3 rounded-md bg-[#F9FAFB] border border-gray-200">
              <div className="text-xs font-bold text-gray-900 mb-1">
                Dynamic Programming Grid: Recurrence Table [Item &times; Scaled Budget]
              </div>
              <p className="text-xs text-gray-600 mb-2.5">
                dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight_i] + value_i). Downscaled capacity W = {dpData.W}, demonstrating mathematical optimality.
              </p>
              <div className="max-h-48 overflow-auto border border-gray-200 rounded text-[10px] font-mono bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 sticky top-0">
                      <th className="p-1 border border-gray-200">Item</th>
                      {Array.from({ length: Math.min(15, dpData.W + 1) }, (_, w) => (
                        <th key={w} className="p-1 border border-gray-200 text-center">
                          w={w * Math.max(1, Math.floor(dpData.W / 14))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dpData.packs.slice(0, 10).map((pack, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-1 border border-gray-200 font-semibold truncate max-w-[120px]">
                          {pack.species.name} (P{pack.packIndex + 1})
                        </td>
                        {Array.from({ length: Math.min(15, dpData.W + 1) }, (_, col) => {
                          const wIdx = col * Math.max(1, Math.floor(dpData.W / 14));
                          const val = dpData.dp[i + 1]?.[wIdx] ?? 0;
                          return (
                            <td key={col} className="p-1 border border-gray-200 text-center text-gray-900">
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
