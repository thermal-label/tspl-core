import { describe, expect, it } from 'vitest';
import { parseStatusByte, parseStatusLine, splitStatusLines } from '../status.js';

const enc = new TextEncoder();

describe('splitStatusLines', () => {
  it('splits a buffer of complete \\r\\n-terminated lines', () => {
    const { lines, remainder } = splitStatusLines(enc.encode('READY\r\nERROR:42\r\n'));
    expect(lines).toEqual(['READY', 'ERROR:42']);
    expect(remainder).toEqual(new Uint8Array(0));
  });

  it('returns a remainder for unterminated trailing bytes', () => {
    const { lines, remainder } = splitStatusLines(enc.encode('READY\r\nPARTI'));
    expect(lines).toEqual(['READY']);
    expect(new TextDecoder().decode(remainder)).toBe('PARTI');
  });

  it('returns no lines and the whole buffer as remainder when nothing terminated', () => {
    const { lines, remainder } = splitStatusLines(enc.encode('hello'));
    expect(lines).toEqual([]);
    expect(new TextDecoder().decode(remainder)).toBe('hello');
  });

  it('handles a fragmented stream across two calls', () => {
    // First chunk: one complete line + a partial.
    const a = splitStatusLines(enc.encode('READY\r\nPART'));
    expect(a.lines).toEqual(['READY']);

    // Second chunk: prepend the remainder, then add the rest.
    const next = enc.encode('IAL\r\nEND\r\n');
    const merged = new Uint8Array(a.remainder.length + next.length);
    merged.set(a.remainder);
    merged.set(next, a.remainder.length);
    const b = splitStatusLines(merged);
    expect(b.lines).toEqual(['PARTIAL', 'END']);
    expect(b.remainder.length).toBe(0);
  });

  it('returns empty lines for back-to-back \\r\\n', () => {
    const { lines, remainder } = splitStatusLines(enc.encode('A\r\n\r\nB\r\n'));
    expect(lines).toEqual(['A', '', 'B']);
    expect(remainder.length).toBe(0);
  });

  it('handles an empty input buffer', () => {
    const { lines, remainder } = splitStatusLines(new Uint8Array(0));
    expect(lines).toEqual([]);
    expect(remainder.length).toBe(0);
  });
});

describe('parseStatusLine — spec-defined reply shapes', () => {
  it('parses "OK" as { kind: "ok" }', () => {
    expect(parseStatusLine('OK')).toEqual({ kind: 'ok' });
    expect(parseStatusLine('OK\r\n')).toEqual({ kind: 'ok' });
    expect(parseStatusLine('  OK  ')).toEqual({ kind: 'ok' });
  });

  it('parses "ERROR <code>" as { kind: "error", code }', () => {
    expect(parseStatusLine('ERROR 42')).toEqual({ kind: 'error', code: 42 });
    expect(parseStatusLine('ERROR 0\r\n')).toEqual({ kind: 'error', code: 0 });
    expect(parseStatusLine('ERROR 100')).toEqual({ kind: 'error', code: 100 });
  });

  it('reports NaN for ERROR with missing or non-numeric code', () => {
    const a = parseStatusLine('ERROR');
    expect(a.kind).toBe('error');
    if (a.kind === 'error') expect(Number.isNaN(a.code)).toBe(true);

    const b = parseStatusLine('ERROR foo');
    expect(b.kind).toBe('error');
    if (b.kind === 'error') expect(Number.isNaN(b.code)).toBe(true);
  });

  it('parses an echoed payload as { kind: "echo", text } when expectedEcho matches', () => {
    expect(parseStatusLine('ping', 'ping')).toEqual({ kind: 'echo', text: 'ping' });
  });

  it('does not misclassify echoed "OK" — OK always wins when expectedEcho not supplied', () => {
    // Without expectedEcho, an echoed "OK" looks identical to the
    // ack reply on the wire — `parseStatusLine` cannot tell them
    // apart and routes to the ack shape. Caller must pass
    // expectedEcho when echoing strings that collide with reply
    // keywords.
    expect(parseStatusLine('OK')).toEqual({ kind: 'ok' });
  });

  it('falls through to "unknown" for vendor / unrecognised lines', () => {
    expect(parseStatusLine('READY')).toEqual({ kind: 'unknown', raw: 'READY' });
    expect(parseStatusLine('SSSPAPER:1')).toEqual({ kind: 'unknown', raw: 'SSSPAPER:1' });
    expect(parseStatusLine('???')).toEqual({ kind: 'unknown', raw: '???' });
  });

  it('strips trailing CRLF and trims whitespace on the unknown fallback', () => {
    expect(parseStatusLine('READY\r\n')).toEqual({ kind: 'unknown', raw: 'READY' });
    expect(parseStatusLine('  READY  ')).toEqual({ kind: 'unknown', raw: 'READY' });
  });
});

describe('parseStatusByte — ESC ! ? single-byte reply', () => {
  it('returns null for an empty buffer', () => {
    expect(parseStatusByte(new Uint8Array())).toBeNull();
  });

  it('decodes 0x00 as ready with no flags set', () => {
    expect(parseStatusByte(new Uint8Array([0x00]))).toEqual({
      kind: 'status-byte',
      byte: 0x00,
      ready: true,
      paper: false,
      cover: false,
      temp: false,
      pause: false,
      ribbon: false,
    });
  });

  it('decodes the documented bit assignments', () => {
    // bit 0 — cover open
    const cover = parseStatusByte(new Uint8Array([0x01]));
    expect(cover?.cover).toBe(true);
    expect(cover?.ready).toBe(false);

    // bit 2 — out of paper
    const paper = parseStatusByte(new Uint8Array([0x04]));
    expect(paper?.paper).toBe(true);
    expect(paper?.ready).toBe(false);

    // bit 3 — out of ribbon
    const ribbon = parseStatusByte(new Uint8Array([0x08]));
    expect(ribbon?.ribbon).toBe(true);
    expect(ribbon?.ready).toBe(false);

    // bit 4 — pause
    const pause = parseStatusByte(new Uint8Array([0x10]));
    expect(pause?.pause).toBe(true);
    expect(pause?.ready).toBe(false);
  });

  it('preserves the raw byte for vendor post-processing', () => {
    const decoded = parseStatusByte(new Uint8Array([0x55]));
    expect(decoded?.byte).toBe(0x55);
  });

  it('ignores trailing bytes past the first', () => {
    const decoded = parseStatusByte(new Uint8Array([0x00, 0x0d, 0x0a]));
    expect(decoded?.byte).toBe(0x00);
    expect(decoded?.ready).toBe(true);
  });
});
