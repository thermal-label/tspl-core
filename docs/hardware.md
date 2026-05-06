# Hardware

`tspl-core` is a **protocol module**. It has no transport bindings,
no device registry, and no hardware-side dependencies — so it
doesn't ship a hardware compatibility list of its own.

If your printer accepts the TSPL II directives documented in
[TSC's TSPL II Programming Manual](https://www.tscprinters.com/),
this package can produce its byte stream. That covers TSC's own
catalog (TX-series, TE-series, DA-series), licensed re-implementations
in other vendors' firmware, and OEM rebrands across the industry.

## Where verification lives

Hardware compatibility reports belong in the **driver package**
that wraps `tspl-core` for your transport — that's the package
that owns the wire and can demonstrate "label X printed correctly
on device Y over transport Z."

If you're a driver-package author, mirror the
[hardware verification issue template](./.github/ISSUE_TEMPLATE/hardware_verification.md)
to collect reports from your users.

## Reporting a `tspl-core`-level encoder bug

If `encodeTsplJob` produces bytes that are **wrong against the
TSC manual** — for example, a directive misspelled, a separator
in the wrong place, a length count off-by-one — please
[open an issue](https://github.com/thermal-label/tspl-core/issues/new)
quoting the byte stream and the manual section it disagrees with.

If your firmware accepts the TSC manual's exact byte stream but
produces unexpected output, the bug is most likely in your driver
or your bitmap, not in `tspl-core`. Verify against the manual
first.
