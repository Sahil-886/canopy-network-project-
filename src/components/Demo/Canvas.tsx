import { useRef, useEffect, useCallback, useState } from 'react';
import type { PipelineResult, Plot } from '../../engine/types';
import { LandType, LAND_TYPE_NAMES } from '../../engine/types';
import type { BrushMode } from './BrushToolbar';

// Google Maps Cartographic Palette
const GM_COLORS: Record<LandType, string> = {
  [LandType.HOMES]: '#F3EFEA',      // Soft urban residential beige
  [LandType.BUILDING]: '#E8ECEF',   // Architectural building gray
  [LandType.ROAD]: '#FFFFFF',       // Crisp white streets
  [LandType.WATER]: '#C4E3ED',      // Google Maps serene river/lake blue
  [LandType.PARK]: '#D2F4D3',       // Google Maps natural pale park green
  [LandType.VACANT]: '#ECEEE9',     // Open plantable land
};

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

  // Zoom & Pan state (Google Maps style navigation)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapMode, setMapMode] = useState<'standard' | 'ecological'>('standard');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply Google Maps Zoom & Pan transformation
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const { grid, plots, selectedPlots, mstEdges, finalCoveredHomes, initialCoveredHomes, groups } = result;
    const cellW = rect.width / grid.width;
    const cellH = rect.height / grid.height;

    // Step-through filtering flags
    const showCandidatePlots = currentStep === 1 || currentStep === 2;
    const showCoverage = mapMode === 'ecological' || (currentStep === 0 && layers.coverage) || currentStep === 2 || currentStep === 3;
    const showForests = currentStep === 0 ? animPhase !== 'idle' : currentStep >= 3;
    const showCorridors = currentStep === 0
      ? (layers.corridors && (animPhase === 'corridors' || animPhase === 'done'))
      : currentStep >= 5;
    const showGroups = mapMode === 'ecological' || (currentStep === 0 ? layers.groups : currentStep === 7);

    // 1. Draw Land Base & Urban Geometry
    if (layers.land) {
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          const type = grid.land[idx] as LandType;

          if (type === LandType.HOMES) {
            const pop = grid.population[idx];
            // Subtle warm residential shading based on density
            const popRatio = Math.min(1, Math.max(0, (pop - 20) / 100));
            const r = Math.round(243 - popRatio * 18);
            const g = Math.round(239 - popRatio * 24);
            const b = Math.round(234 - popRatio * 32);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);

            // Subtle block outline for urban feel
            ctx.strokeStyle = '#E2DDD5';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
          } else if (type === LandType.BUILDING) {
            ctx.fillStyle = GM_COLORS[LandType.BUILDING];
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);

            // Building footprint border
            ctx.strokeStyle = '#D5DCE2';
            ctx.lineWidth = 0.75;
            ctx.strokeRect(x * cellW + 0.5, y * cellH + 0.5, cellW - 1, cellH - 1);
          } else if (type === LandType.WATER) {
            ctx.fillStyle = GM_COLORS[LandType.WATER];
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
          } else if (type === LandType.PARK) {
            ctx.fillStyle = GM_COLORS[LandType.PARK];
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);

            // Soft park border
            ctx.strokeStyle = '#BCE3BE';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * cellW, y * cellH, cellW, cellH);
          } else {
            ctx.fillStyle = GM_COLORS[type] || '#ECEEE9';
            ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // 2. Crisp Road Network (Google Maps Road Styling)
      // Pass 1: Road casing / borders
      ctx.fillStyle = '#D6D3CD';
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          if (grid.land[idx] === LandType.ROAD) {
            ctx.fillRect(x * cellW - 0.5, y * cellH - 0.5, cellW + 1, cellH + 1);
          }
        }
      }
      // Pass 2: White road surface
      ctx.fillStyle = '#FFFFFF';
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          if (grid.land[idx] === LandType.ROAD) {
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }
    } else {
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    // 3. Population Density Heatmap Overlay (Google Maps Style)
    if (layers.population && currentStep === 0) {
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const idx = y * grid.width + x;
          const pop = grid.population[idx];
          if (pop > 0) {
            const intensity = Math.min(1, pop / 120);
            ctx.fillStyle = `rgba(230, 126, 34, ${0.15 + intensity * 0.45})`;
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }
    }

    // 4. Candidate Plots (Stage 1a / 1b)
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

    // 5. 300 m Urban Greenery Coverage Buffers
    if (showCoverage) {
      ctx.fillStyle = 'rgba(46, 125, 50, 0.14)';
      const activeCovered = currentStep === 2 ? initialCoveredHomes : finalCoveredHomes;
      for (const cellIdx of activeCovered) {
        const x = cellIdx % grid.width;
        const y = Math.floor(cellIdx / grid.width);
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }
    }

    // Map plot ID to habitat group
    const plotGroupMap = new Map<number, { id: number; color: string }>();
    if (showGroups) {
      for (const g of groups) {
        for (const pId of g.plotIds) {
          plotGroupMap.set(pId, { id: g.id, color: g.color });
        }
      }
    }

    // 6. Selected Micro-Forests (Rich Emerald Green Canopy #2E7D32)
    if (showForests) {
      const plotsToShow = currentStep === 0 && animPhase === 'plots'
        ? Math.floor(selectedPlots.length * animProgress)
        : selectedPlots.length;

      const groupDashPatterns: number[][] = [[], [4, 2], [2, 2], [6, 2, 2, 2], [3, 3]];

      for (let i = 0; i < plotsToShow; i++) {
        const p = selectedPlots[i];
        const groupInfo = plotGroupMap.get(p.id);

        ctx.fillStyle = showGroups && groupInfo ? groupInfo.color : '#2E7D32';

        for (const cell of p.cells) {
          const px = cell % grid.width;
          const py = Math.floor(cell / grid.width);
          ctx.fillRect(px * cellW, py * cellH, cellW, cellH);

          // Subtle internal leaf canopy texture
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px * cellW + 0.5, py * cellH + 0.5, cellW - 1, cellH - 1);
        }

        // Group outline pattern
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

        // Selected Forest Highlight Ring
        if (selectedForest && selectedForest.id === p.id) {
          ctx.strokeStyle = '#F1C40F';
          ctx.lineWidth = 3;
          for (const cell of p.cells) {
            const px = cell % grid.width;
            const py = Math.floor(cell / grid.width);
            ctx.strokeRect(px * cellW - 1.5, py * cellH - 1.5, cellW + 3, cellH + 3);
          }
        }
      }

      // 7. Google Maps Place Pin Markers for Micro-Forests
      for (let i = 0; i < plotsToShow; i++) {
        const p = selectedPlots[i];
        const pinX = p.cx * cellW + cellW / 2;
        const pinY = p.cy * cellH + cellH / 2;

        const pinRadius = Math.max(7, Math.min(13, 9 * Math.sqrt(zoom)));

        // Pin Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(pinX, pinY + 1.5, pinRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pin Circular Body
        ctx.fillStyle = selectedForest && selectedForest.id === p.id ? '#1F6B45' : '#1C3527';
        ctx.beginPath();
        ctx.arc(pinX, pinY, pinRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pin Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.75;
        ctx.stroke();

        // Number Label inside Pin
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(pinRadius * 1.05)}px "Public Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), pinX, pinY);
      }
    }

    // 8. Wildlife Corridors (Google Maps Transit / Ecological Path Aesthetic)
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

        // Dark clean casing
        ctx.strokeStyle = '#1C3527';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke();

        // Google Maps Route Core
        ctx.lineWidth = 2.5;
        if (!edge.viable) {
          ctx.strokeStyle = '#8E3B6E'; // Plum dashed route warning
          ctx.setLineDash([4, 3]);
        } else {
          ctx.strokeStyle = '#E67E22'; // High-visibility route ochre
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [result, layers, animPhase, animProgress, currentStep, selectedForest, zoom, pan, mapMode]);

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

  // Coordinate projection taking zoom and pan into account
  const getCellCoords = useCallback(
    (clientX: number, clientY: number): { cellX: number; cellY: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas || !result) return null;
      const rect = canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;

      // Invert pan and zoom transformations
      const transformedX = (rawX - pan.x) / zoom;
      const transformedY = (rawY - pan.y) / zoom;

      const cellX = Math.floor((transformedX / rect.width) * result.grid.width);
      const cellY = Math.floor((transformedY / rect.height) * result.grid.height);

      if (cellX < 0 || cellX >= result.grid.width || cellY < 0 || cellY >= result.grid.height) {
        return null;
      }
      return { cellX, cellY };
    },
    [result, pan, zoom]
  );

  // Mouse wheel zoom (centered around cursor position)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(4.5, Math.max(1, zoom * zoomFactor));

    if (newZoom === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Adjust pan so point under cursor stays anchored
    const newPanX = cursorX - (cursorX - pan.x) * (newZoom / zoom);
    const newPanY = cursorY - (cursorY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handlePointerDown = (clientX: number, clientY: number, button: number = 0) => {
    if (!result) return;

    if (activeBrush !== null) {
      const coords = getCellCoords(clientX, clientY);
      if (coords) onPaintCell(coords.cellX, coords.cellY, activeBrush);
      return;
    }

    // If right-click, middle-click, or zoom > 1, allow pan dragging
    if (button === 1 || button === 2 || zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
    } else {
      // Normal click: check if clicking on a forest pin / plot
      const coords = getCellCoords(clientX, clientY);
      if (!coords) return;
      const clickedIdx = coords.cellY * result.grid.width + coords.cellX;
      const clickedForest = result.selectedPlots.find((p) => p.cells.includes(clickedIdx));
      onSelectForest(clickedForest || null);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!result) return;

    if (isDragging) {
      setPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
      return;
    }

    if (activeBrush !== null) {
      const coords = getCellCoords(clientX, clientY);
      if (coords) onPaintCell(coords.cellX, coords.cellY, activeBrush);
      onTooltip(null);
      return;
    }

    const coords = getCellCoords(clientX, clientY);
    if (!coords) {
      onTooltip(null);
      return;
    }

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
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Dynamic Scale Bar Calculation
  const scaleMeters = Math.round(500 / zoom);

  return (
    <div className="relative w-full aspect-square canvas-frame overflow-hidden bg-[#F3EFEA] select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          cursor: activeBrush !== null ? 'crosshair' : isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY, e.button)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          setIsDragging(false);
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
        aria-label="Google Maps-style urban district map showing land classification, micro-forest locations, and wildlife corridors"
      />

      {/* Google Maps Style Mode Switcher (Top Left) */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs rounded-md shadow-md border border-gray-200 flex overflow-hidden z-20 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMapMode('standard')}
          className={`px-3 py-1.5 transition-colors ${
            mapMode === 'standard'
              ? 'bg-[#1F6B45] text-white font-bold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Standard Map
        </button>
        <button
          type="button"
          onClick={() => setMapMode('ecological')}
          className={`px-3 py-1.5 transition-colors ${
            mapMode === 'ecological'
              ? 'bg-[#1F6B45] text-white font-bold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ecological View
        </button>
      </div>

      {/* Google Maps Floating Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-12 right-3 flex flex-col shadow-md rounded-md overflow-hidden z-20 border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => {
            const nextZ = Math.min(4.5, zoom * 1.3);
            setZoom(nextZ);
          }}
          className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 border-b border-gray-200 text-base"
          title="Zoom In"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            const nextZ = Math.max(1, zoom / 1.3);
            setZoom(nextZ);
            if (nextZ === 1) setPan({ x: 0, y: 0 });
          }}
          className="w-8 h-8 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 text-base"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          &minus;
        </button>
        {zoom > 1 && (
          <button
            type="button"
            onClick={handleResetZoom}
            className="w-8 h-8 flex items-center justify-center text-xs text-[#1F6B45] hover:bg-gray-100 border-t border-gray-200 font-semibold"
            title="Reset View"
            aria-label="Reset view"
          >
            &#x2922;
          </button>
        )}
      </div>

      {/* Dynamic Google Maps Metric Scale Bar (Bottom Right) */}
      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-gray-200 flex items-center gap-1.5 z-10">
        <div className="w-12 h-1 border-b-2 border-l-2 border-r-2 border-gray-800" />
        <span>{scaleMeters} m</span>
      </div>

      {/* Clean Bottom Legend (Google Maps Style) */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-800 flex flex-wrap items-center gap-x-4 gap-y-1 z-10 shadow-md">
        <span className="font-bold text-[#1F6B45]">Map Legend:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2E7D32] border border-white shadow-xs inline-block" />
          Micro-Forest
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-[#D2F4D3] border border-[#BCE3BE] inline-block" />
          Public Park
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-[#F3EFEA] border border-[#E2DDD5] inline-block" />
          Homes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-1 rounded-xs bg-[#E67E22] inline-block border border-[#1C3527]" />
          Corridor Route
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-1 border-b-2 border-dashed border-[#8E3B6E] inline-block" />
          Route &gt; Limit
        </span>
      </div>
    </div>
  );
}
