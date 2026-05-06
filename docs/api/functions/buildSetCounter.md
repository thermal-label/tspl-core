[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildSetCounter

# Function: buildSetCounter()

> **buildSetCounter**(`slot`, `mode`): `Uint8Array`

`SET COUNTER @<slot> <mode>\r\n` — multi-up label sequence counters.

`slot` is the counter slot (the manual uses `@0` … `@N`). `mode`
is the increment specifier — typically a numeric step (`+1`, `-1`,
etc.) or an alphanumeric pattern; this builder formats whichever
string the caller supplies verbatim, leaving the spec-canonical
choice to the caller.

## Parameters

### slot

`number`

### mode

`string`

## Returns

`Uint8Array`
