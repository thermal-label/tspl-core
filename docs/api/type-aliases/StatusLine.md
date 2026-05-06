[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / StatusLine

# Type Alias: StatusLine

> **StatusLine** = [`StatusByte`](../interfaces/StatusByte.md) \| [`StatusOk`](../interfaces/StatusOk.md) \| [`StatusError`](../interfaces/StatusError.md) \| [`StatusEcho`](../interfaces/StatusEcho.md) \| [`StatusUnknown`](../interfaces/StatusUnknown.md)

Parsed status line. Discriminated on `kind`.

The four spec-defined kinds are recognised by [parseStatusLine](../functions/parseStatusLine.md)
(`ok`, `error`, `echo`) and [parseStatusByte](../functions/parseStatusByte.md)
(`status-byte`). Anything else falls through to `unknown` so
vendor parsers can dispatch on `raw`.
