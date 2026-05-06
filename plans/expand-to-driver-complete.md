# tspl-core — Expand to driver-complete (0.1.0 → 0.2.0)

> Expansion plan for `@thermal-label/tspl-core`. The 0.1.0 release
> ships a narrow surface — just what `labelife` needed to extract.
> This plan widens it to **driver-complete** within the suite's
> design rule:
>
> > **Bitmap in, printer code out.** The host produces a
> > `LabelBitmap` (via `@mbtech-nl/bitmap`'s rendering pipeline);
> > `tspl-core` produces the wire bytes that drive a TSPL II
> > printer to render that bitmap.
>
> Driver-complete = every command needed to emit a bitmap-driven
> print job end-to-end, plus paper handling, plus status. **Not**
> protocol-complete — native text / native barcodes / TSPL
> scripting / file system stay out of scope per the design rule.
>
> Read [`initial-buildout.md`](./initial-buildout.md) first. This
> plan is additive; nothing the 0.1.0 surface ships changes shape
> or breaks.

---

## 0. Design rule — what's in, what's out

### In scope (this plan adds it)

- **Setup directives that affect bitmap printing.** Anything that
  changes how the printer renders the next bitmap.
- **Paper handling that bitmap can't express.** Cut, partial cut,
  form-feed, back-feed, home, feed-n-dots.
- **Persistent printer configuration that affects between-jobs
  behaviour.** Auto-cutter, ribbon, tear-off, peel-off, head
  settings, response format.
- **Status query / reply for every spec-documented response.** The
  receipts-vs-labels split mostly doesn't apply to status — paper,
  cover, head temp, ribbon are status fields any thermal label
  printer reports.

### Out of scope (per the design rule)

- **Native text rendering** — `TEXT` directive with built-in fonts,
  `CODEPAGE`. Use `renderImage` from `@mbtech-nl/bitmap` instead.
- **Native barcode generation** — `BARCODE` (1D), `QRCODE`,
  `DMATRIX`, `PDF417`, `MAXICODE`, `AZTEC`. Use bitmap rendering
  upstream.
- **Image-import directives** — `PUTBMP`, `PUTPCX`. The host
  already has the image; no need for the printer to decode BMP /
  PCX.
- **TSPL scripting** — `GOSUB` / `RETURN` / `IF` / `FOR` / `NEXT`
  / `WHILE` / `WEND` / `END`. Loop in JS instead.
- **File system** — `DOWNLOAD` / `EOP` / `FILES` / `KILL FILES` /
  `RUN`. Persistent labels on printer flash are a different
  paradigm; doesn't fit the per-job model.
- **RFID write** — `RFID` family. Out of scope and ethically
  dubious (re-programming roll tags).
- **Color-print directives** — `COLOR` (color thermal-transfer).
  Two-colour ribbon is a niche subset; can add later if a driver
  asks.
- **Variables / built-ins** — `SET KEY1` / `SET KEY2` /
  `SET KEY3`, `&CONTRAST`, `@LABEL` etc. Programmer-facing TSPL
  conveniences; don't fit the encoder model.
- **Drawing primitives** — `BAR`, `BOX`, `ERASE`, `REVERSE`. Out
  on principle, not just on rule. See § 0.1 below.

The rule: if the command exists to make the printer render
something the host could have rendered, **out**. If the command
exists to control how the printer interprets / outputs / reports
on its bitmap-printing job, **in**.

### 0.1 Why drawing primitives stay out

`BAR` / `BOX` / `ERASE` / `REVERSE` are tempting to include —
rasterising thin lines and borders is wasteful, and the wire-byte
savings can be real on shape-heavy labels (a 2-dot horizontal
separator: ~100 bytes as bitmap vs ~17 bytes as `BAR`).

But they have no consumer in the bitmap-in pipeline. The encoder
receives a flat `LabelBitmap` — it can't tell a filled rectangle
from any other run of black pixels. For drawing builders to be
*used*, the API would have to grow a second surface — a shape
DSL where the caller composes a label from primitives in printer
coordinates:

```ts
printer.printShapes([
  { kind: 'box',    x: 10, y: 10, width: 800, height: 200, thickness: 2 },
  { kind: 'bitmap', x: 100, y: 100, image: someRawImageData },
  { kind: 'bar',    x: 10, y: 220, width: 800, height: 4 },
]);
```

That's a fundamentally different UX, and it's the **wedge for
the rest of the spec** we just excluded. Once a caller can pass
`{ kind: 'box', … }`, the next ticket is `{ kind: 'text', font,
content }` (pulls in `TEXT` + native fonts + `CODEPAGE`), then
`{ kind: 'qr', data }` (pulls in `QRCODE`), then template
variables (pulls in `SET COUNTER` + scripting), then "store this
on the printer" (pulls in `DOWNLOAD` / `RUN`). The design rule
holds the line precisely because it forecloses that slope.

Every other driver in the suite — Brother QL, LabelWriter,
LabelManager, LetraTag, Niimbot, labelife, planned cat-printer —
is bitmap-only. They converged on "render upstream, send the
rasterised result" because it's font-portable, vendor-portable,
and preview-able. Adding shape primitives only to `tspl-core`
breaks the suite's uniformity for the one driver family that
has them in spec, while none of the rest can use them.

If a shape DSL ever materialises as a real need, it's a separate
package — something like `@thermal-label/label-dsl` — that
composes on top of the protocol-core packages. It would route
shape primitives to native directives where supported (TSPL) and
back into the raster pipeline where not (ESC/POS, Brother QL,
Niimbot, etc.). That's a different project.

---

## 1. Commands to add

Grouped by section in `protocol.ts`. Each row adds a builder; the
existing 16 builders from 0.1.0 stay untouched.

### 1.1 Paper handling

| Builder | Wire bytes | Purpose |
| --- | --- | --- |
| `buildBackfeed(dots)` | `BACKFEED <n>\r\n` | Reverse-feed `n` dots after print |
| `buildHome()` | `HOME\r\n` | Move printhead to home position |
| `buildCut()` | `CUT\r\n` | Trigger cutter (full cut) |
| `buildPartialCut()` | `PARTIAL_CUTTER\r\n` | Trigger partial cut (one in N labels) |
| `buildKill()` | `KILL\r\n` | Abort current job |
| `buildNull()` | `NULL\r\n` | No-op / ping |

### 1.2 Setup / configuration

| Builder | Wire bytes | Purpose |
| --- | --- | --- |
| `buildSetCutter(mode)` | `SET CUTTER <mode>\r\n` | Auto-cutter on/off/per-N (`'OFF'` / `'ON'` / `'BATCH'` / `<n>`) |
| `buildSetPartialCutter(n)` | `SET PARTIAL_CUTTER <n>\r\n` | Cut after every Nth label |
| `buildSetRibbon(mode)` | `SET RIBBON <mode>\r\n` | `'ON'` (thermal-transfer) / `'OFF'` (direct-thermal) |
| `buildSetTear(state)` | `SET TEAR <state>\r\n` | `'ON'` / `'OFF'` — tear-off mode |
| `buildSetPeel(state)` | `SET PEEL <state>\r\n` | Peel-off mode |
| `buildSetHead(state)` | `SET HEAD <state>\r\n` | Head sensor `'ON'` / `'OFF'` |
| `buildSetCounter(slot, mode)` | `SET COUNTER @<slot> <mode>\r\n` | Multi-up label sequence counters |
| `buildSetResponse(state)` | `SET RESPONSE <state>\r\n` | Reply-format toggle |
| `buildSetPrintkey(state)` | `SET PRINTKEY <state>\r\n` | Front-panel button enable |
| `buildSetReprint(state)` | `SET REPRINT <state>\r\n` | Auto-reprint on error |
| `buildLimitfeed(dots)` | `LIMITFEED <n>\r\n` | Maximum feed length |
| `buildEoj()` | `EOJ\r\n` | End of job marker |

### 1.3 Status query / output

| Builder | Wire bytes | Purpose |
| --- | --- | --- |
| `buildEcho(text)` | `ECHO "<text>"\r\n` | Echo a string back (smoke-test the link) |
| `buildOut(text)` | `OUT "<text>"\r\n` | Send literal text on response channel (used by status scripts) |

### 1.4 Existing 0.1.0 directives — unchanged

`buildSize`, `buildGap`, `buildBline`, `buildOffset`,
`buildReference`, `buildDirection`, `buildDensity`, `buildSpeed`,
`buildCls`, `buildInitialPrinter`, `buildPrint`, `buildFormfeed`,
`buildSelftest`, `buildShift`, `buildBitmapHeader`, `BITMAP_TAIL`,
`concatBytes`. No shape changes.

---

## 2. Status parsing — expand `parseStatusLine`

The 0.1.0 status surface is `splitStatusLines` (line splitter) +
`parseStatusLine` (returns `{ kind: 'unknown', raw }` for
everything). Driver-complete status parsing recognises the
**spec-defined** reply shapes:

| Reply shape | Trigger | Parsed shape |
| --- | --- | --- |
| `<status byte>` (1 byte from `SET RESPONSE` raw mode) | `ESC ! ?` query | `{ kind: 'status-byte'; ready / paper / cover / temp / pause / ribbon }` |
| `OK\r\n` | After most setup commands when `SET RESPONSE ON` | `{ kind: 'ok' }` |
| `ERROR <code>\r\n` | After a failed command | `{ kind: 'error'; code }` |
| `<echo text>\r\n` | After `ECHO` | `{ kind: 'echo'; text }` |

Vendor reply shapes (`SSS<KEY>:<VALUE>`, `BTVER:V<x.y.z>`, etc.)
stay **out** — those live in driver packages.

`splitStatusLines` doesn't change. `parseStatusLine` widens its
return union to include the four kinds above.

---

## 3. High-level encoder — keep narrow

`encodeTsplJob` from 0.1.0 stays focused on the
mode-0-uncompressed bitmap path. It does **not** grow to invoke
the new directives — they're builders, available to callers who
want to assemble custom job streams.

Rationale: `encodeTsplJob` is a convenience for the simple
"bitmap → wire bytes" case. Anything more sophisticated (cut
between copies, set cutter mode at job start, emit boxes /
bars / native shapes) is a job the caller orchestrates by
calling builders directly.

If a future need surfaces — e.g. "emit a job that cuts after
each copy" — we add `encodeTsplJobWithCut(engine, page,
options)` as a sibling, not a parameter on the canonical one.

---

## 4. File structure changes

```
packages/core/src/
├── protocol.ts                         # ← grows (existing builders + new)
├── encode.ts                           # unchanged
├── status.ts                           # ← parseStatusLine widens
├── types.ts                            # ← StatusLine union grows
└── index.ts                            # ← re-export the new builders
```

No new files. The protocol surface stays in one module — the
builders are small and discovery via export is clearer than
splitting into sub-modules.

`__tests__/`: split `protocol.test.ts` if it gets unwieldy, but
otherwise keep one test file per source file.

---

## 5. Documentation changes

- **`docs/protocol.md`** — expand with the new directive families.
  Group the table by purpose (setup / paper / config / drawing /
  status) rather than alphabetically.
- **`README.md`** — update the "Capabilities" line to reflect
  driver-complete scope.
- **`HARDWARE.md`** — add a brief note that the encoder targets
  the bitmap-rasterisation use case; native text / native
  barcodes are out of scope.
- **`INTEROPERABILITY.md`** — add a paragraph documenting the
  design rule explicitly: "this package targets the bitmap-driven
  printing model. Commands that exist solely to make the printer
  render content the host could have rendered (text, barcodes,
  scripting) are not in scope."
- **`DECISIONS.md`** — add a decision: "D9 — Driver-complete, not
  protocol-complete. Bitmap-in/printer-code-out is the design
  rule. Native rendering directives stay out."

---

## 6. Tests

For each new builder: a test that asserts the byte sequence
matches the spec. Pattern same as 0.1.0 tests.

Test counts (estimate):
- Paper handling: ~6 tests
- Setup / config: ~12 tests (some have enum branches)
- Status parsing: ~8 tests (four kinds × happy / edge)

Total addition: **~26 tests**, on top of 0.1.0's 48. Coverage
gate stays at 90 %.

---

## 7. Implementation sequence

```
1. Paper handling builders (1 day)
   - 6 builders + tests
   - Update protocol.md table

2. Setup / config builders (1.5 days)
   - 13 builders + tests
   - Group enum types in types.ts (CutterMode, RibbonMode, etc.)

3. Status parsing expansion (0.5 days)
   - parseStatusLine widens
   - 8 tests for the four spec-defined reply shapes

4. Docs + decisions (0.5 days)
   - protocol.md / README / INTEROPERABILITY / DECISIONS
   - typedoc regeneration

5. Final
   - pnpm test:coverage — 90 % maintained
   - Bump 0.1.0 → 0.2.0 (minor — additive, no breaks)
   - Release notes call out the design rule
```

Total: **~3.5 days** focused work.

---

## 8. Migration / consumer impact

`@thermal-label/labelife` does not consume the new surface — it
relies on its own LZO-compressed `BITMAP` wrapping and adds the
extra builders only when a real labelife use case surfaces.

`@thermal-label/labelife-core` keeps its `^0.2.0` dep range; the
0.2.0 publish is a drop-in.

Future drivers (TSC TX-series, generic-TSPL OEM rebrands) consume
the new surface as needed. No public API breaks for any consumer.

---

## 9. Key constraints and agent notes

- **The design rule is the contract.** "Bitmap in, printer code
  out." Reject any directive proposal that exists to make the
  printer render content the host could have rendered.
- **TEXT, BARCODE, QRCODE — these will be tempting.** They're
  popular in the wild. The answer is "use `renderImage` from
  `@mbtech-nl/bitmap` to render them upstream and send the
  rasterised result." Add to FAQ.
- **Drawing primitives stay out** — `BAR` / `BOX` / `ERASE` /
  `REVERSE` are the wedge for the rest of the spec we just
  excluded (text, barcodes, scripting, file system). § 0.1
  spells out the slope. Reject all four; if a shape DSL ever
  materialises, it's a separate package.
- **Status parsing stays narrow.** The four spec-defined reply
  shapes only. Vendor `SSS<KEY>` parsers compose on top of
  `splitStatusLines` in the driver package, same as today.
- **Source attribution** stays the same — TSC's _TSPL II
  Programming Manual_, no vendor-app mention.
- **Bump is 0.1.0 → 0.2.0** — minor, additive, no breaks. If we
  end up making any breaking change (we shouldn't), bump 1.0.0
  instead.
