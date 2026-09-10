import { describe, it, expect } from 'vitest';
import { parseLandMapCsv, exportLandMapToCsv } from '../src/engine/csv';
import { LandType, type Grid } from '../src/engine/types';

describe('CSV import and export', () => {
  it('parses valid 16x16 CSV grid', () => {
    const rows: string[] = [];
    for (let r = 0; r < 16; r++) {
      const row: string[] = [];
      for (let c = 0; c < 16; c++) {
        row.push(c % 2 === 0 ? 'H' : 'V');
      }
      rows.push(row.join(','));
    }

    const csvText = rows.join('\n');
    const res = parseLandMapCsv(csvText);

    expect(res.success).toBe(true);
    expect(res.grid?.width).toBe(16);
    expect(res.grid?.height).toBe(16);
    expect(res.grid?.land[0]).toBe(LandType.HOMES);
    expect(res.grid?.land[1]).toBe(LandType.VACANT);
  });

  it('rejects invalid character with precise row, col, and value info', () => {
    const rows: string[] = [];
    for (let r = 0; r < 16; r++) {
      const row: string[] = [];
      for (let c = 0; c < 16; c++) {
        if (r === 4 && c === 7) {
          row.push('X'); // Invalid code
        } else {
          row.push('H');
        }
      }
      rows.push(row.join(','));
    }

    const res = parseLandMapCsv(rows.join('\n'));
    expect(res.success).toBe(false);
    expect(res.row).toBe(5);
    expect(res.col).toBe(8);
    expect(res.invalidValue).toBe('X');
  });

  it('rejects grid smaller than 16x16', () => {
    const smallCsv = 'H,H\nH,H';
    const res = parseLandMapCsv(smallCsv);
    expect(res.success).toBe(false);
    expect(res.error).toContain('too small');
  });

  it('round-trips grid through export and import', () => {
    const width = 16;
    const height = 16;
    const land = new Uint8Array(width * height).fill(LandType.ROAD);
    land[0] = LandType.HOMES;
    land[1] = LandType.WATER;
    land[2] = LandType.PARK;
    land[3] = LandType.VACANT;

    const grid: Grid = {
      width,
      height,
      land,
      population: new Uint16Array(width * height).fill(0),
    };

    const exported = exportLandMapToCsv(grid);
    const parsed = parseLandMapCsv(exported);

    expect(parsed.success).toBe(true);
    expect(parsed.grid?.land[0]).toBe(LandType.HOMES);
    expect(parsed.grid?.land[1]).toBe(LandType.WATER);
    expect(parsed.grid?.land[2]).toBe(LandType.PARK);
    expect(parsed.grid?.land[3]).toBe(LandType.VACANT);
  });
});
