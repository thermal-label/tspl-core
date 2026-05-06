[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildEcho

# Function: buildEcho()

> **buildEcho**(`text`): `Uint8Array`

`ECHO "<text>"\r\n` — echo a string back on the response channel.

Useful as a transport-link smoke test — the printer reflects the
exact `text` payload back on its response channel. The text is
wrapped in double-quotes per the manual; the encoder does **not**
escape embedded quotes (the manual is silent on the escape syntax,
and printer firmwares vary). Callers must ensure `text` does not
contain `"` characters.

## Parameters

### text

`string`

## Returns

`Uint8Array`
