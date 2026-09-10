import { useRef } from 'react';
import type { PipelineResult, Params } from '../../engine/types';
import type { CanvasLayers } from './Canvas';

interface ControlsProps {
  params: Params;
  onParamChange: (key: keyof Params, value: number) => void;
  onOptimize: () => void;
  onNewCity: () => void;
  layers: CanvasLayers;
  onToggleLayer: (layer: keyof CanvasLayers) => void;
  result: PipelineResult | null;
  isStale?: boolean;
  onStartStepThrough: () => void;
  onImportCsv: (csvText: string) => void;
  onExportCsv: () => void;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
}

const LAYER_ITEMS: ReadonlyArray<{ key: keyof CanvasLayers; label: string; color: string }> = [
  { key: 'land', label: 'Land Use', color: '#1C3527' },
  { key: 'population', label: 'Population', color: '#B0965B' },
  { key: 'coverage', label: 'Coverage Zones', color: '#3DA56A' },
  { key: 'corridors', label: 'Corridors', color: '#B7791F' },
  { key: 'groups', label: 'Habitat Groups', color: '#8E3B6E' },
];

export default function Controls({
  params,
  onParamChange,
  onOptimize,
  onNewCity,
  layers,
  onToggleLayer,
  result,
  isStale = false,
  onStartStepThrough,
  onImportCsv,
  onExportCsv,
  onExportPNG,
  onExportJSON,
}: ControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) onImportCsv(text);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="field-panel space-y-4">
      {/* Seed & New City */}
      <div>
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="font-semibold text-[#1C3527]">City District Seed</span>
          <span className="font-mono text-[#3D5A49]">#{params.seed}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={999999}
            value={params.seed}
            onChange={(e) => onParamChange('seed', parseInt(e.target.value) || 1)}
            className="w-full text-xs font-mono"
            aria-label="City generator random seed"
          />
          <button
            type="button"
            onClick={onNewCity}
            className="btn-secondary text-xs px-3 whitespace-nowrap shrink-0"
          >
            New City
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3 pt-2 border-t border-[#D7DECE]">
        {/* Budget */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1C3527]">Municipal Planting Budget</span>
            <span className="font-mono font-bold text-[#1F6B45]">&#8377;{params.budgetLakh} lakh</span>
          </div>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={params.budgetLakh}
            onChange={(e) => onParamChange('budgetLakh', parseInt(e.target.value))}
            aria-label="Planting budget in lakh rupees"
          />
        </div>

        {/* Coverage Radius */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1C3527]">Coverage Radius (3-30-300)</span>
            <span className="font-mono font-bold text-[#1F6B45]">{params.radiusM} m</span>
          </div>
          <input
            type="range"
            min={100}
            max={600}
            step={25}
            value={params.radiusM}
            onChange={(e) => onParamChange('radiusM', parseInt(e.target.value))}
            aria-label="Micro-forest coverage radius in metres"
          />
        </div>

        {/* Wildlife Travel Limit */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1C3527]">Wildlife Travel Limit</span>
            <span className="font-mono font-bold text-[#8E3B6E]">{params.travelLimitM} m</span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={params.travelLimitM}
            onChange={(e) => onParamChange('travelLimitM', parseInt(e.target.value))}
            aria-label="Wildlife travel limit in metres"
          />
        </div>

        {/* Miyawaki Density */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[#1C3527]">Miyawaki Density</span>
            <span className="font-mono font-bold text-[#1F6B45]">{params.density} saplings/m&sup2;</span>
          </div>
          <input
            type="range"
            min={3}
            max={5}
            step={0.5}
            value={params.density}
            onChange={(e) => onParamChange('density', parseFloat(e.target.value))}
            aria-label="Miyawaki saplings per square metre"
          />
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="pt-2 border-t border-[#D7DECE] space-y-2">
        <button
          type="button"
          onClick={onOptimize}
          className={`btn-primary w-full py-2.5 text-sm shadow-xs ${
            isStale ? 'ring-2 ring-[#B7791F] animate-pulse' : ''
          }`}
        >
          {isStale
            ? 'Optimize (Parameters Changed)'
            : result
            ? `Optimized in ${result.timingsMs.total.toFixed(0)} ms`
            : 'Optimize'}
        </button>

        <button
          type="button"
          onClick={onStartStepThrough}
          className="btn-secondary w-full py-1.5 text-xs text-[#1C3527]"
        >
          Step-Through Pipeline Tour &rarr;
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="pt-2 border-t border-[#D7DECE]">
        <span className="text-xs font-semibold text-[#1C3527] block mb-2">Display Layers</span>
        <div className="flex flex-wrap gap-1.5">
          {LAYER_ITEMS.map((item) => {
            const active = layers[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleLayer(item.key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                  active
                    ? 'bg-[#1C3527] text-[#F5F6F0] font-medium'
                    : 'bg-[#F5F6F0] text-[#3D5A49] border border-[#D7DECE]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CSV Import / Export (Phase 1) */}
      <div className="pt-2 border-t border-[#D7DECE]">
        <span className="text-xs font-semibold text-[#1C3527] block mb-2">Custom Land Map (CSV)</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary text-xs py-1.5 px-2 text-center truncate"
            title="Import custom rectangular grid of H, B, R, W, P, V"
          >
            Load Land Map (CSV)
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="btn-secondary text-xs py-1.5 px-2 text-center truncate"
            title="Export current grid as CSV template"
          >
            Download Map (CSV)
          </button>
        </div>
      </div>

      {/* Image / Data Export (Phase 2) */}
      {(onExportPNG || onExportJSON) && (
        <div className="pt-2 border-t border-[#D7DECE]">
          <span className="text-xs font-semibold text-[#1C3527] block mb-2">Export Simulation</span>
          <div className="grid grid-cols-2 gap-2">
            {onExportPNG && (
              <button
                type="button"
                onClick={onExportPNG}
                className="btn-secondary text-xs py-1.5 px-2 text-center"
              >
                Export PNG Map
              </button>
            )}
            {onExportJSON && (
              <button
                type="button"
                onClick={onExportJSON}
                className="btn-secondary text-xs py-1.5 px-2 text-center"
              >
                Export JSON Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Algorithmic Timings */}
      {result && (
        <div className="pt-2 border-t border-[#D7DECE] text-[11px] text-[#3D5A49] font-mono space-y-0.5">
          <div className="font-sans font-semibold text-[#1C3527] mb-1">Execution Timings:</div>
          <div className="flex justify-between">
            <span>Stage 1a (BFS Plots):</span>
            <span>{result.timingsMs.plots.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 1b (Reach):</span>
            <span>{result.timingsMs.coverage.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 1c (Greedy):</span>
            <span>{result.timingsMs.greedy.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 2a (Knapsack):</span>
            <span>{result.timingsMs.knapsack.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 3a (Dijkstra):</span>
            <span>{result.timingsMs.dijkstra.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 3b (Kruskal):</span>
            <span>{result.timingsMs.kruskal.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 3c (Prim check):</span>
            <span>{result.timingsMs.prim.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 3d (Shared Set):</span>
            <span>{result.timingsMs.corridors.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between">
            <span>Stage 3e (Connectivity):</span>
            <span>{result.timingsMs.connectivity.toFixed(1)} ms</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#D7DECE] font-bold text-[#1F6B45]">
            <span>Total Runtime:</span>
            <span>{result.timingsMs.total.toFixed(1)} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
