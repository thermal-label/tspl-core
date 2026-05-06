[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / SplitStatusLinesResult

# Interface: SplitStatusLinesResult

Result of [splitStatusLines](../functions/splitStatusLines.md). Holds the complete lines
extracted from the buffer plus any trailing bytes that did not
yet terminate with `\r\n` — feed `remainder` back in alongside
the next chunk to handle reply fragmentation across reads.

## Properties

### lines

> `readonly` **lines**: readonly `string`[]

Each line **without** its trailing `\r\n`.

***

### remainder

> `readonly` **remainder**: `Uint8Array`

Bytes after the last `\r\n` (if any).
