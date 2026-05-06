[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / TsplMedia

# Interface: TsplMedia

Label media descriptor for a single page.

## Properties

### heightMm

> **heightMm**: `number`

***

### type

> **type**: `"gap"` \| `"bline"` \| `"continuous"`

`gap` — die-cut labels separated by transparent strips (`GAP` directive).
`bline` — continuous stock with printed registration marks (`BLINE` directive).
`continuous` — receipt-style endless paper (emitted as `GAP 0,0`).

***

### widthMm

> **widthMm**: `number`
