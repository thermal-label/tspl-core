[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / concatBytes

# Function: concatBytes()

> **concatBytes**(...`chunks`): `Uint8Array`

Concatenate any number of `Uint8Array` chunks into one buffer.
The TSPL print encoder emits a long sequence of small directives
plus one large bitmap payload — this is the join.

## Parameters

### chunks

...readonly `Uint8Array`[]

## Returns

`Uint8Array`
