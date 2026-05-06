[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / StatusByte

# Interface: StatusByte

Decoded `ESC ! ?` single-byte status reply.

The TSPL II manual documents the reply as a single byte whose
bits flag specific printer states. The exact bit assignment
differs slightly between manual revisions and firmware families;
this parser uses the spec-canonical mapping documented in TSC's
TSPL II Programming Manual:

| Bit  | Mask   | Meaning           |
| ---- | ------ | ----------------- |
| 0    | `0x01` | Head / cover open |
| 1    | `0x02` | Paper jam         |
| 2    | `0x04` | Out of paper      |
| 3    | `0x08` | Out of ribbon     |
| 4    | `0x10` | Pause             |
| 5    | `0x20` | Printing          |
| 6    | `0x40` | (reserved)        |
| 7    | `0x80` | (reserved)        |

`ready` is `true` when no error/state bits (paper, cover, ribbon,
temp, pause) are set — i.e. the printer is idle and able to
accept a job.

**Ambiguity:** TSC's manual does not surface an explicit
head-temperature flag at the byte level; some vendor firmwares
route over-temperature events through bit 1 (alongside paper jam)
while others reuse a reserved bit. The [StatusByte.temp](#temp)
field stays in the public shape because the plan calls for it,
but always reports `false` from this parser — driver packages
with vendor-specific knowledge can post-process the
[StatusByte.byte](#byte) field to refine it.

## Properties

### byte

> **byte**: `number`

Raw byte value, for callers that need to inspect reserved bits.

***

### cover

> **cover**: `boolean`

Cover / head open (bit 0).

***

### kind

> **kind**: `"status-byte"`

***

### paper

> **paper**: `boolean`

Out of paper (bit 2).

***

### pause

> **pause**: `boolean`

Paused (bit 4).

***

### ready

> **ready**: `boolean`

No error/state bits set.

***

### ribbon

> **ribbon**: `boolean`

Out of ribbon (bit 3).

***

### temp

> **temp**: `boolean`

Over-temperature — see ambiguity note on StatusByte.
