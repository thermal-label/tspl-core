[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / parseStatusByte

# Function: parseStatusByte()

> **parseStatusByte**(`bytes`): [`StatusByte`](../interfaces/StatusByte.md) \| `null`

Decode the single-byte reply to an `ESC ! ?` status query.

Returns `null` when `bytes` is empty (caller should wait for more
data); decodes byte 0 of any non-empty buffer otherwise. Trailing
bytes are ignored — the manual specifies a single byte per query
but some firmwares append a `\r\n` for terminal display, which
the caller can strip before passing in.

## Parameters

### bytes

`Uint8Array`

## Returns

[`StatusByte`](../interfaces/StatusByte.md) \| `null`
