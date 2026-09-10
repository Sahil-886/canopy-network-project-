import { useState, useCallback, useRef, useEffect } from 'react';
import type { PipelineResult, Params, Plot, Grid } from '../../engine/types';
import DemoCanvas, { type CanvasLayers } from './Canvas';
import Controls from './Controls';
import MetricsPanel from './MetricsPanel';
import ForestPanel from './ForestPanel';
import StepThrough from './StepThrough';
import BrushToolbar, { type BrushMode } from './BrushToolbar';
import { parseLandMapCsv, exportLandMapToCsv } from '../../engine/csv';
import { findSteppingStones } from '../../engine/steiner';
import { LandType } from '../../engine/types';
import { DATA_HONESTY_LABEL } from '../../content';

interface DemoProps {
  result: PipelineResult | null;
  params: Params;
  onRun: (params: Params, customGrid?: Grid) => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

export default function Demo({
  result,
  params,
  onRun,
  currentStep: externalStep,
  onStepChange: externalSetStep,
}: DemoProps) {
  const [localParams, setLocalParams] = useState<Params>(params);
  const [animating, setAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState<'idle' | 'plots' | 'corridors' | 'done'>('done');
  const [animProgress, setAnimProgress] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Brush & custom grid editing state
  const [activeBrush, setActiveBrush] = useState<BrushMode>(null);
  const [customGrid, setCustomGrid] = useState<Grid | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [csvAlert, setCsvAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Step-through state (0 = overview, 1-7 = guided steps)
  const [internalStep, setInternalStep] = useState(0);
  const currentStep = externalStep !== undefined ? externalStep : internalStep;
  const setStep = externalSetStep || setInternalStep;

  // Selected forest for detailed panel
  const [selectedForest, setSelectedForest] = useState<Plot | null>(null);

  // Layer toggles
  const [layers, setLayers] = useState<CanvasLayers>({
    land: true,
    population: false,
    coverage: true,
    corridors: true,
    groups: true,
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    cellX: number;
    cellY: number;
    landType: string;
    residents: number;
    covered: boolean;
  } | null>(null);

  // Parse URL hash on initial load
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const sp = new URLSearchParams(hash);
      const seed = sp.get('seed');
      const budget = sp.get('budget');
      const radius = sp.get('radius');
      const travel = sp.get('travel');
      const density = sp.get('density');

      if (seed || budget || radius || travel || density) {
        const next: Params = {
          seed: seed ? parseInt(seed, 10) : params.seed,
          budgetLakh: budget ? parseInt(budget, 10) : params.budgetLakh,
          radiusM: radius ? parseInt(radius, 10) : params.radiusM,
          travelLimitM: travel ? parseInt(travel, 10) : params.travelLimitM,
          density: density ? parseFloat(density) : params.density,
          width: params.width,
          height: params.height,
        };
        setLocalParams(next);
        onRun(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync parameters back to URL hash
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('seed', String(localParams.seed));
    sp.set('budget', String(localParams.budgetLakh));
    sp.set('radius', String(localParams.radiusM));
    sp.set('travel', String(localParams.travelLimitM));
    sp.set('density', String(localParams.density));
    window.history.replaceState(null, '', `#${sp.toString()}`);
  }, [localParams]);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  // Debounced slider handler (250 ms)
  const handleParamChange = useCallback(
    (key: keyof Params, value: number) => {
      setLocalParams((prev) => {
        const next = { ...prev, [key]: value };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (key !== 'seed') {
          debounceRef.current = setTimeout(() => {
            onRun(next, customGrid || undefined);
            setIsStale(false);
          }, 250);
        }
        return next;
      });
    },
    [onRun, customGrid]
  );

  const handleOptimize = useCallback(() => {
    onRun(localParams, customGrid || undefined);
    setIsStale(false);
    setSelectedForest(null);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimPhase('done');
      setAnimProgress(1);
      return;
    }
    setAnimating(true);
    setAnimPhase('plots');
    setAnimProgress(0);
  }, [localParams, customGrid, onRun]);

  const handleNewCity = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 100000) + 1;
    const next = { ...localParams, seed: newSeed };
    setLocalParams(next);
    setCustomGrid(null);
    setIsStale(false);
    setSelectedForest(null);
    onRun(next);
  }, [localParams, onRun]);

  // Cell painting
  const handlePaintCell = useCallback(
    (cellX: number, cellY: number, brush: number) => {
      if (!result) return;
      setCustomGrid((prev) => {
        const base = prev || {
          width: result.grid.width,
          height: result.grid.height,
          land: new Uint8Array(result.grid.land),
          population: new Uint16Array(result.grid.population),
        };
        const nextLand = new Uint8Array(base.land);
        const nextPop = new Uint16Array(base.population);
        const idx = cellY * base.width + cellX;

        if (nextLand[idx] !== brush) {
          nextLand[idx] = brush;
          if (brush === LandType.HOMES) {
            nextPop[idx] = nextPop[idx] > 0 ? nextPop[idx] : 60;
          } else {
            nextPop[idx] = 0;
          }
          setIsStale(true);
          return {
            width: base.width,
            height: base.height,
            land: nextLand,
            population: nextPop,
          };
        }
        return base;
      });
    },
    [result]
  );

  const handleResetGrid = useCallback(() => {
    setCustomGrid(null);
    setIsStale(false);
    setSelectedForest(null);
    onRun(localParams);
  }, [localParams, onRun]);

  // CSV Import
  const handleImportCsv = useCallback(
    (csvText: string) => {
      const res = parseLandMapCsv(csvText);
      if (!res.success || !res.grid) {
        setCsvAlert({
          type: 'error',
          message: res.error || 'Failed to parse custom land map CSV.',
        });
        return;
      }

      setCustomGrid(res.grid);
      setIsStale(false);
      setSelectedForest(null);
      setLocalParams((prev) => ({
        ...prev,
        width: res.grid!.width,
        height: res.grid!.height,
      }));
      onRun(
        { ...localParams, width: res.grid.width, height: res.grid.height },
        res.grid
      );
      setCsvAlert({
        type: 'success',
        message: `Successfully loaded custom ${res.grid.width}×${res.grid.height} land map.`,
      });
      setTimeout(() => setCsvAlert(null), 4000);
    },
    [localParams, onRun]
  );

  // CSV Export
  const handleExportCsv = useCallback(() => {
    if (!result) return;
    const activeGrid = customGrid || result.grid;
    const csvContent = exportLandMapToCsv(activeGrid);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `canopy-land-grid-seed-${localParams.seed}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [result, customGrid, localParams.seed]);

  // PNG & JSON Export
  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector('.canvas-frame canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `canopy-seed-${localParams.seed}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [localParams.seed]);

  const handleExportJSON = useCallback(() => {
    if (!result) return;
    const exportData = {
      timestamp: new Date().toISOString(),
      params: localParams,
      metrics: result.metrics,
      baseline: result.baseline,
      equalCoverage: result.equalCoverage,
      selectedPlots: result.selectedPlots.map((p) => ({
        id: p.id,
        areaM2: p.areaM2,
        cost: p.cost,
        cx: p.cx,
        cy: p.cy,
        saplingBudget: p.saplingBudget,
      })),
      allocations: result.allocations,
      mstEdges: result.mstEdges.map((e) => ({
        from: e.from,
        to: e.to,
        cost: e.cost,
        lengthM: e.lengthM,
        viable: e.viable,
      })),
      groups: result.groups,
      timingsMs: result.timingsMs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canopy-data-seed-${localParams.seed}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [result, localParams]);

  // Steiner Stepping Stone candidate finder
  const handleSuggestSteinerJunctions = useCallback(() => {
    if (!result) return;
    const selectedIds = new Set(result.selectedPlots.map((p) => p.id));
    const stones = findSteppingStones(
      customGrid || result.grid,
      result.plots,
      selectedIds,
      result.mstEdges,
      localParams.travelLimitM
    );
    if (stones.length === 0) {
      setCsvAlert({
        type: 'error',
        message: 'No unselected vacant plots found that can bridge disconnected clusters within travel threshold.',
      });
    } else {
      setSelectedForest(stones[0]);
      setCsvAlert({
        type: 'success',
        message: `Steiner heuristic identified ${stones.length} bridging stepping-stone(s). Inspecting Plot #${stones[0].id}.`,
      });
    }
    setTimeout(() => setCsvAlert(null), 6000);
  }, [result, customGrid, localParams.travelLimitM]);

  // Animation controller
  useEffect(() => {
    if (!animating || animPhase === 'done' || animPhase === 'idle') return;

    const start = performance.now();
    const duration = animPhase === 'plots' ? 1200 : 1000;
    let raf: number;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setAnimProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        if (animPhase === 'plots') {
          setAnimPhase('corridors');
          setAnimProgress(0);
        } else {
          setAnimPhase('done');
          setAnimating(false);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animating, animPhase]);

  const handleToggleLayer = useCallback((layer: keyof CanvasLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const forestAllocation = selectedForest && result
    ? result.allocations.find((a) => a.plotId === selectedForest.id)
    : undefined;

  const forestPick = selectedForest && result
    ? result.picks.find((p) => p.plotId === selectedForest.id)
    : undefined;

  return (
    <section id="demo" className="field-section bg-[#F5F6F0]">
      <div className="field-container">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <span className="section-tag">Interactive Simulator</span>
            <h2 className="section-title mb-1">Algorithmic City Demonstration</h2>
          </div>
          <div className="px-3 py-1 rounded bg-[#E7ECE2] text-[#3D5A49] text-xs border border-[#D7DECE] font-medium">
            {DATA_HONESTY_LABEL}
          </div>
        </div>

        {csvAlert && (
          <div
            className={`p-3 rounded text-xs mb-4 border flex items-center justify-between ${
              csvAlert.type === 'error'
                ? 'bg-[#8E3B6E]/10 border-[#8E3B6E] text-[#8E3B6E]'
                : 'bg-[#1F6B45]/10 border-[#1F6B45] text-[#1F6B45]'
            }`}
          >
            <span>{csvAlert.message}</span>
            <button
              type="button"
              onClick={() => setCsvAlert(null)}
              className="text-base font-bold leading-none ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Step-Through Bar */}
        {result && (
          <StepThrough
            currentStep={currentStep}
            totalSteps={7}
            result={result}
            onStepChange={setStep}
            onExit={() => setStep(0)}
          />
        )}

        {/* Brush Palette */}
        <BrushToolbar
          activeBrush={activeBrush}
          onSelectBrush={setActiveBrush}
          isStale={isStale}
          onResetGrid={handleResetGrid}
        />

        {/* Desktop Side-by-Side Grid Layout, Mobile Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <DemoCanvas
              result={result}
              layers={layers}
              animPhase={animPhase}
              animProgress={animProgress}
              activeBrush={activeBrush}
              currentStep={currentStep}
              selectedForest={selectedForest}
              onSelectForest={setSelectedForest}
              onPaintCell={handlePaintCell}
              onTooltip={setTooltip}
            />

            {/* Google Maps Style InfoWindow Tooltip */}
            {tooltip && (
              <div
                className="fixed bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none z-50 transition-transform duration-75"
                style={{ left: tooltip.x + 14, top: tooltip.y - 42 }}
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#1F6B45]" />
                  <span>{tooltip.landType}</span>
                  <span className="text-[10px] text-gray-400 font-mono font-normal">
                    ({tooltip.cellX}, {tooltip.cellY})
                  </span>
                </div>
                {tooltip.residents > 0 && (
                  <div className="text-[11px] text-gray-600">
                    Population: <strong>{tooltip.residents} residents</strong>
                  </div>
                )}
                <div className="text-[11px] font-medium mt-0.5">
                  {tooltip.covered ? (
                    <span className="text-[#2E7D32] flex items-center gap-1">
                      <span className="font-bold">✓</span> Within 300 m green space
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Outside green space buffer
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Miyawaki Forest Panel */}
            {selectedForest && (
              <ForestPanel
                forest={selectedForest}
                allocation={forestAllocation}
                newlyCoveredCount={forestPick?.newlyCoveredResidents ?? 0}
                onClose={() => setSelectedForest(null)}
              />
            )}
          </div>

          <div className="lg:col-span-5">
            <Controls
              params={localParams}
              onParamChange={handleParamChange}
              onOptimize={handleOptimize}
              onNewCity={handleNewCity}
              layers={layers}
              onToggleLayer={handleToggleLayer}
              result={result}
              isStale={isStale}
              onStartStepThrough={() => setStep(1)}
              onImportCsv={handleImportCsv}
              onExportCsv={handleExportCsv}
              onSuggestSteinerJunctions={handleSuggestSteinerJunctions}
              onExportPNG={handleExportPNG}
              onExportJSON={handleExportJSON}
            />
          </div>
        </div>

        {/* Live Metrics Side-by-Side Comparison */}
        {result && <MetricsPanel result={result} />}
      </div>
    </section>
  );
}
