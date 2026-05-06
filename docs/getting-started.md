# Getting started

`@thermal-label/tspl-core` is a single-package TypeScript library
that produces TSPL II wire-byte streams. It has **no transport
bindings of its own** — you feed the bytes it returns to whichever
USB / Web Serial / BLE / TCP transport your driver code provides.

## Install

::: code-group

```sh [pnpm]
pnpm add @thermal-label/tspl-core @mbtech-nl/bitmap
```

```sh [npm]
npm install @thermal-label/tspl-core @mbtech-nl/bitmap
```

```sh [yarn]
yarn add @thermal-label/tspl-core @mbtech-nl/bitmap
```

:::

The peer-ish dependency on `@mbtech-nl/bitmap` lets you render
labels (text, images, barcodes) into the 1-bpp `LabelBitmap` shape
that `encodeTsplJob` consumes.

## Encode a print job

```ts
import { encodeTsplJob, type TsplEngine, type TsplPage } from '@thermal-label/tspl-core';
import { renderImage } from '@mbtech-nl/bitmap';

const engine: TsplEngine = { dpi: 203, headDots: 384 };

const bitmap = renderImage(rgba, { dither: true, threshold: 175 });
const page: TsplPage = {
  bitmap,
  media: { widthMm: 50, heightMm: 30, type: 'gap' },
  options: { density: 8, speed: 4, copies: 1 },
};

const wireBytes = encodeTsplJob(engine, page);
// → write `wireBytes` to your transport of choice.
```

## Use individual directive builders

For finer control, compose the byte stream yourself:

```ts
import {
  buildCls,
  buildSize,
  buildGap,
  buildBitmapHeader,
  BITMAP_TAIL,
  buildPrint,
  concatBytes,
} from '@thermal-label/tspl-core';

const job = concatBytes(
  buildSize(50, 30),
  buildGap(2, 0),
  buildCls(),
  buildBitmapHeader(0, 0, widthBytes, heightDots, 0), // mode 0 = uncompressed
  rasterPayloadBytes, // your own raster, already inverted to TSPL spec polarity
  BITMAP_TAIL,
  buildPrint(1),
);
```

## Read status replies

TSPL II replies arrive as `\r\n`-terminated ASCII lines on the
inbound side of your transport. Use `splitStatusLines` to handle
fragmentation across reads:

```ts
import { splitStatusLines } from '@thermal-label/tspl-core';

let pending = new Uint8Array();
for await (const chunk of transport.inbound) {
  const merged = new Uint8Array(pending.length + chunk.length);
  merged.set(pending);
  merged.set(chunk, pending.length);
  const { lines, remainder } = splitStatusLines(merged);
  for (const line of lines) handleReplyLine(line);
  pending = remainder;
}
```

The TSC manual itself does not standardise reply payload schemas —
specific keyword shapes (`<KEY>:<VALUE>`, capability tables, etc.)
are vendor conventions parsed by your driver package.

## When to bypass `encodeTsplJob`

Use the directive builders directly (not `encodeTsplJob`) when:

- Your firmware needs a compressed `BITMAP` mode (3 or 4) — those
  are vendor extensions and out of scope here.
- Your firmware accepts the inverted-from-spec bit polarity — call
  `buildBitmapHeader` and emit your `LabelBitmap.data` raw, without
  the per-byte invert that `encodeTsplJob` applies.
- You're building unusual job shapes (calibration, RFID write,
  bar-code-only labels with no raster, etc.) that don't fit the
  one-page-with-one-raster template.

::: info Source
Anchored on **TSC's TSPL II Programming Manual**.
:::
