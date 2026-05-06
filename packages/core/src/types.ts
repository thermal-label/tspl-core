import type { LabelBitmap } from '@mbtech-nl/bitmap';

/**
 * Engine descriptor — physical attributes of the target printer
 * that the encoder needs to size and lay out the bitmap.
 *
 * `tspl-core` does not maintain a registry of named devices.
 * Caller (typically a driver package) supplies the engine values
 * for whichever printer it's targeting.
 */
export interface TsplEngine {
  /** Dots per inch. 203 (8 dots/mm), 300 (~11.81 dots/mm), 600 (~23.62 dots/mm). */
  dpi: 203 | 300 | 600;
  /** Native head width in dots. */
  headDots: number;
}

/** Label media descriptor for a single page. */
export interface TsplMedia {
  widthMm: number;
  heightMm: number;
  /**
   * `gap` — die-cut labels separated by transparent strips (`GAP` directive).
   * `bline` — continuous stock with printed registration marks (`BLINE` directive).
   * `continuous` — receipt-style endless paper (emitted as `GAP 0,0`).
   */
  type: 'gap' | 'bline' | 'continuous';
}

/** Per-job options for {@link encodeTsplJob}. */
export interface TsplJobOptions {
  /** Density (0..15 nominal; firmware clamps). Omit to skip the directive. */
  density?: number;
  /** Speed in inches per second. Omit to skip the directive. */
  speed?: number;
  /** Number of copies to print. Default `1`. */
  copies?: number;
  /** Origin offset in dots — emitted via `REFERENCE`. Default `{ x: 0, y: 0 }`. */
  origin?: { x: number; y: number };
  /**
   * Trailing line ending on `PRINT`. Default `'\r\n'` per the TSC manual;
   * vendor packages whose firmware requires the reversed form may pass `'\n\r'`.
   */
  printLineEnding?: '\r\n' | '\n\r';
  /**
   * GAP / BLINE pitch in mm. Default `2` for `gap`, `3` for `bline`.
   * Ignored for `continuous` media.
   */
  pitch?: number;
}

/** A single page of input to {@link encodeTsplJob}. */
export interface TsplPage {
  bitmap: LabelBitmap;
  media: TsplMedia;
  options?: TsplJobOptions;
}
