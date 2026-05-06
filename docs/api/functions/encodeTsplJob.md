[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / encodeTsplJob

# Function: encodeTsplJob()

> **encodeTsplJob**(`engine`, `page`): `Uint8Array`

Emit a complete pure-TSPL II print job using `BITMAP` mode 0
(uncompressed).

The byte stream is the entire job: opening directives, the
raster header + payload, and the closing `PRINT` directive.
Callers feed it to whichever transport their driver provides
(USB, BLE, Serial, TCP — none of which `tspl-core` knows about).

**Bit polarity.** The TSC TSPL II manual specifies that within
the `BITMAP` payload, bit `0` represents a printed dot and bit
`1` represents an un-printed dot. `LabelBitmap` from
`@mbtech-nl/bitmap` uses the opposite convention — `1 = dark`
— so this encoder applies a **per-byte one's-complement** to the
raster bytes when emitting them on the wire.

The result: pass a `LabelBitmap` with `1 = dark dot` (the
library's invariant), get out a wire payload that matches the
TSC spec. Vendor firmwares that accept the inverted-from-spec
polarity should bypass this function and call the directive
builders directly.

Vendor packages that need compressed `BITMAP` modes 3/4 also
bypass this function — they build the job stream by composing
the directive builders with their own payload code (LZO
compression, chunk framing, etc.).

## Parameters

### engine

[`TsplEngine`](../interfaces/TsplEngine.md)

### page

[`TsplPage`](../interfaces/TsplPage.md)

## Returns

`Uint8Array`
