[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / parseStatusLine

# Function: parseStatusLine()

> **parseStatusLine**(`line`, `expectedEcho?`): [`StatusLine`](../type-aliases/StatusLine.md)

Wrap a status line in the [StatusLine](../type-aliases/StatusLine.md) shape, recognising the
four spec-defined reply forms (`OK`, `ERROR <code>`, echo text)
and falling through to `{ kind: 'unknown', raw }` for anything
else. Trailing `\r\n` is stripped; surrounding whitespace is
trimmed.

Echo replies are the trickiest to dispatch on: the manual permits
arbitrary echoed text, so this parser only routes a line to
`'echo'` when the caller supplies the original `expectedEcho`
payload — otherwise an echoed `OK` would be misclassified as the
acknowledgement reply. When `expectedEcho` is omitted, this
function never returns `'echo'` and the caller is responsible for
matching echoed text downstream.

The status-byte shape is **not** produced by this function — it
arrives as a single binary byte, not a text line; use
[parseStatusByte](parseStatusByte.md) on the raw bytes instead.

## Parameters

### line

`string`

The line text (without the trailing `\r\n`).

### expectedEcho?

`string`

When provided, a line whose trimmed value
                    matches this string is reported as
                    `{ kind: 'echo', text }`.

## Returns

[`StatusLine`](../type-aliases/StatusLine.md)
