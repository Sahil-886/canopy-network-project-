import { LandType } from '../../engine/types';

export type BrushMode = number | null; // null = Inspect, number = LandType

interface BrushToolbarProps {
  activeBrush: BrushMode;
  onSelectBrush: (brush: BrushMode) => void;
  isStale: boolean;
  onResetGrid: () => void;
}

const BRUSHES: Array<{ type: BrushMode; label: string; color: string; desc: string }> = [
  { type: null, label: 'Inspect', color: '#1F6B45', desc: 'Click micro-forests to inspect species allocation, hover for cell info' },
  { type: LandType.VACANT, label: 'Vacant (V)', color: '#DCE3D6', desc: 'Plantable empty land for new micro-forests' },
  { type: LandType.PARK, label: 'Park (P)', color: '#A8C39A', desc: 'Existing municipal public park' },
  { type: LandType.HOMES, label: 'Homes (H)', color: '#E2DCCF', desc: 'Populated residential housing' },
  { type: LandType.BUILDING, label: 'Building (B)', color: '#CBC7BE', desc: 'Commercial/industrial impassable obstacle' },
  { type: LandType.ROAD, label: 'Road (R)', color: '#FFFFFF', desc: 'Paved street (corridor cost penalty 8x)' },
  { type: LandType.WATER, label: 'Water (W)', color: '#9CC3D5', desc: 'River or waterbody (corridor cost penalty 20x)' },
];

export default function BrushToolbar({
  activeBrush,
  onSelectBrush,
  isStale,
  onResetGrid,
}: BrushToolbarProps) {
  return (
    <div className="mb-4 p-3 rounded bg-[#E7ECE2] border border-[#D7DECE]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#1C3527]">
          Canvas Tool
        </span>
        {isStale && (
          <button
            type="button"
            className="text-xs font-semibold text-[#8E3B6E] hover:underline"
            onClick={onResetGrid}
            title="Revert modifications to original procedural city"
          >
            Revert to Generated City
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BRUSHES.map((b) => {
          const isActive = activeBrush === b.type;
          return (
            <button
              key={b.label}
              type="button"
              onClick={() => onSelectBrush(b.type)}
              title={b.desc}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#1C3527] text-[#F5F6F0] shadow-xs'
                  : 'bg-[#F5F6F0] text-[#1C3527] hover:bg-[#D7DECE] border border-[#D7DECE]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-xs border border-black/10 shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>

      {isStale && (
        <div className="mt-2 text-xs font-medium text-[#8E3B6E] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8E3B6E] animate-pulse" />
          Grid modified. Click <strong>Optimize</strong> to recalculate coverage, species, and corridors.
        </div>
      )}
    </div>
  );
}
