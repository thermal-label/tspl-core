[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / TsplJobOptions

# Interface: TsplJobOptions

Per-job options for [encodeTsplJob](../functions/encodeTsplJob.md).

## Properties

### copies?

> `optional` **copies?**: `number`

Number of copies to print. Default `1`.

***

### density?

> `optional` **density?**: `number`

Density (0..15 nominal; firmware clamps). Omit to skip the directive.

***

### origin?

> `optional` **origin?**: `object`

Origin offset in dots — emitted via `REFERENCE`. Default `{ x: 0, y: 0 }`.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### pitch?

> `optional` **pitch?**: `number`

GAP / BLINE pitch in mm. Default `2` for `gap`, `3` for `bline`.
Ignored for `continuous` media.

***

### printLineEnding?

> `optional` **printLineEnding?**: "\r\n" \| "\n\r"

Trailing line ending on `PRINT`. Default `'\r\n'` per the TSC manual;
vendor packages whose firmware requires the reversed form may pass `'\n\r'`.

***

### speed?

> `optional` **speed?**: `number`

Speed in inches per second. Omit to skip the directive.
