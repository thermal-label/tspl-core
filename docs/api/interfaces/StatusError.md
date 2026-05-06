[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / StatusError

# Interface: StatusError

Failure reply with a numeric error code (`ERROR <code>\r\n`).

## Properties

### code

> **code**: `number`

Decoded numeric error code. `NaN` if the payload after `ERROR ` is non-numeric.

***

### kind

> **kind**: `"error"`
