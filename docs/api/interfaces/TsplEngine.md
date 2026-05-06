[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / TsplEngine

# Interface: TsplEngine

Engine descriptor — physical attributes of the target printer
that the encoder needs to size and lay out the bitmap.

`tspl-core` does not maintain a registry of named devices.
Caller (typically a driver package) supplies the engine values
for whichever printer it's targeting.

## Properties

### dpi

> **dpi**: `203` \| `300` \| `600`

Dots per inch. 203 (8 dots/mm), 300 (~11.81 dots/mm), 600 (~23.62 dots/mm).

***

### headDots

> **headDots**: `number`

Native head width in dots.
