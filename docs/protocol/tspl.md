# TSPL II wire protocol

The byte-level reference for the directives `tspl-core` emits.

::: info Source
Every byte sequence on this page is sourced from
**TSC's TSPL II Programming Manual** — the canonical reference
published by TSC. No vendor-app harvesting, no firmware
reverse-engineering.
:::

## Job structure

A complete print job is a stream of newline-terminated ASCII
directives, with one large binary blob (the `BITMAP` payload)
embedded inline. The high-level encoder produces:

```
\r\n
DENSITY <n>\r\n              (optional)
SPEED <n>\r\n                (optional)
REFERENCE <x>,<y>\r\n
OFFSET 0 mm\r\n
SIZE <w> mm,<h> mm\r\n
GAP <pitch> mm,<offset> mm\r\n      (or BLINE for black-line stock)
DIRECTION 0,0\r\n
CLS\r\n
BITMAP 0,0,<w_bytes>,<h>,0,<raster bytes>\r\n
PRINT 1,<copies>\r\n
```

Line endings are `\r\n` per the TSC manual. Some vendor firmwares
accept (or require) the reversed `\n\r` on `PRINT` — pass
`options.printLineEnding: '\n\r'` to `encodeTsplJob` to opt in.

## Directive families

The encoder groups directives by purpose. Every byte sequence is
sourced from TSC's TSPL II Programming Manual.

### Setup / configuration

| Builder                       | Wire bytes                   | Purpose                                |
| ----------------------------- | ---------------------------- | -------------------------------------- |
| `buildSize(w, h)`             | `SIZE <w> mm,<h> mm`         | Label dimensions                       |
| `buildGap(pitch, offset)`     | `GAP <p> mm,<o> mm`          | Die-cut pitch                          |
| `buildBline(pitch, offset)`   | `BLINE <p> mm,<o> mm`        | Black-line pitch                       |
| `buildOffset(mm)`             | `OFFSET <n> mm`              | Feed offset after print                |
| `buildReference(x, y)`        | `REFERENCE <x>,<y>`          | Origin in dots                         |
| `buildDirection()`            | `DIRECTION 0,0`              | Print direction + mirror               |
| `buildDensity(n)`             | `DENSITY <n>`                | Print head heat                        |
| `buildSpeed(n)`               | `SPEED <n>`                  | Feed speed (ips)                       |
| `buildShift(n)`               | `SHIFT <n>`                  | Vertical paper shift                   |
| `buildCls()`                  | `CLS`                        | Clear label buffer                     |
| `buildInitialPrinter()`       | `INITIALPRINTER`             | Soft reset                             |
| `buildSetCutter(mode)`        | `SET CUTTER <mode>`          | Auto-cutter (`OFF`/`ON`/`BATCH`/`<n>`) |
| `buildSetPartialCutter(n)`    | `SET PARTIAL_CUTTER <n>`     | Partial-cut every Nth                  |
| `buildSetRibbon(mode)`        | `SET RIBBON <mode>`          | Ribbon (`ON`/`OFF`)                    |
| `buildSetTear(state)`         | `SET TEAR <state>`           | Tear-off mode                          |
| `buildSetPeel(state)`         | `SET PEEL <state>`           | Peel-off mode                          |
| `buildSetHead(state)`         | `SET HEAD <state>`           | Head-open sensor                       |
| `buildSetCounter(slot, mode)` | `SET COUNTER @<slot> <mode>` | Sequence counter                       |
| `buildSetResponse(state)`     | `SET RESPONSE <state>`       | Reply-format toggle                    |
| `buildSetPrintkey(state)`     | `SET PRINTKEY <state>`       | Front-panel button                     |
| `buildSetReprint(state)`      | `SET REPRINT <state>`        | Auto-reprint on error                  |
| `buildLimitfeed(dots)`        | `LIMITFEED <n>`              | Maximum feed length                    |

### Paper handling

| Builder               | Wire bytes       | Purpose                 |
| --------------------- | ---------------- | ----------------------- |
| `buildFormfeed()`     | `FORMFEED`       | Eject one label         |
| `buildBackfeed(dots)` | `BACKFEED <n>`   | Reverse-feed `n` dots   |
| `buildHome()`         | `HOME`           | Move to next label home |
| `buildCut()`          | `CUT`            | Trigger full cut        |
| `buildPartialCut()`   | `PARTIAL_CUTTER` | Trigger partial cut     |
| `buildKill()`         | `KILL`           | Abort current job       |
| `buildNull()`         | `NULL`           | No-op / link-keep-alive |
| `buildEoj()`          | `EOJ`            | End-of-job marker       |
| `buildSelftest()`     | `SELFTEST`       | Print self-test page    |

### Job firing

| Builder                          | Wire bytes                        | Purpose                         |
| -------------------------------- | --------------------------------- | ------------------------------- |
| `buildBitmapHeader(...)`         | `BITMAP <x>,<y>,<wb>,<h>,<mode>,` | Raster header                   |
| `BITMAP_TAIL`                    | `\r\n`                            | Tail bytes after raster payload |
| `buildPrint(copies, lineEnding)` | `PRINT 1,<copies>`                | Fire the label                  |

### Status query / output

| Builder           | Wire bytes      | Purpose                            |
| ----------------- | --------------- | ---------------------------------- |
| `buildEcho(text)` | `ECHO "<text>"` | Echo string back (link smoke test) |
| `buildOut(text)`  | `OUT "<text>"`  | Emit literal on response channel   |

## Per-directive notes

### `SIZE <w> mm,<h> mm`

Label dimensions in millimetres. Both values are integers in the
encoder; sub-millimetre precision is not surfaced.

### `GAP <pitch> mm,<offset> mm`

Inter-label pitch and offset for die-cut stock. The encoder writes
two-decimal mm values (`2.00`, `0.00`).

For continuous stock, the encoder emits `GAP 0.00 mm,0.00 mm` —
the firmware treats zero-pitch as continuous feed.

### `BLINE <pitch> mm,<offset> mm`

Same shape as `GAP`, but for black-line registration stock.

### `REFERENCE <x>,<y>`

Origin of the label coordinate system in dots. The encoder defaults
to `0,0`; pass `options.origin` to shift.

### `OFFSET <n> mm`

Feed offset after print, in mm. The encoder always emits `0 mm`.

### `DIRECTION 0,0`

Print direction + mirror. The encoder always emits `0,0`.

### `DENSITY <n>` / `SPEED <n>`

Print head heat (`0..15` nominal) and feed speed in inches per
second (typically `1..15`). Both are firmware-clamped.

### `CLS`

Clear the label buffer. Always emitted before `BITMAP`.

### `BITMAP <x>,<y>,<w_bytes>,<h>,<mode>,<bytes>`

The raster directive.

- `x`, `y` — top-left corner in dots
- `w_bytes` — row width in bytes (`ceil(width_dots / 8)`)
- `h` — height in dots
- `mode` — `0` = uncompressed, `1` = OR with buffer, `2` = XOR
  with buffer (TSPL II spec). Mode values `≥ 3` are vendor
  extensions and are out of scope for `tspl-core`.
- `<bytes>` — `w_bytes × h` bytes, MSB-first within each byte

#### Bit polarity

Per TSC's manual, **bit `0` = printed (dark) dot, bit `1` =
un-printed dot.** This is opposite to most in-memory bitmap
conventions.

`encodeTsplJob` applies a per-byte one's-complement to bridge
`LabelBitmap`'s `1 = dark` convention with the spec's
`0 = printed` convention. Vendor packages whose firmware accepts
the inverted-from-spec polarity should bypass `encodeTsplJob` and
emit `LabelBitmap.data` raw.

### `PRINT m,n`

Fire `n` copies of the label, in `m` sets. The encoder always
emits `m = 1`; `n` comes from `options.copies`.

### `SET CUTTER <mode>`

Persistent auto-cutter configuration. Modes: `OFF`, `ON`, `BATCH`,
or a positive integer (cut after every Nth label). The immediate-
action cut directives are `CUT` (full) and `PARTIAL_CUTTER`
(partial).

### `SET RIBBON <mode>`

`ON` for thermal-transfer (ribbon installed); `OFF` for direct-
thermal. Some firmware revisions auto-detect ribbon presence and
treat the directive as read-only — wire bytes are unchanged.

### `BACKFEED <n>` / `LIMITFEED <n>`

`BACKFEED` reverse-feeds `n` dots after print. `LIMITFEED` caps the
feed length the firmware will travel before declaring out-of-paper.

### `ECHO "<text>"` / `OUT "<text>"`

Both wrap the payload in double-quotes per the manual. The encoder
does not escape embedded quotes; callers must ensure `text` does
not contain `"`. `ECHO` is a host-loopback test (the printer
reflects the payload back unchanged); `OUT` is the response-channel
writer used inside scripted status replies.

### Other directives

The package also exposes builders for `INITIALPRINTER`, `FORMFEED`,
`SELFTEST`, `SHIFT`, `HOME`, `KILL`, `NULL`, and `EOJ`. These don't
appear in the default `encodeTsplJob` output but are useful for
callers building custom job streams.

## Status replies

Replies arrive on the inbound stream as `\r\n`-terminated ASCII
text — with one exception: the `ESC ! ?` query replies with a
single binary status byte. The TSC manual specifies four reply
shapes; vendor keyword shapes (`<KEY>:<VALUE>`, capability tables,
version strings) compose on top in driver packages.

| Reply              | Trigger                                    | Parsed by                             | Shape                                                                     |
| ------------------ | ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------- |
| `<status byte>`    | `ESC ! ?` query                            | `parseStatusByte(bytes)`              | `{ kind: 'status-byte', byte, ready, paper, cover, temp, pause, ribbon }` |
| `OK\r\n`           | After most commands when `SET RESPONSE ON` | `parseStatusLine(line)`               | `{ kind: 'ok' }`                                                          |
| `ERROR <code>\r\n` | Failed command                             | `parseStatusLine(line)`               | `{ kind: 'error', code }`                                                 |
| `<echo text>\r\n`  | After `ECHO "<text>"`                      | `parseStatusLine(line, expectedEcho)` | `{ kind: 'echo', text }`                                                  |
| anything else      | vendor / unrecognised                      | `parseStatusLine(line)`               | `{ kind: 'unknown', raw }`                                                |

`tspl-core` ships:

- `splitStatusLines(bytes)` — buffers byte-level fragmentation
  into complete lines, returning a `remainder` for unterminated
  trailing bytes. Feed it back in alongside the next chunk.
- `parseStatusLine(line, expectedEcho?)` — recognises the three
  text-line shapes above and falls through to `unknown` for vendor
  conventions. Pass `expectedEcho` when a recent `ECHO` is in
  flight to disambiguate echoed text from reply keywords.
- `parseStatusByte(bytes)` — decodes the single-byte `ESC ! ?`
  reply per the manual's bit table (cover, paper, ribbon, pause).
