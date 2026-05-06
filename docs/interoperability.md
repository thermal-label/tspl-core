# Interoperability

`@thermal-label/tspl-core` is a generic TSPL II encoder. The byte
sequences it emits are sourced exclusively from
**TSC's TSPL II Programming Manual** — the canonical reference
published by TSC for the TSPL II command stream.

## What this package is

A **pure-protocol encoder**. Every byte it produces is documented
in TSC's manual; nothing in this package is reverse-engineered
from a specific firmware build.

This is the opposite of a "driver" — it does not know about
transports, device IDs, or vendor quirks. It knows about TSPL II
the language.

## What this package is not

- It is **not** a vendor-specific driver. It does not target a
  particular brand or model.
- It is **not** a hardware-verified compatibility list. Driver
  packages built on top of it own that.
- It does **not** include vendor extensions that some firmwares
  layer on top of TSPL II — LZO-compressed `BITMAP` modes 3/4,
  ACK framing, vendor `<KEY>:<VALUE>` status reply schemas,
  AT-command bridges. Those belong in driver packages.

## Compatibility scope

If a printer accepts the directive set described in TSC's TSPL II
Programming Manual, `tspl-core` can produce a job for it. This
includes TSC's own consumer and industrial lines as well as the
many third-party firmwares that license or re-implement TSPL II.

Specific quirks (bit polarity inversion, line-ending preferences,
required preamble bytes, vendor-only directives) are the driver
package's concern. `tspl-core` provides the spec-aligned baseline;
drivers extend it.

## Source attribution

The single source for every byte emitted by this package is
**TSC's TSPL II Programming Manual**.

There is intentionally no harvesting from any vendor's mobile app,
firmware, Linux CUPS driver, or proprietary SDK. Driver packages
are free to do that work for their own targets, but `tspl-core`
stays anchored on the published spec so that consumers can rely
on its bytes matching TSC's documentation byte-for-byte.

## Bit polarity note

The TSC TSPL II manual specifies that within a `BITMAP` payload,
**bit `0` represents a printed (dark) dot** and bit `1` represents
an un-printed dot. This is the opposite of the convention used by
most in-memory bitmap libraries (including `@mbtech-nl/bitmap`,
which uses `1 = dark`).

`encodeTsplJob` applies a per-byte one's-complement to bridge the
two conventions: feed it a `LabelBitmap`, get out spec-aligned
wire bytes. Vendor packages whose firmware accepts the
inverted-from-spec polarity should bypass `encodeTsplJob` and
call the directive builders directly — their bitmap data goes
on the wire raw.

## Future direction

The package surface is intentionally small and stable. Additions
will be limited to directives newly documented by TSC. Vendor
extensions are explicitly out of scope and will not be merged
into the public API even on request.
