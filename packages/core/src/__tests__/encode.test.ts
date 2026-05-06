import { describe, expect, it } from 'vitest';
import { createBitmap } from '@mbtech-nl/bitmap';
import { encodeTsplJob } from '../encode.js';
import type { TsplEngine, TsplMedia } from '../types.js';

const dec = new TextDecoder();

const ENGINE_203: TsplEngine = { dpi: 203, headDots: 384 };

const MEDIA_50X30: TsplMedia = { widthMm: 50, heightMm: 30, type: 'gap' };
const MEDIA_50X30_BLINE: TsplMedia = { widthMm: 50, heightMm: 30, type: 'bline' };
const MEDIA_CONTINUOUS: TsplMedia = { widthMm: 50, heightMm: 30, type: 'continuous' };

describe('encodeTsplJob — directive sequence (mode 0, gap, 50x30 @ 203 dpi)', () => {
  // 50 × 30 mm @ 203 dpi → 400 × 240 dots, gap stock, 1 copy.
  const bitmap = createBitmap(400, 240);

  it('emits the documented directive sequence', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30,
      options: { density: 8, speed: 4, copies: 1 },
    });
    const text = dec.decode(job);

    expect(text).toContain('\r\nDENSITY 8\r\n');
    expect(text).toContain('SPEED 4\r\n');
    expect(text).toContain('REFERENCE 0,0\r\n');
    expect(text).toContain('OFFSET 0 mm\r\n');
    expect(text).toContain('SIZE 50 mm,30 mm\r\n');
    expect(text).toContain('GAP 2.00 mm,0.00 mm\r\n');
    expect(text).toContain('DIRECTION 0,0\r\n');
    expect(text).toContain('CLS\r\n');
    expect(text).toContain('BITMAP 0,0,50,240,0,');
    expect(text).toMatch(/PRINT 1,1\r\n$/u);
  });

  it('omits DENSITY and SPEED when not requested', () => {
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    expect(text).not.toContain('DENSITY');
    expect(text).not.toContain('SPEED');
  });

  it('uses BLINE directive (default 3 mm pitch) for black-line stock', () => {
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30_BLINE });
    const text = dec.decode(job);
    expect(text).toContain('BLINE 3.00 mm,0.00 mm\r\n');
    expect(text).not.toContain('GAP ');
  });

  it('honours an explicit pitch override on BLINE', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30_BLINE,
      options: { pitch: 5 },
    });
    expect(dec.decode(job)).toContain('BLINE 5.00 mm,0.00 mm\r\n');
  });

  it('honours an explicit pitch override on GAP', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30,
      options: { pitch: 3 },
    });
    expect(dec.decode(job)).toContain('GAP 3.00 mm,0.00 mm\r\n');
  });

  it('uses GAP 0,0 for continuous stock', () => {
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_CONTINUOUS });
    expect(dec.decode(job)).toContain('GAP 0.00 mm,0.00 mm\r\n');
  });

  it('emits multi-copy via PRINT 1,N', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30,
      options: { copies: 3 },
    });
    expect(dec.decode(job)).toMatch(/PRINT 1,3\r\n$/u);
  });

  it('defaults to CRLF on PRINT', () => {
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const tail = dec.decode(job.subarray(job.length - 12));
    expect(tail).toMatch(/\r\n$/u);
    expect(tail.endsWith('\n\r')).toBe(false);
  });

  it('honours printLineEnding override (\\n\\r) for vendor firmwares', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30,
      options: { printLineEnding: '\n\r' },
    });
    const tail = dec.decode(job.subarray(job.length - 12));
    expect(tail).toMatch(/PRINT 1,1\n\r$/u);
  });

  it('emits user-supplied origin via REFERENCE x,y', () => {
    const job = encodeTsplJob(ENGINE_203, {
      bitmap,
      media: MEDIA_50X30,
      options: { origin: { x: 24, y: 48 } },
    });
    expect(dec.decode(job)).toContain('REFERENCE 24,48\r\n');
  });

  it('falls back to REFERENCE 0,0 when no origin given', () => {
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    expect(dec.decode(job)).toContain('REFERENCE 0,0\r\n');
  });
});

describe('encodeTsplJob — bitmap polarity (TSPL II spec: 0 = printed)', () => {
  it('inverts every byte of the LabelBitmap payload to match spec polarity', () => {
    // LabelBitmap stores `1 = dark`. The TSC TSPL II manual says the
    // BITMAP payload should encode `0 = printed dot`. The encoder
    // applies a per-byte one's-complement.
    const bitmap = createBitmap(8, 1); // 8x1 = 1 byte payload
    bitmap.data[0] = 0b10101010;

    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);

    // Find the start of the raster — right after the BITMAP header
    // line (which ends with `,0,`) and before the trailing `\r\n` +
    // `PRINT…`.
    const headerMarker = 'BITMAP 0,0,1,1,0,';
    const headerIdx = text.indexOf(headerMarker);
    expect(headerIdx).toBeGreaterThan(-1);
    const rasterByteOffset = headerIdx + headerMarker.length;
    expect(job[rasterByteOffset]).toBe(0b01010101);
  });

  it('inverts an all-zero bitmap to all-0xFF on the wire', () => {
    const bitmap = createBitmap(8, 1);
    // bitmap.data is already zero-filled.
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    const idx = text.indexOf('BITMAP 0,0,1,1,0,');
    expect(job[idx + 'BITMAP 0,0,1,1,0,'.length]).toBe(0xff);
  });

  it('inverts an all-0xFF bitmap to all-zero on the wire', () => {
    const bitmap = createBitmap(8, 1);
    bitmap.data[0] = 0xff;
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    const idx = text.indexOf('BITMAP 0,0,1,1,0,');
    expect(job[idx + 'BITMAP 0,0,1,1,0,'.length]).toBe(0x00);
  });
});

describe('encodeTsplJob — mm rounding and clamping', () => {
  it('clamps zero-width / zero-height bitmaps to at least 1 mm', () => {
    const bitmap = createBitmap(8, 8); // ~1 mm at 203 dpi
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    // 8 px / (203/25.4) ≈ 1 mm
    expect(text).toContain('SIZE 1 mm,1 mm\r\n');
  });

  it('rounds widths to nearest mm', () => {
    const bitmap = createBitmap(400, 240); // 50×30 mm at 203 dpi
    const job = encodeTsplJob(ENGINE_203, { bitmap, media: MEDIA_50X30 });
    expect(dec.decode(job)).toContain('SIZE 50 mm,30 mm\r\n');
  });
});

describe('encodeTsplJob — supports 300 / 600 dpi engines', () => {
  it('respects 300 dpi for SIZE calc', () => {
    const bitmap = createBitmap(600, 360); // ~50 × 30 mm at 300 dpi
    const job = encodeTsplJob({ dpi: 300, headDots: 600 }, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    expect(text).toContain('SIZE 51 mm,30 mm\r\n');
  });

  it('respects 600 dpi for SIZE calc', () => {
    const bitmap = createBitmap(1200, 720); // ~50 × 30 mm at 600 dpi
    const job = encodeTsplJob({ dpi: 600, headDots: 1200 }, { bitmap, media: MEDIA_50X30 });
    const text = dec.decode(job);
    expect(text).toContain('SIZE 51 mm,30 mm\r\n');
  });
});
