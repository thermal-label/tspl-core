import { bytesPerRow } from '@mbtech-nl/bitmap';
import {
  BITMAP_TAIL,
  buildBitmapHeader,
  buildBline,
  buildCls,
  buildDensity,
  buildDirection,
  buildGap,
  buildOffset,
  buildPrint,
  buildReference,
  buildSize,
  buildSpeed,
  concatBytes,
} from './protocol.js';
import type { TsplEngine, TsplJobOptions, TsplPage } from './types.js';

const enc = new TextEncoder();
const CRLF = enc.encode('\r\n');

/**
 * Emit a complete pure-TSPL II print job using `BITMAP` mode 0
 * (uncompressed).
 *
 * The byte stream is the entire job: opening directives, the
 * raster header + payload, and the closing `PRINT` directive.
 * Callers feed it to whichever transport their driver provides
 * (USB, BLE, Serial, TCP — none of which `tspl-core` knows about).
 *
 * **Bit polarity.** The TSC TSPL II manual specifies that within
 * the `BITMAP` payload, bit `0` represents a printed dot and bit
 * `1` represents an un-printed dot. `LabelBitmap` from
 * `@mbtech-nl/bitmap` uses the opposite convention — `1 = dark`
 * — so this encoder applies a **per-byte one's-complement** to the
 * raster bytes when emitting them on the wire.
 *
 * The result: pass a `LabelBitmap` with `1 = dark dot` (the
 * library's invariant), get out a wire payload that matches the
 * TSC spec. Vendor firmwares that accept the inverted-from-spec
 * polarity should bypass this function and call the directive
 * builders directly.
 *
 * Vendor packages that need compressed `BITMAP` modes 3/4 also
 * bypass this function — they build the job stream by composing
 * the directive builders with their own payload code (LZO
 * compression, chunk framing, etc.).
 */
export function encodeTsplJob(engine: TsplEngine, page: TsplPage): Uint8Array {
  const bitmap = page.bitmap;
  const widthBytes = bytesPerRow(bitmap.widthPx);
  const heightDots = bitmap.heightPx;

  // Bitmap dimensions in mm — derived from `bitmap.widthPx / dpiPerMm`.
  const dpiPerMm = engine.dpi / 25.4;
  const widthMm = Math.max(1, Math.round(bitmap.widthPx / dpiPerMm));
  const heightMm = Math.max(1, Math.round(heightDots / dpiPerMm));

  const opts: TsplJobOptions = page.options ?? {};
  const copies = opts.copies ?? 1;
  const origin = opts.origin ?? { x: 0, y: 0 };
  const lineEnding = opts.printLineEnding ?? '\r\n';
  const paperType = page.media.type;
  const pitchMm = opts.pitch;

  const parts: Uint8Array[] = [];

  // Leading newline. Some firmwares discard a leftover partial directive
  // from the previous job if a newline opens the new one — harmless on
  // spec-compliant firmwares either way.
  parts.push(CRLF);

  if (opts.density !== undefined) parts.push(buildDensity(opts.density));
  if (opts.speed !== undefined) parts.push(buildSpeed(opts.speed));

  parts.push(buildReference(origin.x, origin.y));
  parts.push(buildOffset(0));
  parts.push(buildSize(widthMm, heightMm));

  // GAP / BLINE / continuous. The 'continuous' case maps to GAP 0,0
  // — the firmware treats zero-pitch as continuous feed.
  if (paperType === 'bline') {
    parts.push(buildBline(pitchMm ?? 3, 0));
  } else if (paperType === 'continuous') {
    parts.push(buildGap(0, 0));
  } else {
    parts.push(buildGap(pitchMm ?? 2, 0));
  }

  parts.push(buildDirection());
  parts.push(buildCls());

  // BITMAP header — mode 0 (uncompressed). The header line ends
  // after `,0,` — the raster bytes follow inline.
  parts.push(buildBitmapHeader(0, 0, widthBytes, heightDots, 0));

  // Per-byte invert: LabelBitmap stores `1 = dark`; TSPL II's BITMAP
  // payload spec is `0 = printed dot`. Flip every byte.
  // Per-byte invert: LabelBitmap stores `1 = dark`; TSPL II's BITMAP
  // payload spec is `0 = printed dot`. Map each byte to its
  // one's-complement.
  const inverted = bitmap.data.map(b => ~b & 0xff);
  parts.push(inverted);

  parts.push(BITMAP_TAIL);
  parts.push(buildPrint(copies, lineEnding));

  return concatBytes(...parts);
}
