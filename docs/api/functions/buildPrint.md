[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildPrint

# Function: buildPrint()

> **buildPrint**(`copies`, `lineEnding?`): `Uint8Array`

`PRINT 1,<copies>\r\n` — fire the label.

`lineEnding` defaults to `\r\n` per the TSC manual. Some vendor
firmwares accept the reversed `\n\r` and a few require it; the
parameter exists so vendor packages can opt-in without forking
the encoder.

## Parameters

### copies

`number`

### lineEnding?

"\r\n" \| "\n\r"

## Returns

`Uint8Array`
