[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildBackfeed

# Function: buildBackfeed()

> **buildBackfeed**(`dots`): `Uint8Array`

`BACKFEED <n>\r\n` — reverse-feed `n` dots after print.

The TSPL II manual specifies the parameter as a positive integer
dot count. The encoder formats the integer literally; the firmware
clamps to its physical capability.

## Parameters

### dots

`number`

## Returns

`Uint8Array`
