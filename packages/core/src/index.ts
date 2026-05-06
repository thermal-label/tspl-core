/**
 * `@thermal-label/tspl-core` — pure TSPL II protocol encoder.
 *
 * Source of truth: TSC's _TSPL II Programming Manual_. Every byte
 * sequence emitted by this package is documented there. Vendor
 * extensions (LZO `BITMAP` modes 3 and 4, ACK framing, vendor
 * status keyword shapes, AT-command bridges, etc.) are out of
 * scope and live in driver packages that import this one.
 */

// re-exported from @mbtech-nl/bitmap so consumers can import from one place
export type { LabelBitmap } from '@mbtech-nl/bitmap';

// directive byte builders
export {
  BITMAP_TAIL,
  buildBackfeed,
  buildBitmapHeader,
  buildBline,
  buildCls,
  buildCut,
  buildDensity,
  buildDirection,
  buildEcho,
  buildEoj,
  buildFormfeed,
  buildGap,
  buildHome,
  buildInitialPrinter,
  buildKill,
  buildLimitfeed,
  buildNull,
  buildOffset,
  buildOut,
  buildPartialCut,
  buildPrint,
  buildReference,
  buildSelftest,
  buildSetCounter,
  buildSetCutter,
  buildSetHead,
  buildSetPartialCutter,
  buildSetPeel,
  buildSetPrintkey,
  buildSetReprint,
  buildSetResponse,
  buildSetRibbon,
  buildSetTear,
  buildShift,
  buildSize,
  buildSpeed,
  concatBytes,
} from './protocol.js';

// high-level encoder
export { encodeTsplJob } from './encode.js';
export type { TsplEngine, TsplJobOptions, TsplMedia, TsplPage } from './types.js';

// status — line splitter + parsed line shapes
export { parseStatusByte, parseStatusLine, splitStatusLines } from './status.js';
export type {
  SplitStatusLinesResult,
  StatusByte,
  StatusEcho,
  StatusError,
  StatusLine,
  StatusOk,
  StatusUnknown,
} from './status.js';
