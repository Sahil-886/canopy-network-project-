import { useRef, useEffect, useCallback } from 'react';
import { SITE } from '../content';
import type { PipelineResult } from '../engine/types';
import { LandType } from '../engine/types';

const MAP_BASE_COLORS: Record<LandType, string> = {
  [LandType.HOMES]: '#E2DCCF',
  [LandType.BUILDING]: '#CBC7BE',
  [LandType.ROAD]: '#FFFFFF',
  [LandType.WATER]: '#9CC3D5',
  [LandType.PARK]: '#A8C39A',
  [LandType.VACANT]: '#DCE3D6',
};

interface HeroProps {
  result: PipelineResult | null;
}

export default function Hero({ result }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

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

    const { grid, selectedPlots, mstEdges, finalCoveredHomes } = result;
    const cellW = rect.width / grid.width;
    const cellH = rect.height / grid.height;

    // 1. Draw city base grid
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const idx = y * grid.width + x;
        const type = grid.land[idx] as LandType;

        if (type === LandType.HOMES) {
          // Darker shading for higher resident counts
          const pop = grid.population[idx];
          const popRatio = Math.min(1, Math.max(0, (pop - 20) / 100));
          const gray = Math.round(226 - popRatio * 28);
          ctx.fillStyle = `rgb(${gray}, ${gray - 6}, ${gray - 18})`;
        } else {
          ctx.fillStyle = MAP_BASE_COLORS[type] || '#E2DCCF';
        }

        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // 2. Draw coverage zones (soft translucent green)
    const progress = progressRef.current;
    if (progress > 0.15) {
      ctx.fillStyle = 'rgba(61, 165, 106, 0.12)';
      for (const cellIdx of finalCoveredHomes) {
        const x = cellIdx % grid.width;
        const y = Math.floor(cellIdx / grid.width);
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // 3. Draw micro-forest plots (Leaf green #3DA56A)
    const totalPlots = selectedPlots.length;
    const plotsToShow = Math.floor(totalPlots * Math.min(1, progress * 1.8));

    for (let i = 0; i < plotsToShow; i++) {
      const plot = selectedPlots[i];
      ctx.fillStyle = '#3DA56A';
      for (const cell of plot.cells) {
        const px = cell % grid.width;
        const py = Math.floor(cell / grid.width);
        ctx.fillRect(px * cellW, py * cellH, cellW, cellH);
      }
    }

    // 4. Draw corridors (Ochre #B7791F with Pine casing, Plum #8E3B6E for too-long links)
    if (progress > 0.35) {
      const corridorProgress = Math.min(1, (progress - 0.35) / 0.65);

      for (const edge of mstEdges) {
        const pathLen = Math.floor(edge.path.length * corridorProgress);
        if (pathLen < 2) continue;

        // Draw casing first
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

        ctx.strokeStyle = '#1C3527'; // Pine casing
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.stroke();

        // Core corridor stroke
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
  }, [result]);

  useEffect(() => {
    if (!result) return;
    progressRef.current = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      progressRef.current = 1;
      draw();
      return;
    }

    const start = performance.now();
    const duration = 2200;

    const animate = (now: number) => {
      progressRef.current = Math.min(1, (now - start) / duration);
      draw();
      if (progressRef.current < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [result, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [draw]);

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-b border-[#D7DECE] bg-[#F5F6F0]">
      <div className="field-container grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 z-10">
          <div className="inline-block px-3 py-1 rounded bg-[#E7ECE2] text-[#1C3527] text-xs font-semibold tracking-wide mb-4 border border-[#D7DECE]">
            {SITE.subtitle}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#1C3527] mb-6 font-serif leading-tight">
            {SITE.headline}
          </h1>
          <p className="text-lg text-[#3D5A49] mb-8 max-w-xl leading-relaxed">
            {SITE.subline}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={scrollToDemo}
              className="btn-primary shadow-sm"
              type="button"
            >
              {SITE.heroButton}
            </button>
            <a
              href="#problem"
              className="text-[#1F6B45] text-sm font-semibold hover:underline"
            >
              Explore the pitch &rarr;
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative aspect-square w-full canvas-frame overflow-hidden bg-[#E7ECE2]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded"
            aria-label="Live preview map showing progressive optimization of urban micro-forests and wildlife corridors"
          />
          <div className="absolute bottom-3 left-3 bg-[#F5F6F0]/90 backdrop-blur-xs px-3 py-1.5 rounded text-xs text-[#3D5A49] border border-[#D7DECE] shadow-xs">
            Synthesized district network &bull; 64&times;64 grid
          </div>
        </div>
      </div>
    </section>
  );
}
