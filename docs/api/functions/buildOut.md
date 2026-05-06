[**@thermal-label/tspl-core**](../README.md)

***

[@thermal-label/tspl-core](../README.md) / buildOut

# Function: buildOut()

> **buildOut**(`text`): `Uint8Array`

`OUT "<text>"\r\n` — emit a literal text payload on the response channel.

Same wire shape and same escape-handling caveat as
[buildEcho](buildEcho.md): the text is wrapped in double-quotes and not
escaped. The two directives differ in how the printer treats the
payload internally — `ECHO` is a host-loopback test, `OUT` is the
scriptable response-channel writer used inside status replies.

## Parameters

### text

`string`

## Returns

`Uint8Array`
