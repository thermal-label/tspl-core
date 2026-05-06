/**
 * TSPL II directive byte builders.
 *
 * Every builder returns a `Uint8Array` of the wire bytes for a
 * single directive — including the trailing line ending. The
 * high-level encoder concatenates them.
 *
 * **Source:** TSC's _TSPL II Programming Manual_. Every byte
 * sequence emitted here is documented in the manual; vendor
 * extensions live in driver packages that import this one.
 *
 * @see {@link https://www.tscprinters.com/} for TSC's published
 *      programming manual.
 */

const CRLF = '\r\n';
const enc = new TextEncoder();

/** `DENSITY <n>\r\n` — print head heat (0..15 nominal; firmware clamps). */
export function buildDensity(n: number): Uint8Array {
  return enc.encode(`DENSITY ${String(n)}${CRLF}`);
}

/** `SPEED <n>\r\n` — print speed in inches per second (firmware-dependent range). */
export function buildSpeed(n: number): Uint8Array {
  return enc.encode(`SPEED ${String(n)}${CRLF}`);
}

/** `REFERENCE <x>,<y>\r\n` — origin of the label coordinate system in dots. */
export function buildReference(x: number, y: number): Uint8Array {
  return enc.encode(`REFERENCE ${String(x)},${String(y)}${CRLF}`);
}

/** `OFFSET <n> mm\r\n` — feed offset after print, in mm. */
export function buildOffset(mm: number): Uint8Array {
  return enc.encode(`OFFSET ${String(mm)} mm${CRLF}`);
}

/** `SIZE <w> mm,<h> mm\r\n` — label dimensions. */
export function buildSize(widthMm: number, heightMm: number): Uint8Array {
  return enc.encode(`SIZE ${String(widthMm)} mm,${String(heightMm)} mm${CRLF}`);
}

/**
 * `GAP <pitch> mm,<offset> mm\r\n` — pitch between gap-stock labels.
 *
 * `pitchMm` is the gap (the thin transparent strip between labels —
 * typically 2–3 mm); `offsetMm` is usually `0`.
 */
export function buildGap(pitchMm: number, offsetMm: number): Uint8Array {
  return enc.encode(`GAP ${pitchMm.toFixed(2)} mm,${offsetMm.toFixed(2)} mm${CRLF}`);
}

/** `BLINE <pitch> mm,<offset> mm\r\n` — black-line-stock pitch. */
export function buildBline(pitchMm: number, offsetMm: number): Uint8Array {
  return enc.encode(`BLINE ${pitchMm.toFixed(2)} mm,${offsetMm.toFixed(2)} mm${CRLF}`);
}

/** `DIRECTION 0,0\r\n` — print direction + mirror flag (always `0,0` here). */
export function buildDirection(): Uint8Array {
  return enc.encode(`DIRECTION 0,0${CRLF}`);
}

/** `CLS\r\n` — clear label buffer. */
export function buildCls(): Uint8Array {
  return enc.encode(`CLS${CRLF}`);
}

/** `INITIALPRINTER\r\n` — soft reset. */
export function buildInitialPrinter(): Uint8Array {
  return enc.encode(`INITIALPRINTER${CRLF}`);
}

/**
 * `PRINT 1,<copies>\r\n` — fire the label.
 *
 * `lineEnding` defaults to `\r\n` per the TSC manual. Some vendor
 * firmwares accept the reversed `\n\r` and a few require it; the
 * parameter exists so vendor packages can opt-in without forking
 * the encoder.
 */
export function buildPrint(copies: number, lineEnding: '\r\n' | '\n\r' = CRLF): Uint8Array {
  return enc.encode(`PRINT 1,${String(copies)}${lineEnding}`);
}

/** `FORMFEED\r\n` — eject one label. */
export function buildFormfeed(): Uint8Array {
  return enc.encode(`FORMFEED${CRLF}`);
}

/** `SELFTEST\r\n` — print a self-test page. */
export function buildSelftest(): Uint8Array {
  return enc.encode(`SELFTEST${CRLF}`);
}

/** `SHIFT <n>\r\n` — vertical paper shift in dots. */
export function buildShift(n: number): Uint8Array {
  return enc.encode(`SHIFT ${String(n)}${CRLF}`);
}

/**
 * `BITMAP 0,0,<w_bytes>,<h>,<mode>,` — the raster directive header.
 *
 * The header line emitted by this builder ends after the `,<mode>,`
 * — the caller follows it with the mode-specific raster payload
 * and a trailing line ending ({@link BITMAP_TAIL}).
 *
 * **Mode values:**
 *
 * - `0` — uncompressed bitmap (TSPL II spec)
 * - `1` — OR with existing image buffer (TSPL II spec)
 * - `2` — XOR with existing image buffer (TSPL II spec)
 * - `≥ 3` — vendor extensions (e.g. LZO whole-frame, LZO chunked).
 *   Not in scope for this package; pass through if your driver
 *   needs them.
 *
 * The `mode` parameter is typed as `number` (rather than a literal
 * union) so vendor packages can pass extension values without
 * casts.
 */
export function buildBitmapHeader(
  x: number,
  y: number,
  widthBytes: number,
  height: number,
  mode: number,
): Uint8Array {
  return enc.encode(
    `BITMAP ${String(x)},${String(y)},${String(widthBytes)},${String(height)},${String(mode)},`,
  );
}

/** Tail bytes emitted after a `BITMAP` raster payload — `\r\n`. */
export const BITMAP_TAIL: Uint8Array = enc.encode(CRLF);

// ---------------------------------------------------------------------------
// 1.1 Paper handling
// ---------------------------------------------------------------------------

/**
 * `BACKFEED <n>\r\n` — reverse-feed `n` dots after print.
 *
 * The TSPL II manual specifies the parameter as a positive integer
 * dot count. The encoder formats the integer literally; the firmware
 * clamps to its physical capability.
 */
export function buildBackfeed(dots: number): Uint8Array {
  return enc.encode(`BACKFEED ${String(dots)}${CRLF}`);
}

/** `HOME\r\n` — feed to the next label home position. */
export function buildHome(): Uint8Array {
  return enc.encode(`HOME${CRLF}`);
}

/** `CUT\r\n` — trigger an immediate full cut. */
export function buildCut(): Uint8Array {
  return enc.encode(`CUT${CRLF}`);
}

/**
 * `PARTIAL_CUTTER\r\n` — trigger an immediate partial cut.
 *
 * Note that the TSPL II manual spells this directive
 * `PARTIAL_CUTTER` (with the underscore) for the immediate-action
 * form; the persistent-configuration form (`SET PARTIAL_CUTTER <n>`)
 * is exposed as {@link buildSetPartialCutter}.
 */
export function buildPartialCut(): Uint8Array {
  return enc.encode(`PARTIAL_CUTTER${CRLF}`);
}

/** `KILL\r\n` — abort the current job. */
export function buildKill(): Uint8Array {
  return enc.encode(`KILL${CRLF}`);
}

/**
 * `NULL\r\n` — no-op directive used as a link-keep-alive / ping.
 *
 * The manual documents `NULL` as a no-op the firmware accepts and
 * discards. Useful for probing whether a transport is still alive
 * without changing any printer state.
 */
export function buildNull(): Uint8Array {
  return enc.encode(`NULL${CRLF}`);
}

// ---------------------------------------------------------------------------
// 1.2 Setup / configuration
// ---------------------------------------------------------------------------

/**
 * `SET CUTTER <mode>\r\n` — auto-cutter configuration.
 *
 * The TSPL II manual documents three keyword modes (`OFF`, `ON`,
 * `BATCH`) plus a numeric "cut after every Nth label" form. This
 * builder accepts any of them via a single union; the keyword forms
 * are emitted verbatim and the numeric form is stringified.
 *
 * @param mode `'OFF'` / `'ON'` / `'BATCH'` (keyword) or a positive
 *   integer (cut after every Nth label).
 */
export function buildSetCutter(mode: 'OFF' | 'ON' | 'BATCH' | number): Uint8Array {
  return enc.encode(`SET CUTTER ${typeof mode === 'number' ? String(mode) : mode}${CRLF}`);
}

/** `SET PARTIAL_CUTTER <n>\r\n` — partial-cut after every Nth label. */
export function buildSetPartialCutter(n: number): Uint8Array {
  return enc.encode(`SET PARTIAL_CUTTER ${String(n)}${CRLF}`);
}

/**
 * `SET RIBBON <mode>\r\n` — thermal-transfer (ribbon) vs direct-thermal.
 *
 * `'ON'` enables thermal-transfer (ribbon installed); `'OFF'`
 * selects direct-thermal mode. The manual notes that some firmware
 * variants treat this directive as read-only when the printer
 * auto-detects ribbon presence — the wire bytes are the same.
 */
export function buildSetRibbon(mode: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET RIBBON ${mode}${CRLF}`);
}

/** `SET TEAR <state>\r\n` — tear-off mode toggle. */
export function buildSetTear(state: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET TEAR ${state}${CRLF}`);
}

/** `SET PEEL <state>\r\n` — peel-off (label dispenser) mode toggle. */
export function buildSetPeel(state: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET PEEL ${state}${CRLF}`);
}

/** `SET HEAD <state>\r\n` — head-open sensor enable. */
export function buildSetHead(state: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET HEAD ${state}${CRLF}`);
}

/**
 * `SET COUNTER @<slot> <mode>\r\n` — multi-up label sequence counters.
 *
 * `slot` is the counter slot (the manual uses `@0` … `@N`). `mode`
 * is the increment specifier — typically a numeric step (`+1`, `-1`,
 * etc.) or an alphanumeric pattern; this builder formats whichever
 * string the caller supplies verbatim, leaving the spec-canonical
 * choice to the caller.
 */
export function buildSetCounter(slot: number, mode: string): Uint8Array {
  return enc.encode(`SET COUNTER @${String(slot)} ${mode}${CRLF}`);
}

/**
 * `SET RESPONSE <state>\r\n` — reply-format toggle.
 *
 * `'ON'` enables ASCII reply text (`OK\r\n`, `ERROR <code>\r\n`).
 * `'OFF'` disables responses. `'BATCH'` is documented in some
 * manual revisions as "respond once per batch"; the keyword is
 * passed through verbatim.
 */
export function buildSetResponse(state: 'ON' | 'OFF' | 'BATCH'): Uint8Array {
  return enc.encode(`SET RESPONSE ${state}${CRLF}`);
}

/** `SET PRINTKEY <state>\r\n` — front-panel feed/print button enable. */
export function buildSetPrintkey(state: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET PRINTKEY ${state}${CRLF}`);
}

/** `SET REPRINT <state>\r\n` — auto-reprint on recoverable error. */
export function buildSetReprint(state: 'ON' | 'OFF'): Uint8Array {
  return enc.encode(`SET REPRINT ${state}${CRLF}`);
}

/** `LIMITFEED <n>\r\n` — maximum feed length, in dots. */
export function buildLimitfeed(dots: number): Uint8Array {
  return enc.encode(`LIMITFEED ${String(dots)}${CRLF}`);
}

/** `EOJ\r\n` — end-of-job marker. */
export function buildEoj(): Uint8Array {
  return enc.encode(`EOJ${CRLF}`);
}

// ---------------------------------------------------------------------------
// 1.3 Status query / output
// ---------------------------------------------------------------------------

/**
 * `ECHO "<text>"\r\n` — echo a string back on the response channel.
 *
 * Useful as a transport-link smoke test — the printer reflects the
 * exact `text` payload back on its response channel. The text is
 * wrapped in double-quotes per the manual; the encoder does **not**
 * escape embedded quotes (the manual is silent on the escape syntax,
 * and printer firmwares vary). Callers must ensure `text` does not
 * contain `"` characters.
 */
export function buildEcho(text: string): Uint8Array {
  return enc.encode(`ECHO "${text}"${CRLF}`);
}

/**
 * `OUT "<text>"\r\n` — emit a literal text payload on the response channel.
 *
 * Same wire shape and same escape-handling caveat as
 * {@link buildEcho}: the text is wrapped in double-quotes and not
 * escaped. The two directives differ in how the printer treats the
 * payload internally — `ECHO` is a host-loopback test, `OUT` is the
 * scriptable response-channel writer used inside status replies.
 */
export function buildOut(text: string): Uint8Array {
  return enc.encode(`OUT "${text}"${CRLF}`);
}

/**
 * Concatenate any number of `Uint8Array` chunks into one buffer.
 * The TSPL print encoder emits a long sequence of small directives
 * plus one large bitmap payload — this is the join.
 */
export function concatBytes(...chunks: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let ip = 0;
  for (const c of chunks) {
    out.set(c, ip);
    ip += c.length;
  }
  return out;
}
