[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / splitStatusLines

# Function: splitStatusLines()

> **splitStatusLines**(`bytes`): [`SplitStatusLinesResult`](../interfaces/SplitStatusLinesResult.md)

Split a possibly-fragmented byte buffer into complete
`\r\n`-terminated text lines.

The buffer is decoded as UTF-8 (the TSC manual specifies ASCII;
UTF-8 is a superset for any 7-bit input). Bytes after the final
`\r\n` are returned as `remainder` so callers polling a stream
can concatenate them with the next chunk.

## Parameters

### bytes

`Uint8Array`

## Returns

[`SplitStatusLinesResult`](../interfaces/SplitStatusLinesResult.md)

## Example

```ts
let pending = new Uint8Array();
  for await (const chunk of stream) {
    const merged = new Uint8Array(pending.length + chunk.length);
    merged.set(pending);
    merged.set(chunk, pending.length);
    const { lines, remainder } = splitStatusLines(merged);
    for (const line of lines) handle(line);
    pending = remainder;
  }
```
