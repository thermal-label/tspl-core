# Progress

Tracking the implementation steps from
[`plans/initial-buildout.md`](./plans/initial-buildout.md) § 8.

## 1. Scaffold

- [x] Root `package.json` mirroring labelife's shape
- [x] `pnpm-workspace.yaml`, `tsconfig.base.json`, `eslint.config.js`
- [x] `.prettierignore`, `.gitignore`, `LICENSE`
- [x] `.changeset/config.json`
- [x] `.github/FUNDING.yml`
- [x] `.github/workflows/{ci,release,docs}.yml`
- [x] `.github/ISSUE_TEMPLATE/hardware_verification.md`
- [x] `.githooks/pre-push` (typedoc regen + abort-on-diff)
- [x] `INTEROPERABILITY.md`, `HARDWARE.md`, `README.md`
- [x] `DECISIONS.md`, `PROGRESS.md`
- [x] `pnpm install` clean

## 2. Lift from labelife (TSPL only, mode 0 only, no vendor)

- [x] `packages/core/src/protocol.ts` — every spec-defined directive
      builder (`buildSize`, `buildGap`, `buildBline`, `buildOffset`,
      `buildReference`, `buildDirection`, `buildDensity`, `buildSpeed`,
      `buildCls`, `buildInitialPrinter`, `buildPrint`, `buildFormfeed`,
      `buildSelftest`, `buildShift`, `buildBitmapHeader`, `BITMAP_TAIL`,
      `concatBytes`)
- [x] `buildBitmapHeader` `mode` parameter typed as `number`
      (not the labelife literal union) so vendor packages can pass
      extension values
- [x] `packages/core/src/types.ts` — `TsplEngine`, `TsplMedia`,
      `TsplJobOptions`, `TsplPage` (no labelife-side `LabelifeEngine`
      reference; no `protocol` discriminator)
- [x] `packages/core/src/encode.ts` — high-level `encodeTsplJob`,
      mode 0 only
- [x] Per-byte invert applied in `encodeTsplJob` to bridge
      `LabelBitmap`'s `1 = dark` to TSPL II's `0 = printed`
      (see DECISIONS.md D1)
- [x] `printLineEnding` option, default `'\r\n'` (DECISIONS.md D2)
- [x] `packages/core/src/status.ts` — `splitStatusLines` line splitter
      with fragmentation handling, plus minimal `parseStatusLine`
      returning `{ kind: 'unknown', raw }`
- [x] Vendor surface explicitly excluded: no `SSS<KEY>:<VALUE>` parser,
      no capability-table parser, no `STATUS_REQUESTS` constants, no
      AT-command builders, no ACK framing
- [x] `packages/core/src/index.ts` public surface
- [x] Tests:
  - [x] `protocol.test.ts` — every builder
  - [x] `encode.test.ts` — directive sequence, polarity invert,
        mm rounding, dpi variants, line-ending override, origin,
        copies, BLINE / continuous
  - [x] `status.test.ts` — splitter handles fragmentation, empty
        lines, multi-line buffers; `parseStatusLine` shape
- [x] Gate: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` green

## 3. Docs site

- [x] VitePress wiring (`markdown.html: false`, sidebar structure)
- [x] `docs/index.md` — homepage with feature list and source attribution
- [x] `docs/getting-started.md` — install, quick example, custom
      builder composition, status reading, when to bypass `encodeTsplJob`
- [x] `docs/hardware.md` — stub linking to driver-package responsibility
- [x] `docs/interoperability.md`
- [x] `docs/protocol/tspl.md` — byte-level reference for every directive
- [x] Typedoc API generation (`docs/api/`)
- [x] Gate: `pnpm docs:api`, `pnpm docs:build` green

## 4. Final

- [x] `pnpm test:coverage` — 90 % threshold met
- [ ] Release 0.1.0 (deferred — user controls the npm publish step)
- [ ] Update labelife to consume `@thermal-label/tspl-core`
      (separate PR in the labelife repo)

## Expansion to driver-complete (0.2.0)

Tracking the implementation steps from
[`plans/expand-to-driver-complete.md`](./plans/expand-to-driver-complete.md) § 7.

- [x] Paper handling builders — 6 builders + tests
      (`buildBackfeed`, `buildHome`, `buildCut`, `buildPartialCut`,
      `buildKill`, `buildNull`)
- [x] Setup / config builders — 13 builders + tests
      (`buildSetCutter`, `buildSetPartialCutter`, `buildSetRibbon`,
      `buildSetTear`, `buildSetPeel`, `buildSetHead`,
      `buildSetCounter`, `buildSetResponse`, `buildSetPrintkey`,
      `buildSetReprint`, `buildLimitfeed`, `buildEoj`, plus
      `buildEcho` / `buildOut` for status query / output)
- [x] Status query / output builders — 2 builders + tests
      (`buildEcho`, `buildOut`)
- [x] Status parsing expansion — `parseStatusLine` widens to
      recognise `{ kind: 'ok' }`, `{ kind: 'error', code }`,
      `{ kind: 'echo', text }`; `parseStatusByte` decodes the
      `ESC ! ?` single-byte reply
- [x] Public surface — every 0.1.0 export keeps its name and shape;
      new builders / status types added to `index.ts`
- [x] Docs — `docs/protocol/tspl.md` grouped by purpose; `README`
      "Capabilities" updated; `INTEROPERABILITY.md` design-rule
      paragraph added; `HARDWARE.md` bitmap-rasterisation note;
      `DECISIONS.md` D9 / D10 / D11
- [x] Typedoc API regenerated (`pnpm docs:api`)
- [x] VitePress docs build clean (`pnpm docs:build`)
- [x] Gate green: `pnpm format`, `pnpm typecheck`, `pnpm lint`,
      `pnpm test`, `pnpm test:coverage` ≥ 90 %, `pnpm build`
- [x] Version bump 0.1.0 → 0.2.0; changeset entry added
- [ ] Release 0.2.0 (deferred — user controls the npm publish step)
