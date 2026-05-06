---
name: Hardware verification report
about: Report a successful or failed test of `@thermal-label/tspl-core` against a real TSPL II printer
title: '[hardware] <Make/Model> — <verified | partial | broken>'
labels: hardware-verification
---

> `tspl-core` is a pure-protocol encoder; it has no transport
> bindings of its own. To verify on real hardware you'll be using
> it through a driver package (your own, or one from the
> `@thermal-label/*` family) that owns the wire transport.

## Device

- **Make / Model:** <!-- e.g. TSC TX200, TE200, DA210, OEM rebrand -->
- **Firmware version:** <!-- printed on the unit, or read via your driver -->
- **Native resolution:** <!-- 203 / 300 / 600 dpi -->
- **Head width:** <!-- in dots, e.g. 384, 432, 832 -->

## Environment

- **OS:** <!-- Linux / macOS / Windows + version -->
- **Runtime:** <!-- Node 20 / 22 / 24 / Chromium / Firefox / etc. -->
- **Driver / transport:** <!-- which package wraps tspl-core for you -->

## Result

- [ ] verified — every directive that should work, works
- [ ] partial — some directives work, others don't (see below)
- [ ] broken — known-broken; do not promise support

## Operations tested

- [ ] `encodeTsplJob()` produced a label that prints correctly
- [ ] BITMAP mode 0 byte polarity correct (no inverted output)
- [ ] `splitStatusLines()` handled the firmware's status replies
- [ ] Multi-copy print (`copies > 1`)
- [ ] GAP / BLINE / continuous media all worked

## Notes

<!-- Anything surprising: byte differences from the TSC manual,
firmware quirks, what you'd want a future reporter to verify. -->
