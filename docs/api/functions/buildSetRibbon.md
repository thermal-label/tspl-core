[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildSetRibbon

# Function: buildSetRibbon()

> **buildSetRibbon**(`mode`): `Uint8Array`

`SET RIBBON <mode>\r\n` — thermal-transfer (ribbon) vs direct-thermal.

`'ON'` enables thermal-transfer (ribbon installed); `'OFF'`
selects direct-thermal mode. The manual notes that some firmware
variants treat this directive as read-only when the printer
auto-detects ribbon presence — the wire bytes are the same.

## Parameters

### mode

`"OFF"` \| `"ON"`

## Returns

`Uint8Array`
