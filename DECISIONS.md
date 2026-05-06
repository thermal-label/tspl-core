# Decisions

Substantive design decisions made while building `tspl-core`.

## D1 — Per-byte invert in `encodeTsplJob` to match TSC spec polarity

**Date:** 2026-05-06
**Context:** TSC's TSPL II Programming Manual specifies that
within a `BITMAP` payload, **bit `0` represents a printed (dark)
dot** and bit `1` represents an un-printed dot. The
`@mbtech-nl/bitmap` package uses the opposite convention —
`LabelBitmap.data` packs `1 = dark dot`.

**Decision:** `encodeTsplJob` applies a per-byte one's-complement
(`(~b) & 0xff`) to the raster bytes when emitting them on the
wire. The high-level encoder is therefore **spec-aligned**: pass
in a `LabelBitmap` with its natural `1 = dark` convention, get
out wire bytes that match TSC's manual byte-for-byte.

**Consequence:** This is a **deliberate divergence from the
labelife implementation**, which sends bitmap bytes raw because
labelife's target firmwares (Aimo / Quyin family) accept the
inverted-from-spec polarity. Vendor driver packages whose
firmware behaves like labelife's must **bypass** `encodeTsplJob`
and call the directive builders directly, emitting their
`LabelBitmap.data` raw. The plan calls this out explicitly:
"Vendor packages that need the labelife-style polarity build
their own job stream by calling the directive builders + their
own bitmap-payload code."

**Documented in:** `encode.ts` JSDoc, `INTEROPERABILITY.md`,
`docs/protocol/tspl.md`, `README.md`.

## D2 — `printLineEnding` kept as parameter (default `\r\n`)

**Date:** 2026-05-06
**Context:** Per TSC's manual, the `PRINT` directive terminates
with `\r\n`. Some vendor firmwares (notably labelife's `tspl-l3`
and `tspl-m3` Wi-Fi engines) accept — and their official tooling
emits — the reversed `\n\r`.

**Decision:** Keep `printLineEnding: '\r\n' | '\n\r'` on
`TsplJobOptions` (default `'\r\n'`) and pass it through to
`buildPrint`. `tspl-core` is spec-aligned by default; vendor
packages that need the reversed form can opt in without forking
the encoder.

**Alternative considered:** Strip the parameter entirely and
require vendor packages to call `buildPrint` directly. Rejected
because the rest of `encodeTsplJob` is still useful for those
packages — only the `PRINT` line-ending differs.

## D3 — `mode` parameter on `buildBitmapHeader` typed as `number`

**Date:** 2026-05-06
**Context:** The TSPL II spec defines `BITMAP` modes 0, 1, 2.
Vendor firmwares add modes 3 and 4 (LZO-compressed). Future
extensions are possible.

**Decision:** Type the `mode` parameter as `number` (not
`0 | 1 | 2`). Document inline that 0/1/2 are spec-defined and
`≥ 3` are vendor extensions out of scope for this package.

**Rationale:** Vendor packages need to construct extension-mode
header lines without `as number` casts. A literal-union type
would force casts everywhere downstream, and the bytes emitted
for any integer mode are mechanical (decimal formatting) — there
is no validation `tspl-core` could usefully add that wouldn't
break vendor consumers.

## D4 — Status surface is just `splitStatusLines` + an `unknown`-only `parseStatusLine`

**Date:** 2026-05-06
**Context:** The TSC TSPL II manual specifies `\r\n`-terminated
ASCII for replies but does **not** standardise reply payload
schemas. Vendor firmwares each define their own keyword shapes.

**Decision:** Ship `splitStatusLines` (the shared, vendor-neutral
plumbing — line buffering across fragmented reads) plus a
deliberately-minimal `parseStatusLine` that always returns
`{ kind: 'unknown', raw }`. Vendor parsers compose on top of
`splitStatusLines`.

**Rejected from scope:** vendor `SSS<KEY>:<VALUE>` parsing,
capability-table parsing, `BTVER:V<x.y.z>` parsing, `STATUS_REQUESTS`
constants, AT-command builders. All of these are vendor
conventions; they live in driver packages.

## D5 — `splitStatusLines` re-encodes the leftover string for the remainder

**Date:** 2026-05-06
**Context:** When a buffer ends mid-line, the leftover bytes need
to be returned for re-feeding alongside the next read.

**Decision:** Decode the buffer as UTF-8, find lines via string
`indexOf('\r\n')`, then re-encode the trailing slice for the
remainder.

**Rationale:** Slicing the original `Uint8Array` at the
post-`\r\n` cursor is unsafe across multi-byte UTF-8 boundaries
(though TSPL II replies are ASCII, the manual is silent on
character set so we don't assume single-byte encoding). The
encode round-trip is correct for any UTF-8 input. It costs an
allocation per call; the buffers are small.

## D6 — Single workspace, only `packages/core/`

**Date:** 2026-05-06
**Context:** Plan § 1 specifies a `pnpm-workspace.yaml`-shaped
monorepo with one package inside.

**Decision:** Followed. Keeps the option open to add a `cli` or
`codegen` package later without restructuring; matches the
sibling `@thermal-label/labelife` repo shape.

## D7 — `prepare` script points hooks at `.githooks/` even before `git init`

**Date:** 2026-05-06
**Context:** The user controls when this directory becomes a
git repo; the `prepare` script in `package.json` runs at
`pnpm install` time and configures `core.hooksPath`.

**Decision:** Wrap the `git config` invocation in a try/catch so
it silently no-ops when the working tree is not yet a git repo.
Matches labelife's convention. No effect when there's no `.git/`
directory.

## D8 — Default GAP pitch 2 mm, default BLINE pitch 3 mm

**Date:** 2026-05-06
**Context:** Plan § 5 specifies these defaults.

**Decision:** Followed. Both are conservative values that match
common label stocks; callers override via `options.pitch` when
their stock differs.

## D9 — Driver-complete, not protocol-complete

**Date:** 2026-05-06
**Context:** The 0.1.0 surface was a narrow lift from labelife —
just the directives that driver needed to extract. 0.2.0 widens
the surface to **driver-complete**: every command needed to drive
a bitmap-rasterised print job end-to-end, plus paper handling,
plus status. **Not protocol-complete** — native text rendering,
native barcodes, drawing primitives, scripting, file system, RFID
write, and image-import directives stay out.

**Decision:** Adopt the rule **"bitmap in, printer code out"** as
the contract for what gets built and what stays out. If a TSPL II
command exists to make the printer render content the host could
have rendered (text, barcodes, shapes), reject. If it controls how
the printer interprets / outputs / reports on its bitmap-printing
job (setup, paper handling, configuration, status), include.

**Drawing primitives stay out specifically.** `BAR` / `BOX` /
`ERASE` / `REVERSE` are tempting because they're cheaper on the
wire than rasterisation and are arguably "shape control" rather
than "content rendering." But they have no consumer in the
bitmap-in pipeline — to be useful, the API would need to grow a
shape DSL, and that becomes the wedge for the rest of the spec
this rule excludes (text → barcodes → scripting → file system).
See § 0.1 of [`plans/expand-to-driver-complete.md`](./plans/expand-to-driver-complete.md)
for the full rationale.

**Consequence:** Every other driver in the suite (Brother QL,
LabelWriter, LabelManager, LetraTag, Niimbot, labelife, planned
cat-printer) is bitmap-only. Holding the line in `tspl-core` keeps
the suite uniform. If a shape DSL ever materialises as a real
need, it ships as a separate package (e.g.
`@thermal-label/label-dsl`), not as a parameter on `tspl-core`.

**New surface in 0.2.0:** 6 paper-handling builders, 13 setup /
configuration builders, 2 status query / output builders, plus
`parseStatusLine` widened to recognise the four spec-defined
reply shapes (`OK`, `ERROR <code>`, echoed text, the
`ESC ! ?` single status byte via `parseStatusByte`).

## D10 — `parseStatusLine` requires `expectedEcho` to disambiguate echoes

**Date:** 2026-05-06
**Context:** The TSPL II `ECHO "<text>"` directive reflects the
`text` payload back on the response channel as a `\r\n`-terminated
line. With `SET RESPONSE ON` also enabled, the printer also emits
`OK\r\n` after most commands. An echoed payload of `"OK"` is
indistinguishable from a real ack on the wire.

**Decision:** `parseStatusLine(line, expectedEcho?)` only routes a
line to `{ kind: 'echo', text }` when the caller passes
`expectedEcho` matching the trimmed line. With no `expectedEcho`,
`OK` always parses as `{ kind: 'ok' }` — even if the printer
actually echoed it. Callers that want strict echo dispatch must
pass the original payload.

**Alternative considered:** Stripping `OK` recognition and routing
everything that isn't `ERROR <code>` to `unknown`. Rejected
because the ack-vs-error split is the most useful dispatch the
spec actually defines, and forcing every caller to re-implement
it is worse than the rare echoed-`OK` case.

**Documented in:** `parseStatusLine` JSDoc (the rationale appears
inline so the contract is visible at the call site).

## D11 — `StatusByte.temp` is in the public shape but always `false`

**Date:** 2026-05-06
**Context:** The expansion plan calls for `StatusByte` to expose
six flags — `ready / paper / cover / temp / pause / ribbon`. TSC's
TSPL II Programming Manual documents the `ESC ! ?` reply byte's
bit assignments but does **not** surface a head-temperature flag
at the byte level. Some vendor firmwares route over-temperature
through bit 1 (alongside paper jam); others reuse a reserved bit.

**Decision:** Keep `temp: boolean` in the public `StatusByte`
shape so the call site has a stable contract, but always set it
to `false` from `parseStatusByte`. The raw byte is exposed on
`StatusByte.byte` so driver packages with vendor-specific
knowledge of which bit their firmware uses can post-process the
result.

**Documented in:** JSDoc on `StatusByte` and `parseStatusByte`.
