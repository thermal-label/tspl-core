[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildSetResponse

# Function: buildSetResponse()

> **buildSetResponse**(`state`): `Uint8Array`

`SET RESPONSE <state>\r\n` — reply-format toggle.

`'ON'` enables ASCII reply text (`OK\r\n`, `ERROR <code>\r\n`).
`'OFF'` disables responses. `'BATCH'` is documented in some
manual revisions as "respond once per batch"; the keyword is
passed through verbatim.

## Parameters

### state

`"OFF"` \| `"ON"` \| `"BATCH"`

## Returns

`Uint8Array`
