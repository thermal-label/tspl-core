---
layout: home
hero:
  name: tspl-core
  text: Pure TSPL II protocol encoder
  tagline: Directive byte builders and a status line splitter for any TSPL-speaking thermal label printer. Source-of-truth is TSC's TSPL II Programming Manual.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Wire protocol
      link: /protocol/tspl

features:
  - title: Spec-aligned, no vendor extensions
    details: Every byte sequence emitted is documented in TSC's TSPL II Programming Manual. Vendor add-ons (LZO BITMAP modes 3/4, ACK framing, vendor status keywords) live in driver packages that import this one.
  - title: Transport-unaware
    details: Emits Uint8Array byte streams that callers feed to any transport — USB, Web Serial, BLE, TCP. tspl-core does not know about wires.
  - title: Universal runtime
    details: One package, no node/web split. Uses only Uint8Array and TextEncoder/TextDecoder. Runs in Node, browsers, Deno, Bun, edge runtimes.
---

::: info Source
This package is anchored on **TSC's TSPL II Programming Manual** —
the canonical reference published by TSC. No vendor-app harvesting,
no firmware reverse-engineering. Vendor extensions are out of scope
and must live in driver packages downstream.
:::
