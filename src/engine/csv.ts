/**
 * CSV import and export utility for user-supplied urban land classification maps.
 * Validates rectangular dimensions (16x16 to 100x100) and character codes (H, B, R, W, P, V).
 */

import { DEFAULT_HOME_POPULATION } from './config';
import { type Grid, LandType, LAND_TYPE_CSV_CODES, CSV_CODE_TO_LAND_TYPE } from './types';

export interface CsvParseResult {
  readonly success: boolean;
  readonly grid?: Grid;
  readonly error?: string;
  readonly row?: number;
  readonly col?: number;
  readonly invalidValue?: string;
}

/**
 * Parses a CSV string containing land classification codes into an engine Grid.
 * Validates grid size within 16-100 cells and checks each cell against allowed codes.
 */
export function parseLandMapCsv(csvText: string): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 16) {
    return {
      success: false,
      error: `Grid height too small: expected at least 16 rows, got ${lines.length}.`,
    };
  }
  if (lines.length > 100) {
    return {
      success: false,
      error: `Grid height too large: expected at most 100 rows, got ${lines.length}.`,
    };
  }

  const height = lines.length;
  let width = -1;
  const parsedRows: LandType[][] = [];

  for (let r = 0; r < height; r++) {
    const rawTokens = lines[r].split(',').map((t) => t.trim().toUpperCase());

    if (width === -1) {
      width = rawTokens.length;
      if (width < 16) {
        return {
          success: false,
          error: `Grid width too small: expected at least 16 columns, got ${width}.`,
          row: r + 1,
        };
      }
      if (width > 100) {
        return {
          success: false,
          error: `Grid width too large: expected at most 100 columns, got ${width}.`,
          row: r + 1,
        };
      }
    } else if (rawTokens.length !== width) {
      return {
        success: false,
        error: `Inconsistent row width: row ${r + 1} has ${rawTokens.length} columns, expected ${width}.`,
        row: r + 1,
      };
    }

    const rowTypes: LandType[] = [];
    for (let c = 0; c < width; c++) {
      const code = rawTokens[c];
      const type = CSV_CODE_TO_LAND_TYPE[code];
      if (type === undefined) {
        return {
          success: false,
          error: `Invalid land code "${code}" at row ${r + 1}, column ${c + 1}. Expected H, B, R, W, P, or V.`,
          row: r + 1,
          col: c + 1,
          invalidValue: code,
        };
      }
      rowTypes.push(type);
    }
    parsedRows.push(rowTypes);
  }

  const land = new Uint8Array(width * height);
  const population = new Uint16Array(width * height);

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const idx = r * width + c;
      const type = parsedRows[r][c];
      land[idx] = type;
      if (type === LandType.HOMES) {
        population[idx] = DEFAULT_HOME_POPULATION;
      } else {
        population[idx] = 0;
      }
    }
  }

  return {
    success: true,
    grid: { width, height, land, population },
  };
}

/**
 * Serializes the current city grid to CSV format for template export or backup.
 * Converts internal land type integers back to standard single-character codes.
 */
export function exportLandMapToCsv(grid: Grid): string {
  const { width, height, land } = grid;
  const rows: string[] = [];

  for (let r = 0; r < height; r++) {
    const tokens: string[] = [];
    for (let c = 0; c < width; c++) {
      const type = land[r * width + c] as LandType;
      tokens.push(LAND_TYPE_CSV_CODES[type] ?? 'V');
    }
    rows.push(tokens.join(','));
  }

  return rows.join('\n');
}
