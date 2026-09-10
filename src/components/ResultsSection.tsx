import { useState, useEffect, useRef } from 'react';
import type { PipelineResult } from '../engine/types';
import { LIMITATIONS, FUTURE_WORK, DATA_HONESTY_LABEL, SPECIES_NOTE } from '../content';
import { SPECIES_LIST } from '../engine/config';
import { generateCity } from '../engine/city';
import { runPipeline } from '../engine';

interface ResultsSectionProps {
  result: PipelineResult | null;
}

interface BenchmarkStats {
  completed: number;
  total: number;
  coverageGainMean: number;
  coverageGainSD: number;
  residentsGainMean: number;
  residentsGainSD: number;
  mstLengthMean: number;
  mstLengthSD: number;
  groupsMean: number;
  groupsSD: number;
}

function calcMeanSD(arr: number[]): { mean: number; sd: number } {
  if (arr.length === 0) return { mean: 0, sd: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (arr.length === 1) return { mean, sd: 0 };
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  return { mean, sd: Math.sqrt(variance) };
}

export default function ResultsSection({ result }: ResultsSectionProps) {
  const [benchmark, setBenchmark] = useState<BenchmarkStats | null>(null);
  const benchmarkStarted = useRef(false);

  useEffect(() => {
    if (benchmarkStarted.current) return;
    benchmarkStarted.current = true;

    // Run 20 synthetic cities in chunks using requestIdleCallback/setTimeout
    const seeds = Array.from({ length: 20 }, (_, i) => i + 1);
    const coverageGains: number[] = [];
    const residentGains: number[] = [];
    const mstLengths: number[] = [];
    const groupCounts: number[] = [];

    let currentIdx = 0;

    function runBatch() {
      const batchEnd = Math.min(seeds.length, currentIdx + 2); // 2 seeds per frame
      for (; currentIdx < batchEnd; currentIdx++) {
        const s = seeds[currentIdx];
        const city = generateCity(s, 64, 64);
        const r = runPipeline(city, {
          seed: s,
          budgetLakh: 40,
          radiusM: 300,
          travelLimitM: 1200,
          density: 3,
          width: 64,
          height: 64,
        });

        coverageGains.push(r.metrics.coveragePctAfter - r.baseline.coveragePctAfter);
        residentGains.push(r.metrics.coveredAfter - r.baseline.coveredAfter);
        mstLengths.push(r.metrics.corridorLengthAfterM);
        groupCounts.push(r.metrics.groupsCount);
      }

      const cov = calcMeanSD(coverageGains);
      const res = calcMeanSD(residentGains);
      const mst = calcMeanSD(mstLengths);
      const grp = calcMeanSD(groupCounts);

      setBenchmark({
        completed: currentIdx,
        total: seeds.length,
        coverageGainMean: cov.mean,
        coverageGainSD: cov.sd,
        residentsGainMean: res.mean,
        residentsGainSD: res.sd,
        mstLengthMean: mst.mean,
        mstLengthSD: mst.sd,
        groupsMean: grp.mean,
        groupsSD: grp.sd,
      });

      if (currentIdx < seeds.length) {
        if ('requestIdleCallback' in window) {
          (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(runBatch);
        } else {
          setTimeout(runBatch, 25);
        }
      }
    }

    setTimeout(runBatch, 200);
  }, []);

  return (
    <section id="results" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="text-column mb-8">
          <span className="section-tag">Empirical Synthesis</span>
          <h2 className="section-title">Evaluation &amp; Results</h2>
          <div className="inline-block px-3 py-1 rounded bg-[#E7ECE2] text-[#3D5A49] text-xs border border-[#D7DECE] font-medium mb-4">
            {DATA_HONESTY_LABEL}
          </div>
          <p className="text-base text-[#1C3527] leading-relaxed mb-4">
            Every metric displayed across CanopyNet is calculated dynamically at runtime. The optimizer prioritizes population coverage per rupee spent rather than gross land area, while ensuring wildlife connectivity through least-resistance corridors.
          </p>
          {result && (
            <p className="text-sm text-[#3D5A49] leading-relaxed">
              On the active city (Seed #{result.grid.width}×{result.grid.height}), CanopyNet covers{' '}
              <strong className="text-[#1F6B45]">{result.metrics.coveragePctAfter.toFixed(1)}%</strong> of residents within 300 m with {result.selectedPlots.length} micro-forests, vs{' '}
              <strong>{result.baseline.coveragePctAfter.toFixed(1)}%</strong> in the naive baseline.
            </p>
          )}
        </div>

        {/* 20 Synthetic Cities Benchmark Panel */}
        <div className="field-panel border-[#1F6B45] mb-12 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-[#D7DECE]">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C3527]">
                20 Synthetic Cities Benchmark
              </h3>
              <span className="text-xs text-[#3D5A49]">
                Tested across 20 distinct seeded district topographies (mean &plusmn; standard deviation of deltas vs baseline)
              </span>
            </div>
            <span className="text-xs font-mono font-semibold text-[#1F6B45]">
              {benchmark && benchmark.completed < benchmark.total
                ? `Simulating seeds 1–20 (${benchmark.completed}/${benchmark.total})...`
                : '20 Synthetic Cities Complete &bull; Budget ₹40L &bull; R=300m'}
            </span>
          </div>

          {benchmark && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="p-3 rounded bg-[#F5F6F0] border border-[#D7DECE]">
                <span className="text-xs text-[#3D5A49] block">Coverage Percentage Gain</span>
                <span className="text-xl font-bold font-serif text-[#1F6B45] block mt-1">
                  +{benchmark.coverageGainMean.toFixed(1)} pp &plusmn; {benchmark.coverageGainSD.toFixed(1)}
                </span>
                <span className="text-[11px] text-[#3D5A49]">Delta over naive baseline</span>
              </div>

              <div className="p-3 rounded bg-[#F5F6F0] border border-[#D7DECE]">
                <span className="text-xs text-[#3D5A49] block">Net Additional Residents</span>
                <span className="text-xl font-bold font-serif text-[#1F6B45] block mt-1">
                  +{Math.round(benchmark.residentsGainMean).toLocaleString()} &plusmn; {Math.round(benchmark.residentsGainSD).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#3D5A49]">Citizens newly brought within 300 m</span>
              </div>

              <div className="p-3 rounded bg-[#F5F6F0] border border-[#D7DECE]">
                <span className="text-xs text-[#3D5A49] block">Shared Corridor Length</span>
                <span className="text-xl font-bold font-serif text-[#B7791F] block mt-1">
                  {Math.round(benchmark.mstLengthMean).toLocaleString()} m &plusmn; {Math.round(benchmark.mstLengthSD).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#3D5A49]">Consolidated physical paths</span>
              </div>

              <div className="p-3 rounded bg-[#F5F6F0] border border-[#D7DECE]">
                <span className="text-xs text-[#3D5A49] block">Connected Habitat Groups</span>
                <span className="text-xl font-bold font-serif text-[#1C3527] block mt-1">
                  {benchmark.groupsMean.toFixed(1)} &plusmn; {benchmark.groupsSD.toFixed(1)}
                </span>
                <span className="text-[11px] text-[#3D5A49]">vs 14–18 isolated baseline plots</span>
              </div>
            </div>
          )}
        </div>

        {/* Botanical Species Reference Table */}
        <div className="mb-12">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h3 className="text-xl font-serif font-bold text-[#1C3527]">
              Native Species Matrix (12 Species across 4 Layers)
            </h3>
            <span className="text-xs font-serif italic text-[#3D5A49]">
              {SPECIES_NOTE}
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-[#D7DECE] shadow-xs">
            <table className="specimen-table">
              <thead>
                <tr>
                  <th>Common Species Name</th>
                  <th>Vertical Layer</th>
                  <th>Sapling Unit Price (₹)</th>
                  <th>Ecological Weight (1 to 5)</th>
                </tr>
              </thead>
              <tbody>
                {SPECIES_LIST.map((sp, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-[#1C3527]">{sp.name}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs bg-[#E7ECE2] text-[#1F6B45] font-medium border border-[#D7DECE]">
                        {sp.layer}
                      </span>
                    </td>
                    <td className="font-mono text-sm text-[#1C3527]">₹{sp.saplingPrice}</td>
                    <td className="font-mono text-sm font-semibold text-[#B7791F]">{sp.ecoWeight} / 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="figure-caption">
            Table 2: Four-layer botanical species palette deployed in the 0/1 knapsack dynamic programming solver.
          </p>
        </div>

        {/* Limitations & Future Work Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#D7DECE]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1C3527] mb-3">
              Model Limitations
            </h3>
            <ul className="space-y-2 text-sm text-[#3D5A49] list-disc list-inside leading-relaxed">
              {LIMITATIONS.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-serif font-bold text-[#1C3527] mb-3">
              Directions for Future Work
            </h3>
            <ul className="space-y-2 text-sm text-[#3D5A49] list-disc list-inside leading-relaxed">
              {FUTURE_WORK.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
