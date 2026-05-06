---
'@thermal-label/tspl-core': minor
---

Expand to driver-complete bitmap-printing surface (0.1.0 → 0.2.0).

Adds 21 new directive builders for paper handling
(`buildBackfeed`, `buildHome`, `buildCut`, `buildPartialCut`,
`buildKill`, `buildNull`), persistent setup/configuration
(`buildSetCutter`, `buildSetPartialCutter`, `buildSetRibbon`,
`buildSetTear`, `buildSetPeel`, `buildSetHead`, `buildSetCounter`,
`buildSetResponse`, `buildSetPrintkey`, `buildSetReprint`,
`buildLimitfeed`, `buildEoj`), and status query/output
(`buildEcho`, `buildOut`).

`parseStatusLine` widens its return union to recognise the four
spec-defined reply shapes — `{ kind: 'ok' }`, `{ kind: 'error',
code }`, `{ kind: 'echo', text }`, plus the new
`parseStatusByte(bytes)` for the `ESC ! ?` single-byte status
reply (`{ kind: 'status-byte', ... }`). Vendor-shaped lines still
fall through to `{ kind: 'unknown', raw }`.

Additive — every 0.1.0 export keeps its name and shape. The design
rule stays "bitmap in, printer code out": native text rendering,
native barcodes, drawing primitives, scripting, and file-system
directives remain out of scope.
