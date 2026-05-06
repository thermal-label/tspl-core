# Interoperability and source attribution

`@thermal-label/tspl-core` is a generic TSPL II encoder. The byte
sequences it emits are sourced exclusively from
**TSC's TSPL II Programming Manual** — the canonical reference
published by TSC for the TSPL II command stream.

## Scope

This package implements the directive set described in TSC's TSPL
II Programming Manual. If a printer accepts that directive set,
`tspl-core` can produce a job for it. This includes TSC's own
consumer and industrial product lines as well as the third-party
firmwares (in OEM rebrands, licensee designs, and clone
implementations) that re-implement TSPL II.

The `BITMAP` directive is supported in modes 0 (uncompressed),
1 (OR with buffer), and 2 (XOR with buffer) — the spec-defined
modes. `buildBitmapHeader` accepts any integer as the `mode`
argument so vendor packages can construct extension-mode headers
(e.g. mode 3, mode 4 — both LZO-compressed in vendor firmwares),
but the high-level `encodeTsplJob` only emits mode 0.

## Design rule — bitmap in, printer code out

This package targets the **bitmap-driven printing model**.
Commands that exist solely to make the printer render content the
host could have rendered — native text fonts, native barcodes
(`BARCODE`, `QRCODE`, `DMATRIX`, `PDF417`, `MAXICODE`, `AZTEC`),
TSPL scripting (`GOSUB` / `IF` / `FOR` / `WHILE`), file system
(`DOWNLOAD` / `EOP` / `RUN`), RFID write, image-import
(`PUTBMP` / `PUTPCX`), and drawing primitives (`BAR` / `BOX` /
`ERASE` / `REVERSE`) — are **not in scope**. Use the upstream
bitmap rendering pipeline (typically `renderImage` from
`@mbtech-nl/bitmap`) to rasterise text, barcodes, and shapes
host-side, then send the rasterised result.

The directives this package builds are the ones that control how
the printer interprets, outputs, and reports on its bitmap-printing
job: setup, paper handling, persistent configuration, and status.
That is the line `tspl-core` holds, and it is what makes the
package suitable as the protocol core for any bitmap-driven
TSPL II driver.

## Out of scope

- **Vendor extensions.** LZO-compressed `BITMAP` payloads, ACK
  framing of any shape, vendor `<KEY>:<VALUE>` status reply
  schemas, AT-command bridges to embedded Wi-Fi modules,
  vendor-only directives — all of these belong in driver packages
  that import this one.
- **Transports.** No USB, BLE, Serial, or TCP code. The package
  emits `Uint8Array` byte streams; callers feed them to whichever
  transport their driver provides.
- **Device registry.** No JSON registry of named printers. Callers
  pass `{ dpi, headDots }` for whichever device they're targeting.
- **Firmware-specific quirks.** Bit-polarity inversions,
  line-ending preferences on `PRINT`, required preamble bytes,
  vendor-specific opcodes — these live in driver packages.

## Source

The single source for every byte emitted by this package is
**TSC's TSPL II Programming Manual**. There is no harvesting from
any vendor's mobile app, firmware, Linux CUPS driver, or
proprietary SDK. Driver packages may do that work for their own
targets; `tspl-core` stays anchored on the published spec so
consumers can rely on its bytes matching TSC's documentation
byte-for-byte.

## Bit polarity

Per TSC's manual, within the `BITMAP` payload **bit `0` represents
a printed (dark) dot** and bit `1` represents an un-printed dot.
This convention is the inverse of `@mbtech-nl/bitmap`'s `LabelBitmap`,
which packs `1 = dark dot`.

`encodeTsplJob` applies a per-byte one's-complement to the raster
bytes when emitting them on the wire so that callers can pass a
`LabelBitmap` (with its natural `1 = dark` convention) and receive
spec-aligned wire bytes. Vendor packages whose firmware accepts
the inverted-from-spec polarity should bypass `encodeTsplJob` and
call the directive builders directly — their `LabelBitmap.data`
goes on the wire raw.

## Stability

The public surface is intentionally small and frozen on the
TSPL II spec. New directives may be added if TSC documents them;
vendor extensions will not be merged into the public API regardless
of demand.
