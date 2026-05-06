[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildBitmapHeader

# Function: buildBitmapHeader()

> **buildBitmapHeader**(`x`, `y`, `widthBytes`, `height`, `mode`): `Uint8Array`

`BITMAP 0,0,<w_bytes>,<h>,<mode>,` — the raster directive header.

The header line emitted by this builder ends after the `,<mode>,`
— the caller follows it with the mode-specific raster payload
and a trailing line ending ([BITMAP\_TAIL](../variables/BITMAP_TAIL.md)).

**Mode values:**

- `0` — uncompressed bitmap (TSPL II spec)
- `1` — OR with existing image buffer (TSPL II spec)
- `2` — XOR with existing image buffer (TSPL II spec)
- `≥ 3` — vendor extensions (e.g. LZO whole-frame, LZO chunked).
  Not in scope for this package; pass through if your driver
  needs them.

The `mode` parameter is typed as `number` (rather than a literal
union) so vendor packages can pass extension values without
casts.

## Parameters

### x

`number`

### y

`number`

### widthBytes

`number`

### height

`number`

### mode

`number`

## Returns

`Uint8Array`
