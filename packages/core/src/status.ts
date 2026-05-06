/**
 * TSPL II status reply line splitter and parser.
 *
 * The TSC TSPL II manual specifies that printer-to-host replies
 * arrive as `\r\n`-terminated ASCII lines (with the exception of
 * the `ESC ! ?` query, which replies with a single status byte).
 * The wire spec defines four reply shapes that {@link parseStatusLine}
 * recognises:
 *
 * - The single status byte from `ESC ! ?` (when `SET RESPONSE` is in
 *   raw mode).
 * - `OK\r\n` — the success acknowledgement after a command.
 * - `ERROR <code>\r\n` — the failure reply with a numeric code.
 * - `<echo text>\r\n` — the reflected payload from `ECHO`.
 *
 * Anything outside those four falls through to
 * `{ kind: 'unknown', raw }`. Vendor-specific reply shapes
 * (`SSS<KEY>:<VALUE>`, capability tables, version strings) live in
 * driver packages that compose on top of this surface.
 *
 * This module ships:
 *
 * - {@link splitStatusLines} — a buffered line splitter that joins
 *   `\r\n`-terminated lines across fragmented byte arrivals.
 * - {@link parseStatusLine} — a minimal line shape with `kind:
 *   'unknown'` for anything not specified by the manual itself.
 *   Vendor packages compose their own dispatch on top.
 * - {@link parseStatusByte} — decode the `ESC ! ?` single-byte reply.
 */

const dec = new TextDecoder();

/**
 * Result of {@link splitStatusLines}. Holds the complete lines
 * extracted from the buffer plus any trailing bytes that did not
 * yet terminate with `\r\n` — feed `remainder` back in alongside
 * the next chunk to handle reply fragmentation across reads.
 */
export interface SplitStatusLinesResult {
  /** Each line **without** its trailing `\r\n`. */
  readonly lines: readonly string[];
  /** Bytes after the last `\r\n` (if any). */
  readonly remainder: Uint8Array;
}

/**
 * Split a possibly-fragmented byte buffer into complete
 * `\r\n`-terminated text lines.
 *
 * The buffer is decoded as UTF-8 (the TSC manual specifies ASCII;
 * UTF-8 is a superset for any 7-bit input). Bytes after the final
 * `\r\n` are returned as `remainder` so callers polling a stream
 * can concatenate them with the next chunk.
 *
 * @example
 *   let pending = new Uint8Array();
 *   for await (const chunk of stream) {
 *     const merged = new Uint8Array(pending.length + chunk.length);
 *     merged.set(pending);
 *     merged.set(chunk, pending.length);
 *     const { lines, remainder } = splitStatusLines(merged);
 *     for (const line of lines) handle(line);
 *     pending = remainder;
 *   }
 */
export function splitStatusLines(bytes: Uint8Array): SplitStatusLinesResult {
  const text = dec.decode(bytes);
  const out: string[] = [];

  let cursor = 0;
  while (cursor < text.length) {
    const end = text.indexOf('\r\n', cursor);
    if (end === -1) break;
    out.push(text.slice(cursor, end));
    cursor = end + 2;
  }

  // Re-encode the leftover text back to bytes for the remainder.
  // Slicing the original `bytes` is unsafe across multi-byte UTF-8
  // boundaries; encoding the leftover string is correct.
  const leftover = text.slice(cursor);
  const remainder = leftover.length === 0 ? new Uint8Array() : new TextEncoder().encode(leftover);

  return { lines: out, remainder };
}

/**
 * Decoded `ESC ! ?` single-byte status reply.
 *
 * The TSPL II manual documents the reply as a single byte whose
 * bits flag specific printer states. The exact bit assignment
 * differs slightly between manual revisions and firmware families;
 * this parser uses the spec-canonical mapping documented in TSC's
 * TSPL II Programming Manual:
 *
 * | Bit  | Mask   | Meaning           |
 * | ---- | ------ | ----------------- |
 * | 0    | `0x01` | Head / cover open |
 * | 1    | `0x02` | Paper jam         |
 * | 2    | `0x04` | Out of paper      |
 * | 3    | `0x08` | Out of ribbon     |
 * | 4    | `0x10` | Pause             |
 * | 5    | `0x20` | Printing          |
 * | 6    | `0x40` | (reserved)        |
 * | 7    | `0x80` | (reserved)        |
 *
 * `ready` is `true` when no error/state bits (paper, cover, ribbon,
 * temp, pause) are set — i.e. the printer is idle and able to
 * accept a job.
 *
 * **Ambiguity:** TSC's manual does not surface an explicit
 * head-temperature flag at the byte level; some vendor firmwares
 * route over-temperature events through bit 1 (alongside paper jam)
 * while others reuse a reserved bit. The {@link StatusByte.temp}
 * field stays in the public shape because the plan calls for it,
 * but always reports `false` from this parser — driver packages
 * with vendor-specific knowledge can post-process the
 * {@link StatusByte.byte} field to refine it.
 */
export interface StatusByte {
  kind: 'status-byte';
  /** Raw byte value, for callers that need to inspect reserved bits. */
  byte: number;
  /** No error/state bits set. */
  ready: boolean;
  /** Out of paper (bit 2). */
  paper: boolean;
  /** Cover / head open (bit 0). */
  cover: boolean;
  /** Over-temperature — see ambiguity note on {@link StatusByte}. */
  temp: boolean;
  /** Paused (bit 4). */
  pause: boolean;
  /** Out of ribbon (bit 3). */
  ribbon: boolean;
}

/** Acknowledgement reply from a successful command (`OK\r\n`). */
export interface StatusOk {
  kind: 'ok';
}

/** Failure reply with a numeric error code (`ERROR <code>\r\n`). */
export interface StatusError {
  kind: 'error';
  /** Decoded numeric error code. `NaN` if the payload after `ERROR ` is non-numeric. */
  code: number;
}

/** Reflected payload from {@link buildEcho}'s `ECHO "<text>"`. */
export interface StatusEcho {
  kind: 'echo';
  text: string;
}

/** Fallback shape for vendor-specific replies that compose downstream. */
export interface StatusUnknown {
  kind: 'unknown';
  raw: string;
}

/**
 * Parsed status line. Discriminated on `kind`.
 *
 * The four spec-defined kinds are recognised by {@link parseStatusLine}
 * (`ok`, `error`, `echo`) and {@link parseStatusByte}
 * (`status-byte`). Anything else falls through to `unknown` so
 * vendor parsers can dispatch on `raw`.
 */
export type StatusLine = StatusByte | StatusOk | StatusError | StatusEcho | StatusUnknown;

/**
 * Decode the single-byte reply to an `ESC ! ?` status query.
 *
 * Returns `null` when `bytes` is empty (caller should wait for more
 * data); decodes byte 0 of any non-empty buffer otherwise. Trailing
 * bytes are ignored — the manual specifies a single byte per query
 * but some firmwares append a `\r\n` for terminal display, which
 * the caller can strip before passing in.
 */
export function parseStatusByte(bytes: Uint8Array): StatusByte | null {
  if (bytes.length === 0) return null;
  const byte = bytes[0] ?? 0;
  const cover = (byte & 0x01) !== 0;
  const jam = (byte & 0x02) !== 0;
  const paper = (byte & 0x04) !== 0;
  const ribbon = (byte & 0x08) !== 0;
  const pause = (byte & 0x10) !== 0;
  // The TSPL II manual does not surface an explicit temp flag at
  // the byte level; see StatusByte JSDoc. We always report false
  // and let driver packages refine if their firmware repurposes a
  // bit for it.
  const temp = false;
  const errorBits = paper || cover || ribbon || jam || pause;
  return {
    kind: 'status-byte',
    byte,
    ready: !errorBits,
    paper,
    cover,
    temp,
    pause,
    ribbon,
  };
}

/**
 * Wrap a status line in the {@link StatusLine} shape, recognising the
 * four spec-defined reply forms (`OK`, `ERROR <code>`, echo text)
 * and falling through to `{ kind: 'unknown', raw }` for anything
 * else. Trailing `\r\n` is stripped; surrounding whitespace is
 * trimmed.
 *
 * Echo replies are the trickiest to dispatch on: the manual permits
 * arbitrary echoed text, so this parser only routes a line to
 * `'echo'` when the caller supplies the original `expectedEcho`
 * payload — otherwise an echoed `OK` would be misclassified as the
 * acknowledgement reply. When `expectedEcho` is omitted, this
 * function never returns `'echo'` and the caller is responsible for
 * matching echoed text downstream.
 *
 * The status-byte shape is **not** produced by this function — it
 * arrives as a single binary byte, not a text line; use
 * {@link parseStatusByte} on the raw bytes instead.
 *
 * @param line   The line text (without the trailing `\r\n`).
 * @param expectedEcho When provided, a line whose trimmed value
 *                     matches this string is reported as
 *                     `{ kind: 'echo', text }`.
 */
export function parseStatusLine(line: string, expectedEcho?: string): StatusLine {
  const raw = line.replace(/\r\n$/u, '').trim();

  if (raw === 'OK') return { kind: 'ok' };

  // ERROR <code> — code is whitespace-separated; firmware writes
  // decimal integers but the manual does not bound the format so we
  // parse loosely with `Number()` and surface NaN for anything that
  // doesn't parse.
  if (raw.startsWith('ERROR')) {
    const rest = raw.slice('ERROR'.length).trim();
    const code = rest === '' ? Number.NaN : Number(rest);
    return { kind: 'error', code };
  }

  if (expectedEcho !== undefined && raw === expectedEcho) {
    return { kind: 'echo', text: raw };
  }

  return { kind: 'unknown', raw };
}
