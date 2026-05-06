# `@thermal-label/tspl-core`

> Pure TSPL II protocol encoder. Directive byte builders + a status
> line splitter, anchored on **TSC's TSPL II Programming Manual**.

A single-package TypeScript library that produces TSPL II wire-byte
streams for any TSPL-speaking thermal label printer. Has no
transports, no device registry, no vendor extensions — just the
spec-aligned baseline that driver packages compose on top of.

## Capabilities

Driver-complete bitmap-printing surface. Builders cover every
TSPL II directive needed to drive a bitmap-rasterised print job
end-to-end, plus paper handling and status:

- **Setup / configuration.** `SIZE`, `GAP`, `BLINE`, `OFFSET`,
  `REFERENCE`, `DIRECTION`, `DENSITY`, `SPEED`, `SHIFT`, `CLS`,
  `INITIALPRINTER`, `SET CUTTER`, `SET PARTIAL_CUTTER`,
  `SET RIBBON`, `SET TEAR`, `SET PEEL`, `SET HEAD`, `SET COUNTER`,
  `SET RESPONSE`, `SET PRINTKEY`, `SET REPRINT`, `LIMITFEED`.
- **Paper handling.** `FORMFEED`, `BACKFEED`, `HOME`, `CUT`,
  `PARTIAL_CUTTER`, `KILL`, `NULL`, `EOJ`, `SELFTEST`.
- **Job firing.** `BITMAP` (mode 0 / 1 / 2 — header builder accepts
  vendor-extension mode integers too) + `PRINT`.
- **Status query / output.** `ECHO`, `OUT`.
- **High-level encoder** `encodeTsplJob` for `BITMAP` mode 0 — the
  spec-aligned bitmap-in / wire-bytes-out path.
- **Status-reply parsing.** `splitStatusLines` for `\r\n`-terminated
  fragmented streams, `parseStatusLine` for the four spec-defined
  reply shapes (`OK`, `ERROR <code>`, echoed text, vendor fallback),
  `parseStatusByte` for the `ESC ! ?` single-byte status reply.
- **Universal.** Node, browsers, Deno, Bun, edge runtimes. Uses
  only `Uint8Array` and `TextEncoder` / `TextDecoder`.

Out of scope by design rule (bitmap in, printer code out): native
text rendering, native barcodes, drawing primitives (`BAR`, `BOX`,
`ERASE`, `REVERSE`), TSPL scripting, file system, RFID write,
image-import directives. See [INTEROPERABILITY.md](./INTEROPERABILITY.md).

## What it does not do

- **No transports.** Returns `Uint8Array`; you wire the bytes to
  USB / Web Serial / BLE / TCP yourself.
- **No vendor extensions.** LZO `BITMAP` modes 3/4, ACK framing,
  vendor `<KEY>:<VALUE>` status keywords, AT-command bridges —
  all out of scope. Build them in your driver package.
- **No device registry.** Pass `{ dpi, headDots }` for whichever
  printer you're targeting; `tspl-core` doesn't know names.

## Install

```sh
pnpm add @thermal-label/tspl-core @mbtech-nl/bitmap
```

## Usage

```ts
import { encodeTsplJob, type TsplEngine } from '@thermal-label/tspl-core';
import { renderImage } from '@mbtech-nl/bitmap';

const engine: TsplEngine = { dpi: 203, headDots: 384 };

const bitmap = renderImage(rgba, { dither: true, threshold: 175 });
const wireBytes = encodeTsplJob(engine, {
  bitmap,
  media: { widthMm: 50, heightMm: 30, type: 'gap' },
  options: { density: 8, speed: 4, copies: 1 },
});

// Hand `wireBytes` to whatever transport your driver provides.
```

For finer control, compose the directive builders yourself — see
[Getting started](./docs/getting-started.md).

## Bit polarity

Per TSC's manual, the `BITMAP` payload uses **bit `0` = printed
dot**. `LabelBitmap` from `@mbtech-nl/bitmap` uses `1 = dark`.
`encodeTsplJob` applies a per-byte one's-complement to bridge the
two. Vendor packages whose firmware accepts the inverted-from-spec
polarity should bypass `encodeTsplJob` and emit the bitmap data
raw.

## Documentation

- [Getting started](./docs/getting-started.md)
- [Wire protocol](./docs/protocol/tspl.md)
- [Interoperability](./INTEROPERABILITY.md)
- [Hardware](./HARDWARE.md)
- [Decisions](./DECISIONS.md)
- [Progress](./PROGRESS.md)

## Source

The byte sequences emitted by this package are sourced from
**TSC's TSPL II Programming Manual** — the canonical reference
published by TSC. See [INTEROPERABILITY.md](./INTEROPERABILITY.md)
for the full attribution and scope statement.

## License

MIT — see [LICENSE](./LICENSE).
