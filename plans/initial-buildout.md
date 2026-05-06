# tspl-core — Implementation Plan

> Agent implementation plan for `@thermal-label/tspl-core` — a
> single-package TypeScript library that encodes **pure TSPL II**
> print jobs. The package is the spec-aligned base layer that
> driver packages compose on top of when their hardware speaks
> TSPL with vendor extensions.
>
> **Source of truth:** TSC's _TSPL II Programming Manual_, the
> canonical reference published by TSC. No vendor-app harvesting.
> Docs cite TSC's manual, not any specific printer firmware.
>
> **First consumer:** the labelife driver, which currently has
> embedded TSPL II encode logic that will be migrated to consume
> this package. See
> [`labelife/plans/refactor-to-protocol-cores.md`](../../labelife/plans/refactor-to-protocol-cores.md)
> for the migration plan.
>
> **Future consumers:** TSC's own consumer line (TX-series, TE200,
> DA210), generic TSPL-speaking OEM rebrands not in the labelife
> Aimo/Quyin family (some Munbyn / Phomemo standalone, Polono,
> Vretti, etc.), and any future TSPL-extending vendor.
>
> Structure mirrors `@thermal-label/labelife-core` minus the
> per-package `node`/`web` runtime adapters — `tspl-core` is a
> protocol-only package with no transport bindings. Read the
> labelife repo before deviating; this package is half its size.

---

## 0. Scope and key constraints

- **Pure TSPL II only.** Every byte sequence this package produces
  is documented in TSC's _TSPL II Programming Manual_. Vendor
  extensions (LZO `BITMAP` modes 3/4, `SSS<KEY>` status, `7E xx 7E`
  ACK framing, `1F 11 xx` opcode families, etc.) are **out of
  scope** and live in driver packages that import this one.

- **No transports.** This package emits `Uint8Array` byte sequences
  that callers feed to a `Transport` of their choice. `tspl-core`
  has no `Transport` import, no USB / BLE / Serial / TCP code, no
  device discovery. Same posture as the existing
  `@thermal-label/contracts` package.

- **No device registry.** `tspl-core` ships no per-model JSON5
  data. The notion of a "device" is a `TsplEngine` shape passed
  in by callers — `{ dpi: 203 | 300 | 600, headDots: number }` —
  not a registry of named printers. Driver packages own the
  device data; `tspl-core` is purely the encoder.

- **`BITMAP` modes 0, 1, 2** are spec-defined and supported here
  (uncompressed, OR, XOR). Modes 3 and 4 are vendor LZO
  extensions and live in driver packages. The header builder
  accepts any mode integer to allow vendor packages to construct
  modes 3/4 bytes; the high-level `encodeTsplJob` hard-codes mode
  0 by default.

- **Bitmap input is a `LabelBitmap` from `@mbtech-nl/bitmap`.**
  Already 1-bpp packed, MSB-first, `1 = dark dot` per the bitmap
  library's invariants. Spec-aligned with TSPL II's published
  bit-polarity (the ones-complement-of-spec quirk seen in some
  vendor firmwares is **not** applied here — that lives in the
  driver if needed).

- **Status framing is line-based ASCII.** Pure TSPL II uses
  `\r\n`-terminated text lines for replies. This package ships a
  thin line splitter / matcher; vendor `SSS<KEY>` parsing lives
  downstream.

- **Single package, no `node`/`web` split.** This is a protocol
  module, not a runtime adapter. The package is universal
  (browser + Node) by virtue of using only `Uint8Array` and
  `TextEncoder` / `TextDecoder`.

- **Package name** — `@thermal-label/tspl-core`.
  Sub-engine identifier — `'tspl'`. (Vendor packages may extend
  with their own protocol identifiers like `'tspl-c1'` etc.)

---

## 1. Repository structure

```
tspl-core/
├── .github/
│   ├── FUNDING.yml
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .githooks/
│   └── pre-push                      # typedoc regen + abort-on-diff
├── packages/
│   └── core/                         # the only package — flat workspace
│       ├── src/
│       │   ├── protocol.ts           # all directive byte builders
│       │   ├── encode.ts             # high-level encodeTsplJob (mode 0)
│       │   ├── status.ts             # line splitter + reply line shape
│       │   ├── types.ts
│       │   └── index.ts
│       └── ...
├── docs/
│   ├── .vitepress/config.ts
│   ├── index.md
│   ├── getting-started.md
│   ├── api.md                        # typedoc-rendered surface
│   └── protocol.md                   # the byte-level reference
├── plans/
├── HARDWARE.md                       # links out — tspl-core has no hardware
├── DECISIONS.md
├── PROGRESS.md
├── INTEROPERABILITY.md
├── LICENSE
├── README.md
├── eslint.config.js
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── typedoc.json
```

The "monorepo" shape is preserved (`pnpm-workspace.yaml`,
`packages/core/`) for consistency with the rest of the suite — but
there's only one package inside. Keeps the option open to add a
`packages/cli` or `packages/codegen` later without restructuring.

---

## 2. Tooling and configuration

Same baseline as `@thermal-label/labelife` — copy verbatim:

- Node `>=20.9.0`, pnpm `>=9.0.0`, TypeScript `~5.5.0`
- `@mbtech-nl/eslint-config`, `@mbtech-nl/prettier-config`,
  `@mbtech-nl/tsconfig`
- `@mbtech-nl/bitmap` for `LabelBitmap` typing only — runtime is
  pass-through (we read `bitmap.data` and `bitmap.widthPx` /
  `heightPx`, no transforms here)
- Vitest, `@vitest/coverage-v8`, 90 % threshold at the final step
- VitePress for docs (with `markdown.html: false`)
- Typedoc + typedoc-plugin-markdown
- `argsIgnorePattern: '^_'` in `eslint.config.js`
- `.githooks/pre-push` regenerates `docs/api/` and aborts on diff

`package.json`:

```jsonc
{
  "name": "@thermal-label/tspl-core",
  "version": "0.1.0",
  "description": "Pure TSPL II protocol encoder — directive byte builders + status line shape, anchored on TSC's TSPL II Programming Manual.",
  "keywords": ["tspl", "tspl-ii", "label-printer", "thermal-label", "tsc"],
  "type": "module",
  "sideEffects": false,
  "types": "./src/index.ts",
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./src/index.ts" }
  },
  // ...the rest mirroring labelife-core's package.json shape
}
```

---

## 3. Public API surface (final)

```ts
// re-exported from @mbtech-nl/bitmap (consumers import from one place)
export type { LabelBitmap } from '@mbtech-nl/bitmap';

// directive byte builders — every public TSPL II directive the
// LabeLife / TSC driver ecosystem actually uses
export {
  buildSize,                       // SIZE <w> mm,<h> mm\r\n
  buildGap,                        // GAP <pitch> mm,<offset> mm\r\n
  buildBline,                      // BLINE <pitch> mm,<offset> mm\r\n
  buildOffset,                     // OFFSET <n> mm\r\n
  buildReference,                  // REFERENCE <x>,<y>\r\n  (dots)
  buildDirection,                  // DIRECTION 0,0\r\n
  buildDensity,                    // DENSITY <n>\r\n
  buildSpeed,                      // SPEED <n>\r\n
  buildCls,                        // CLS\r\n
  buildInitialPrinter,             // INITIALPRINTER\r\n
  buildPrint,                      // PRINT 1,<copies>\r\n  (or \n\r if caller wants — flag)
  buildFormfeed,                   // FORMFEED\r\n
  buildSelftest,                   // SELFTEST\r\n
  buildShift,                      // SHIFT <n>\r\n
  buildBitmapHeader,               // BITMAP 0,0,<w_bytes>,<h>,<mode>,
  BITMAP_TAIL,                     // \r\n
  concatBytes,                     // (...Uint8Array[]) => Uint8Array
} from './protocol.js';

// high-level encoder — produces a complete pure-TSPL job for the
// uncompressed BITMAP mode 0 path. Vendor packages bypass this and
// call the builders directly.
export { encodeTsplJob } from './encode.js';
export type { TsplEngine, TsplPage, TsplJobOptions } from './types.js';

// status — pure TSPL II status replies are `\r\n`-terminated ASCII.
// Vendor `SSS<KEY>:<VALUE>` parsing lives in driver packages.
export {
  splitStatusLines,                // (Uint8Array) => string[]
  parseStatusLine,                 // (string) => { kind: 'unknown' | 'btver'; ... }
} from './status.js';
```

---

## 4. Directive byte builders (`src/protocol.ts`)

Lift verbatim from `labelife/packages/core/src/tspl/protocol.ts`.
Already pure TSPL II — no vendor content. The labelife code can
literally be copied across with the import paths adjusted.

Two minor adjustments:

1. **`buildPrint(copies, lineEnding)`** — keep the optional
   `lineEnding: '\r\n' | '\n\r'` parameter (default `'\r\n'`).
   labelife's l3/m3 firmwares accept the reversed `\n\r`; pure
   TSC firmware expects `\r\n`. Vendor packages pass `'\n\r'`
   when their printer needs it.

2. **`buildBitmapHeader(x, y, widthBytes, height, mode)`** —
   `mode` typed as `number` (not `0 | 1 | 2 | 3 | 4`) so vendor
   packages can pass mode 3 / 4 / future values without type
   assertions. Document inline: "0/1/2 are spec-defined; values
   ≥ 3 are vendor extensions, not in scope for this package."

---

## 5. High-level encoder (`src/encode.ts`)

```ts
export interface TsplEngine {
  /** Dots per inch — 203 (8 dots/mm), 300 (~11.81 dots/mm), 600 (~23.62). */
  dpi: 203 | 300 | 600;
  /** Native head width in dots. */
  headDots: number;
}

export interface TsplPage {
  bitmap: LabelBitmap;
  /** Label media. */
  media: { widthMm: number; heightMm: number; type: 'gap' | 'bline' | 'continuous' };
  options?: TsplJobOptions;
}

export interface TsplJobOptions {
  /** Density (0..15 nominal; firmware clamps). */
  density?: number;
  /** Speed (1..15 in/s nominal; firmware clamps). */
  speed?: number;
  /** Number of copies. Default 1. */
  copies?: number;
  /** Origin offset in dots — emitted via REFERENCE. Default 0,0. */
  origin?: { x: number; y: number };
  /** Trailing line ending on PRINT. Default '\r\n'; vendor packages may pass '\n\r'. */
  printLineEnding?: '\r\n' | '\n\r';
  /** GAP / BLINE pitch in mm. Default 2 mm for gap, 3 mm for bline. */
  pitch?: number;
}

/**
 * Emit a complete pure-TSPL-II print job using BITMAP mode 0
 * (uncompressed). Drivers that need LZO-compressed BITMAP modes 3
 * or 4 build their own job stream by calling the directive builders
 * + their own bitmap-payload code (see labelife for the pattern).
 */
export function encodeTsplJob(engine: TsplEngine, page: TsplPage): Uint8Array;
```

The implementation lifts the body of labelife's `encodeTsplJob`
**minus** the LZO branches. Mode 0 only.

---

## 6. Status (`src/status.ts`)

Pure TSPL II reply lines are `\r\n`-terminated text. The wire spec
doesn't define a fixed reply schema — `SSS<KEY>:<VALUE>` and
`BTVER:V<x.y.z>` are vendor conventions on top, parsed by driver
packages. This package ships the line splitter and a generic line
shape:

```ts
/** Split a possibly-fragmented byte buffer into complete `\r\n`-terminated lines. */
export function splitStatusLines(bytes: Uint8Array): {
  lines: readonly string[];
  remainder: Uint8Array;       // bytes that didn't terminate yet — feed back next call
};

export type StatusLine =
  | { kind: 'btver'; version: string }
  | { kind: 'unknown'; raw: string };

export function parseStatusLine(line: string): StatusLine;
```

Vendor `SSS<KEY>` parsers live in the driver packages — they call
`splitStatusLines` to get whole lines, then fall through their
own dispatch.

---

## 7. Tests (`src/__tests__/`)

- `protocol.test.ts` — every directive builder produces the
  documented byte sequence per the TSC manual. Mostly lifted from
  labelife's existing `tspl-status.test.ts` and the protocol-level
  tests in `tspl-encode.test.ts`.
- `encode.test.ts` — `encodeTsplJob` produces the expected
  pure-TSPL byte stream for a 50×30 mm gap, 1 copy, 203 dpi label
  with BITMAP mode 0. Golden bytes documented inline.
- `status.test.ts` — line splitter handles fragmented buffers
  across calls; remainder is correctly returned.

Coverage gate: 90 % at step 4.

---

## 8. Implementation sequence

```
1. Scaffold (1 day)
   - Root config, .github, INTEROPERABILITY.md, README.md
   - .githooks/pre-push
   - pnpm install — clean

2. Lift from labelife (1 day)
   - Copy `labelife/packages/core/src/tspl/protocol.ts` → here
   - Adapt high-level encoder for mode 0 only
   - Add `splitStatusLines` (extracted from labelife status.ts)
   - Vitest: lift tests from labelife where applicable
   - Gate: typecheck + lint + test + build green

3. Docs site (1 day)
   - VitePress wiring
   - getting-started.md, protocol.md, api.md
   - Typedoc API
   - Gate: docs:build green

4. Final
   - pnpm test:coverage — verify 90 % threshold
   - Release 0.1.0
   - Update labelife to consume @thermal-label/tspl-core (separate PR
     in the labelife repo — see refactor plan)
```

Total: **~3 days** of focused work. Most of the code is a lift
from labelife with minor reshaping.

---

## 9. Key constraints and agent notes

- **Pure spec, no vendor extensions.** Modes 3/4 of `BITMAP`,
  `SSS<KEY>` status, `7E xx 7E` ACK framing, AT command bridge —
  all out of scope. Stay in the labelife / future-vendor packages.

- **`buildBitmapHeader` mode is `number`, not a literal union.**
  Vendor packages need to pass values ≥ 3 without casts.
  Documented inline.

- **No device registry, no transports, no `node`/`web` split.**
  This is a protocol module. Universal (browser + Node) by virtue
  of `Uint8Array` only.

- **Read [labelife's `tspl/protocol.ts`](../../labelife/packages/core/src/tspl/protocol.ts)
  and [`tspl/encode.ts`](../../labelife/packages/core/src/tspl/encode.ts)**
  before writing any code. The bulk of this package is a lift from
  there with the LZO branches removed.

- **Source attribution:** TSC's _TSPL II Programming Manual_ only.
  No mention of the LabeLife app, Aimo, or any specific vendor
  firmware. INTEROPERABILITY.md frames the package as a generic
  TSPL II encoder for interoperability with any TSPL-speaking
  printer.

- **Bitmap polarity is spec-aligned.** Per TSC's manual, BITMAP
  bit `0` = printed, bit `1` = un-printed. This package emits
  bytes that match `LabelBitmap`'s `1 = dark` convention by
  applying a per-byte invert in `encodeTsplJob`. Vendor packages
  whose firmware accepts the inverted-from-spec polarity (e.g.
  labelife) bypass `encodeTsplJob` and emit the bytes raw.

- **`types: "./src/index.ts"`** in package.json.

- **`sideEffects: false`** in package.json.

- **Coverage threshold** enforced only at step 4.

- **Changesets** for versioning.

- **INTEROPERABILITY.md** at the root — frames the package as a
  generic TSPL II encoder. Cites TSC's manual as the only source.
  No vendor-app mention.
