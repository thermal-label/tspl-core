[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildSetCutter

# Function: buildSetCutter()

> **buildSetCutter**(`mode`): `Uint8Array`

`SET CUTTER <mode>\r\n` — auto-cutter configuration.

The TSPL II manual documents three keyword modes (`OFF`, `ON`,
`BATCH`) plus a numeric "cut after every Nth label" form. This
builder accepts any of them via a single union; the keyword forms
are emitted verbatim and the numeric form is stringified.

## Parameters

### mode

`number` \| `"OFF"` \| `"ON"` \| `"BATCH"`

`'OFF'` / `'ON'` / `'BATCH'` (keyword) or a positive
  integer (cut after every Nth label).

## Returns

`Uint8Array`
