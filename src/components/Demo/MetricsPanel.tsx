import type { PipelineResult } from '../../engine/types';

interface MetricsPanelProps {
  result: PipelineResult;
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function pct(n: number): string {
  return n.toFixed(1) + '%';
}

function lakh(n: number): string {
  return '₹' + (n / 100_000).toFixed(1) + ' lakh';
}

export default function MetricsPanel({ result }: MetricsPanelProps) {
  const { metrics: m, baseline: b, primTotalCost, equalCoverage } = result;

  const primMatchesKruskal = Math.abs(m.mstCost - primTotalCost) < 0.001;

  const deltaResidents = m.coveredAfter - b.coveredAfter;
  const deltaPct = m.coveragePctAfter - b.coveragePctAfter;

  const comparisonRows = [
    {
      label: 'Residents within 300 m of green space',
      optimized: `${fmt(m.coveredAfter)} (${pct(m.coveragePctAfter)})`,
      baseline: `${fmt(b.coveredAfter)} (${pct(b.coveragePctAfter)})`,
      delta: `${deltaResidents >= 0 ? '+' : ''}${fmt(deltaResidents)} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)} pp)`,
      isPositive: deltaResidents >= 0,
    },
    {
      label: 'Initial coverage (parks only)',
      optimized: `${fmt(m.coveredBefore)} (${pct(m.coveragePctBefore)})`,
      baseline: `${fmt(b.coveredBefore)} (${pct(b.coveragePctBefore)})`,
      delta: '—',
      isPositive: true,
    },
    {
      label: 'Micro-forests selected',
      optimized: `${m.plotsSelected} plots`,
      baseline: `${b.plotsSelected} plots`,
      delta: `${m.plotsSelected - b.plotsSelected >= 0 ? '+' : ''}${m.plotsSelected - b.plotsSelected}`,
      isPositive: true,
    },
    {
      label: 'Planted micro-forest area',
      optimized: `${fmt(m.plantedAreaM2)} m²`,
      baseline: `${fmt(b.plantedAreaM2)} m²`,
      delta: `${m.plantedAreaM2 - b.plantedAreaM2 >= 0 ? '+' : ''}${fmt(m.plantedAreaM2 - b.plantedAreaM2)} m²`,
      isPositive: true,
    },
    {
      label: 'Planting expenditure',
      optimized: `${lakh(m.totalCost)} (Budget: ₹${m.budgetLakh}L)`,
      baseline: `${lakh(b.totalCost)} (Budget: ₹${b.budgetLakh}L)`,
      delta: lakh(m.totalCost - b.totalCost),
      isPositive: true,
    },
    {
      label: 'District green cover (secondary)',
      optimized: `${pct(m.greenCoverPctAfter)} (was ${pct(m.greenCoverPctBefore)})`,
      baseline: `${pct(b.greenCoverPctAfter)} (was ${pct(b.greenCoverPctBefore)})`,
      delta: `${(m.greenCoverPctAfter - b.greenCoverPctAfter).toFixed(2)} pp`,
      isPositive: true,
    },
    {
      label: 'Native saplings & biodiversity',
      optimized: `${fmt(m.totalSaplings)} saplings (${fmt(m.totalBiodiversity)} pts)`,
      baseline: `${fmt(b.totalSaplings)} saplings (${fmt(b.totalBiodiversity)} pts)`,
      delta: `${m.totalBiodiversity - b.totalBiodiversity >= 0 ? '+' : ''}${fmt(m.totalBiodiversity - b.totalBiodiversity)} pts`,
      isPositive: m.totalBiodiversity >= b.totalBiodiversity,
    },
    {
      label: 'Species & vertical canopy layers',
      optimized: `${m.speciesCount} species, ${m.layersCovered}/4 layers`,
      baseline: `${b.speciesCount} species, ${b.layersCovered}/4 layers`,
      delta: '—',
      isPositive: true,
    },
    {
      label: 'Corridor resistance cost (Kruskal)',
      optimized: `${fmt(Math.round(m.mstCost))} resistance`,
      baseline: '0 (No corridors built)',
      delta: 'Corridors active',
      isPositive: true,
    },
    {
      label: 'Corridor length (shared / gross)',
      optimized: `${fmt(m.corridorLengthAfterM)} m (Gross: ${fmt(m.corridorLengthBeforeM)} m)`,
      baseline: '0 m',
      delta: `Saved ${fmt(Math.max(0, m.corridorLengthBeforeM - m.corridorLengthAfterM))} m via Set`,
      isPositive: true,
    },
    {
      label: 'Paved road cells crossed',
      optimized: `${m.roadCellsCrossed} cells (${m.roadCellsCrossed * 25} m)`,
      baseline: '0 cells',
      delta: '—',
      isPositive: true,
    },
    {
      label: 'Connected habitat groups',
      optimized: m.groupsCount === 1 ? '1 connected network' : `${m.groupsCount} isolated groups`,
      baseline: `${b.groupsCount} isolated plots`,
      delta: m.groupsCount === 1 ? 'Unified network' : `${b.groupsCount - m.groupsCount} fewer gaps`,
      isPositive: true,
    },
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="field-panel border-[#1F6B45]">
          <span className="text-xs font-semibold text-[#3D5A49] block">Residents Covered (300 m)</span>
          <div className="text-2xl font-bold font-serif text-[#1F6B45]">
            {pct(m.coveragePctAfter)}
          </div>
          <span className="text-xs text-[#3D5A49]">
            {fmt(m.coveredAfter)} people (was {pct(m.coveragePctBefore)})
          </span>
        </div>

        <div className="field-panel border-[#1C3527]">
          <span className="text-xs font-semibold text-[#3D5A49] block">Micro-Forests Planted</span>
          <div className="text-2xl font-bold font-serif text-[#1C3527]">
            {m.plotsSelected}
          </div>
          <span className="text-xs text-[#3D5A49]">
            {fmt(m.plantedAreaM2)} m² total canopy
          </span>
        </div>

        <div className="field-panel border-[#B7791F]">
          <span className="text-xs font-semibold text-[#3D5A49] block">Corridor Network</span>
          <div className="text-2xl font-bold font-serif text-[#B7791F]">
            {fmt(m.corridorLengthAfterM)} m
          </div>
          <span className="text-xs text-[#3D5A49]">
            {m.groupsCount === 1 ? '1 unified network' : `${m.groupsCount} habitat groups`}
          </span>
        </div>

        <div className="field-panel border-[#8E3B6E]">
          <span className="text-xs font-semibold text-[#3D5A49] block">Built-in Prim Check</span>
          <div className="text-sm font-bold font-mono text-[#1F6B45] mt-1">
            {primMatchesKruskal ? '✓ Kruskal = Prim' : 'Mismatch'}
          </div>
          <span className="text-[11px] text-[#3D5A49] block">
            Cost: {fmt(Math.round(m.mstCost))}
          </span>
        </div>
      </div>

      {/* Equal-Coverage Analysis Callout */}
      {equalCoverage && (
        <div className="p-3.5 rounded bg-[#E7ECE2] border border-[#D7DECE] text-xs text-[#1C3527] flex items-center justify-between flex-wrap gap-2">
          <div>
            <strong className="text-[#1F6B45]">Equal-Coverage Cost Analysis:</strong> For the unoptimized baseline (planting largest plots first) to reach this same coverage ({fmt(m.coveredAfter)} residents), the city would need to spend an extra <strong>₹{equalCoverage.extraSpendLakh} lakh</strong> (total budget ₹{equalCoverage.finalBudgetLakh} lakh).
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Table */}
      <div className="overflow-x-auto rounded border border-[#D7DECE] shadow-xs">
        <table className="specimen-table text-xs">
          <thead>
            <tr>
              <th className="w-1/3">Metric Description</th>
              <th className="text-[#1F6B45]">CanopyNet Optimized</th>
              <th className="text-[#3D5A49]">Naive Baseline (Largest First)</th>
              <th>Optimization Delta</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr key={idx}>
                <td className="font-medium text-[#1C3527]">{row.label}</td>
                <td className="font-mono font-semibold text-[#1F6B45]">{row.optimized}</td>
                <td className="font-mono text-[#3D5A49]">{row.baseline}</td>
                <td className="font-mono font-semibold text-[#1C3527]">{row.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
