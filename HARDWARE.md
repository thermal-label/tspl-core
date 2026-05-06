# Hardware

`@thermal-label/tspl-core` is a **protocol module**, not a driver.
It has no transport bindings, no device registry, and no
hardware-side dependencies — so it does not ship a hardware
compatibility list of its own.

If your printer accepts the TSPL II directive set documented in
TSC's TSPL II Programming Manual, this package can produce its
wire-byte stream. That covers TSC's own catalog (TX-series,
TE-series, DA-series, etc.), licensed re-implementations in other
vendors' firmware, and OEM rebrands across the industry.

The encoder targets the **bitmap-rasterisation** use case: the
host renders text, barcodes, and shapes upstream into a
`LabelBitmap`, and `tspl-core` produces the wire bytes that drive
the printer to render that bitmap. Native text rendering and
native barcode generation are out of scope by design — see
[INTEROPERABILITY.md](./INTEROPERABILITY.md) for the full design
rule.

## Where verification lives

Hardware compatibility reports belong in the **driver package**
that wraps `tspl-core` for your transport — that's the package
that owns the wire and can demonstrate "label X printed correctly
on device Y over transport Z."

Driver-package authors: copy
[`.github/ISSUE_TEMPLATE/hardware_verification.md`](./.github/ISSUE_TEMPLATE/hardware_verification.md)
into your own repository to collect reports from your users.

## Reporting an encoder bug

If `tspl-core` produces bytes that disagree with TSC's TSPL II
Programming Manual — for example, a directive misspelled, a
separator in the wrong place, a length count off-by-one — please
[open an issue](https://github.com/thermal-label/tspl-core/issues/new)
quoting the byte stream and the manual section it disagrees with.

If your firmware accepts the TSC manual's exact byte stream but
produces unexpected output, the bug is most likely in your driver
or your bitmap rendering pipeline, not in `tspl-core`. Verify
against the manual first.

## See also

- [INTEROPERABILITY.md](./INTEROPERABILITY.md) — scope statement and
  source attribution
- [docs/protocol/tspl.md](./docs/protocol/tspl.md) — byte-level
  reference for every directive this package emits
