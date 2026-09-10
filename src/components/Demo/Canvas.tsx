import { useRef, useEffect, useCallback, useState } from 'react';
import type { PipelineResult, Plot } from '../../engine/types';
import { LandType, LAND_TYPE_NAMES } from '../../engine/types';
import type { BrushMode } from './BrushToolbar';

const MAP_BASE_COLORS: Record<LandType, string> = {
  [LandType.HOMES]: '#E2DCCF',
  [LandType.BUILDING]: '#CBC7BE',
  [LandType.ROAD]: '#FFFFFF',
  [LandType.WATER]: '#9CC3D5',
  [LandType.PARK]: '#A8C39A',
  [LandType.VACANT]: '#DCE3D6',
};

const POPULATION_COLORS = [
  '#F4EFE6', '#E9DEC9', '#D8C7A5', '#C5AF80', '#B0965B',
  '#9B7E38', '#846618', '#6D5000', '#563D00', '#3F2C00',
];

export interface CanvasLayers {
  land: boolean;
  population: boolean;
  coverage: boolean;
  corridors: boolean;
  groups: boolean;
}

interface CanvasProps {
  result: PipelineResult | null;
  layers: CanvasLayers;
  animPhase: 'idle' | 'plots' | 'corridors' | 'done';
  animProgress: number;
  activeBrush: BrushMode;
  currentStep: number;
  selectedForest: Plot | null;
  onSelectForest: (forest: Plot | null) => void;
  onPaintCell: (cellX: number, cellY: number, brush: number) => void;
  onTooltip: (info: {
    x: number;
    y: number;
    cellX: number;
    cellY: number;
    landType: string;
    residents: number;
    covered: boolean;
  } | null) => void;
}

export default function DemoCanvas({
  result,
  layers,
  animPhase,
  animProgress,
  activeBrush,
  currentStep,
  selectedForest,
  onSelectForest,
  onPaintCell,
  onTooltip,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const { grid, plots, selectedPlots, mstEdges, finalCoveredHomes, initialCoveredHomes, groups } = result;
    const cellW = rect.width / grid.width;
    const cellH = rect.height / grid.height;

    // Step-through filtering flags
    const showCandidatePlots = currentStep === 1 || currentStep === 2;
    const showCoverage = (currentStep === 0 && layers.coverage) || currentStep === 2 || currentStep === 3;
    const showForests = currentStep === 0 ? animPhase !== 'idle' : currentStep >= 3;
    const showCorridors = currentStep === 0
      ? (layers.corridors && (animPhase === 'corridors' || animPhase === 'done'))
      : currentStep >= 5;
    const showGroups = currentStep === 0 ? layers.groups : currentStep === 7;

    // 1. Draw Land Base
    if (layers.land) {
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          const type = grid.land[idx] as LandType;

          if (type === LandType.HOMES) {
            const pop = grid.population[idx];
            const popRatio = Math.min(1, Math.max(0, (pop - 20) / 100));
            const gray = Math.round(226 - popRatio * 24);
            ctx.fillStyle = `rgb(${gray}, ${gray - 6}, ${gray - 16})`;
          } else {
            ctx.fillStyle = MAP_BASE_COLORS[type] || '#E2DCCF';
          }

          ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    } else {
      ctx.fillStyle = '#F5F6F0';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    // 2. Population Density Heatmap Overlay
    if (layers.population && currentStep === 0) {
      let maxPop = 120;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          const pop = grid.population[idx];
          if (pop > 0) {
            const intensity = Math.min(1, pop / maxPop);
            const colorIdx = Math.min(
              POPULATION_COLORS.length - 1,
              Math.floor(intensity * (POPULATION_COLORS.length - 1))
            );
            ctx.fillStyle = POPULATION_COLORS[colorIdx];
            ctx.globalAlpha = 0.65;
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // 3. Candidate Plots (Stage 1a / 1b)
    if (showCandidatePlots) {
      ctx.strokeStyle = '#1F6B45';
      ctx.lineWidth = 1.5;
      for (const p of plots) {
        for (const cell of p.cells) {
          const cx = cell % grid.width;
          const cy = Math.floor(cell / grid.width);
          ctx.strokeRect(cx * cellW + 0.5, cy * cellH + 0.5, cellW - 1, cellH - 1);
        }
      }
    }

    // 4. Coverage Zones (Stage 1b / 1c)
    if (showCoverage) {
      ctx.fillStyle = 'rgba(61, 165, 106, 0.14)';
      const activeCovered = currentStep === 2 ? initialCoveredHomes : finalCoveredHomes;
      for (const cellIdx of activeCovered) {
        const x = cellIdx % grid.width;
        const y = Math.floor(cellIdx / grid.width);
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Build plot ID to group mapping for habitat grouping
    const plotGroupMap = new Map<number, { id: number; color: string }>();
    if (showGroups) {
      for (const g of groups) {
        for (const pId of g.plotIds) {
          plotGroupMap.set(pId, { id: g.id, color: g.color });
        }
      }
    }

    // 5. Selected Micro-Forests (Leaf green #3DA56A, or group color in groups mode)
    if (showForests) {
      const plotsToShow = currentStep === 0 && animPhase === 'plots'
        ? Math.floor(selectedPlots.length * animProgress)
        : selectedPlots.length;

      const groupDashPatterns: number[][] = [[], [4, 2], [2, 2], [6, 2, 2, 2], [3, 3]];

      for (let i = 0; i < plotsToShow; i++) {
        const p = selectedPlots[i];
        const groupInfo = plotGroupMap.get(p.id);

        if (showGroups && groupInfo) {
          ctx.fillStyle = groupInfo.color;
        } else {
          ctx.fillStyle = '#3DA56A'; // Leaf
        }

        for (const cell of p.cells) {
          const px = cell % grid.width;
          const py = Math.floor(cell / grid.width);
          ctx.fillRect(px * cellW, py * cellH, cellW, cellH);
        }

        // Distinct outline patterns for habitat groups (never color alone)
        if (showGroups && groupInfo) {
          ctx.strokeStyle = '#1C3527';
          ctx.lineWidth = 1.5;
          ctx.setLineDash(groupDashPatterns[(groupInfo.id - 1) % groupDashPatterns.length]);
          for (const cell of p.cells) {
            const px = cell % grid.width;
            const py = Math.floor(cell / grid.width);
            ctx.strokeRect(px * cellW + 0.5, py * cellH + 0.5, cellW - 1, cellH - 1);
          }
          ctx.setLineDash([]);
        }

        // Active forest inspection highlight ring
        if (selectedForest && selectedForest.id === p.id) {
          ctx.strokeStyle = '#1F6B45';
          ctx.lineWidth = 2.5;
          for (const cell of p.cells) {
            const px = cell % grid.width;
            const py = Math.floor(cell / grid.width);
            ctx.strokeRect(px * cellW - 1, py * cellH - 1, cellW + 2, cellH + 2);
          }
        }
      }
    }

    // 6. Wildlife Corridors (Ochre #B7791F with Pine #1C3527 casing, Plum #8E3B6E for too-long links)
    if (showCorridors) {
      const corridorProgress = currentStep === 0 && animPhase === 'corridors' ? animProgress : 1;

      for (const edge of mstEdges) {
        const pathLen = Math.floor(edge.path.length * corridorProgress);
        if (pathLen < 2) continue;

        ctx.beginPath();
        const startCell = edge.path[0];
        ctx.moveTo(
          (startCell % grid.width) * cellW + cellW / 2,
          Math.floor(startCell / grid.width) * cellH + cellH / 2
        );

        for (let p = 1; p < pathLen; p++) {
          const cell = edge.path[p];
          ctx.lineTo(
            (cell % grid.width) * cellW + cellW / 2,
            Math.floor(cell / grid.width) * cellH + cellH / 2
          );
        }

        // Pine casing
        ctx.strokeStyle = '#1C3527';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke();

        // Corridor core
        ctx.lineWidth = 2.5;
        if (!edge.viable) {
          ctx.strokeStyle = '#8E3B6E'; // Plum
          ctx.setLineDash([4, 3]);
        } else {
          ctx.strokeStyle = '#B7791F'; // Ochre
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [result, layers, animPhase, animProgress, currentStep, selectedForest]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(parent);
    return () => ro.disconnect();
  }, [draw]);

  const getCellCoords = useCallback(
    (clientX: number, clientY: number): { cellX: number; cellY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !result) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cellX = Math.floor((x / rect.width) * result.grid.width);
      const cellY = Math.floor((y / rect.height) * result.grid.height);
      if (cellX < 0 || cellX >= result.grid.width || cellY < 0 || cellY >= result.grid.height) {
        return null;
      }
      return { cellX, cellY };
    },
    [result]
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      if (!result) return;
      const coords = getCellCoords(clientX, clientY);
      if (!coords) return;

      if (activeBrush !== null) {
        setIsPainting(true);
        onPaintCell(coords.cellX, coords.cellY, activeBrush);
      } else {
        const clickedIdx = coords.cellY * result.grid.width + coords.cellX;
        const clickedForest = result.selectedPlots.find((p) => p.cells.includes(clickedIdx));
        onSelectForest(clickedForest || null);
      }
    },
    [result, getCellCoords, activeBrush, onPaintCell, onSelectForest]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!result) return;
      const coords = getCellCoords(clientX, clientY);
      if (!coords) {
        onTooltip(null);
        return;
      }

      if (isPainting && activeBrush !== null) {
        onPaintCell(coords.cellX, coords.cellY, activeBrush);
        onTooltip(null);
      } else if (activeBrush === null) {
        const idx = coords.cellY * result.grid.width + coords.cellX;
        const landType = LAND_TYPE_NAMES[result.grid.land[idx] as LandType] || 'Unknown';
        const residents = result.grid.population[idx];
        const covered = result.finalCoveredHomes.has(idx);
        onTooltip({
          x: clientX,
          y: clientY,
          cellX: coords.cellX,
          cellY: coords.cellY,
          landType,
          residents,
          covered,
        });
      }
    },
    [result, getCellCoords, isPainting, activeBrush, onPaintCell, onTooltip]
  );

  const handlePointerUp = useCallback(() => {
    setIsPainting(false);
  }, []);

  return (
    <div className="relative w-full aspect-square canvas-frame overflow-hidden bg-[#E7ECE2]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          cursor: activeBrush !== null ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
        onMouseDown={(e) => {
          if (e.button === 0) handlePointerDown(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          setIsPainting(false);
          onTooltip(null);
        }}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handlePointerUp}
        role="img"
        aria-label="Interactive city grid showing land use, micro-forest locations, and wildlife corridor paths"
      />

      {/* Always Visible Legend */}
      <div className="absolute bottom-2 left-2 right-2 bg-[#F5F6F0]/95 backdrop-blur-xs border border-[#D7DECE] rounded p-2 text-[11px] text-[#1C3527] flex flex-wrap items-center gap-x-3 gap-y-1 z-10 shadow-xs pointer-events-none">
        <span className="font-semibold text-[#1F6B45]">Map Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#3DA56A] inline-block border border-black/10" />
          Micro-Forest
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#A8C39A] inline-block border border-black/10" />
          Existing Park
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#E2DCCF] inline-block border border-black/10" />
          Homes
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-1 rounded-xs bg-[#B7791F] inline-block border border-[#1C3527]" />
          Corridor
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-1 rounded-xs border-b border-dashed border-[#8E3B6E] inline-block" />
          Link &gt; Travel Limit
        </span>
      </div>
    </div>
  );
}
