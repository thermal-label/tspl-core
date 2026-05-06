import { describe, expect, it } from 'vitest';
import {
  BITMAP_TAIL,
  buildBackfeed,
  buildBitmapHeader,
  buildBline,
  buildCls,
  buildCut,
  buildDensity,
  buildDirection,
  buildEcho,
  buildEoj,
  buildFormfeed,
  buildGap,
  buildHome,
  buildInitialPrinter,
  buildKill,
  buildLimitfeed,
  buildNull,
  buildOffset,
  buildOut,
  buildPartialCut,
  buildPrint,
  buildReference,
  buildSelftest,
  buildSetCounter,
  buildSetCutter,
  buildSetHead,
  buildSetPartialCutter,
  buildSetPeel,
  buildSetPrintkey,
  buildSetReprint,
  buildSetResponse,
  buildSetRibbon,
  buildSetTear,
  buildShift,
  buildSize,
  buildSpeed,
  concatBytes,
} from '../protocol.js';

const dec = new TextDecoder();
const decode = (b: Uint8Array): string => dec.decode(b);

describe('directive byte builders — produce documented byte sequences', () => {
  it('buildDensity emits "DENSITY <n>\\r\\n"', () => {
    expect(decode(buildDensity(8))).toBe('DENSITY 8\r\n');
    expect(decode(buildDensity(0))).toBe('DENSITY 0\r\n');
    expect(decode(buildDensity(15))).toBe('DENSITY 15\r\n');
  });

  it('buildSpeed emits "SPEED <n>\\r\\n"', () => {
    expect(decode(buildSpeed(4))).toBe('SPEED 4\r\n');
    expect(decode(buildSpeed(12))).toBe('SPEED 12\r\n');
  });

  it('buildReference emits "REFERENCE <x>,<y>\\r\\n"', () => {
    expect(decode(buildReference(0, 0))).toBe('REFERENCE 0,0\r\n');
    expect(decode(buildReference(24, 48))).toBe('REFERENCE 24,48\r\n');
  });

  it('buildOffset emits "OFFSET <n> mm\\r\\n"', () => {
    expect(decode(buildOffset(0))).toBe('OFFSET 0 mm\r\n');
    expect(decode(buildOffset(2))).toBe('OFFSET 2 mm\r\n');
  });

  it('buildSize emits "SIZE <w> mm,<h> mm\\r\\n"', () => {
    expect(decode(buildSize(50, 30))).toBe('SIZE 50 mm,30 mm\r\n');
    expect(decode(buildSize(40, 60))).toBe('SIZE 40 mm,60 mm\r\n');
  });

  it('buildGap emits "GAP <pitch> mm,<offset> mm\\r\\n" with 2-decimal mm values', () => {
    expect(decode(buildGap(2, 0))).toBe('GAP 2.00 mm,0.00 mm\r\n');
    expect(decode(buildGap(2.5, 0.25))).toBe('GAP 2.50 mm,0.25 mm\r\n');
  });

  it('buildBline emits "BLINE <pitch> mm,<offset> mm\\r\\n" with 2-decimal mm values', () => {
    expect(decode(buildBline(3, 0))).toBe('BLINE 3.00 mm,0.00 mm\r\n');
    expect(decode(buildBline(3.5, 0.5))).toBe('BLINE 3.50 mm,0.50 mm\r\n');
  });

  it('buildDirection emits "DIRECTION 0,0\\r\\n"', () => {
    expect(decode(buildDirection())).toBe('DIRECTION 0,0\r\n');
  });

  it('buildCls emits "CLS\\r\\n"', () => {
    expect(decode(buildCls())).toBe('CLS\r\n');
  });

  it('buildInitialPrinter emits "INITIALPRINTER\\r\\n"', () => {
    expect(decode(buildInitialPrinter())).toBe('INITIALPRINTER\r\n');
  });

  it('buildPrint defaults to CRLF line ending', () => {
    expect(decode(buildPrint(1))).toBe('PRINT 1,1\r\n');
    expect(decode(buildPrint(3))).toBe('PRINT 1,3\r\n');
  });

  it('buildPrint accepts reversed \\n\\r line ending for vendor firmwares', () => {
    expect(decode(buildPrint(1, '\n\r'))).toBe('PRINT 1,1\n\r');
  });

  it('buildFormfeed emits "FORMFEED\\r\\n"', () => {
    expect(decode(buildFormfeed())).toBe('FORMFEED\r\n');
  });

  it('buildSelftest emits "SELFTEST\\r\\n"', () => {
    expect(decode(buildSelftest())).toBe('SELFTEST\r\n');
  });

  it('buildShift emits "SHIFT <n>\\r\\n"', () => {
    expect(decode(buildShift(0))).toBe('SHIFT 0\r\n');
    expect(decode(buildShift(48))).toBe('SHIFT 48\r\n');
  });

  it('buildBitmapHeader emits the spec-defined modes 0/1/2', () => {
    expect(decode(buildBitmapHeader(0, 0, 50, 240, 0))).toBe('BITMAP 0,0,50,240,0,');
    expect(decode(buildBitmapHeader(0, 0, 50, 240, 1))).toBe('BITMAP 0,0,50,240,1,');
    expect(decode(buildBitmapHeader(0, 0, 50, 240, 2))).toBe('BITMAP 0,0,50,240,2,');
  });

  it('buildBitmapHeader passes through vendor-extension mode integers without complaint', () => {
    // Vendor packages need to pass mode 3 / 4 / future without casts —
    // the parameter is `number`, and the formatter writes whatever
    // integer it gets.
    expect(decode(buildBitmapHeader(0, 0, 50, 240, 3))).toBe('BITMAP 0,0,50,240,3,');
    expect(decode(buildBitmapHeader(0, 0, 50, 240, 4))).toBe('BITMAP 0,0,50,240,4,');
  });

  it('BITMAP_TAIL is "\\r\\n"', () => {
    expect(decode(BITMAP_TAIL)).toBe('\r\n');
  });
});

describe('paper handling builders (§ 1.1)', () => {
  it('buildBackfeed emits "BACKFEED <n>\\r\\n"', () => {
    expect(decode(buildBackfeed(0))).toBe('BACKFEED 0\r\n');
    expect(decode(buildBackfeed(40))).toBe('BACKFEED 40\r\n');
  });

  it('buildHome emits "HOME\\r\\n"', () => {
    expect(decode(buildHome())).toBe('HOME\r\n');
  });

  it('buildCut emits "CUT\\r\\n"', () => {
    expect(decode(buildCut())).toBe('CUT\r\n');
  });

  it('buildPartialCut emits "PARTIAL_CUTTER\\r\\n"', () => {
    expect(decode(buildPartialCut())).toBe('PARTIAL_CUTTER\r\n');
  });

  it('buildKill emits "KILL\\r\\n"', () => {
    expect(decode(buildKill())).toBe('KILL\r\n');
  });

  it('buildNull emits "NULL\\r\\n"', () => {
    expect(decode(buildNull())).toBe('NULL\r\n');
  });
});

describe('setup / configuration builders (§ 1.2)', () => {
  it('buildSetCutter accepts keyword modes', () => {
    expect(decode(buildSetCutter('OFF'))).toBe('SET CUTTER OFF\r\n');
    expect(decode(buildSetCutter('ON'))).toBe('SET CUTTER ON\r\n');
    expect(decode(buildSetCutter('BATCH'))).toBe('SET CUTTER BATCH\r\n');
  });

  it('buildSetCutter accepts a numeric "every Nth label" mode', () => {
    expect(decode(buildSetCutter(1))).toBe('SET CUTTER 1\r\n');
    expect(decode(buildSetCutter(5))).toBe('SET CUTTER 5\r\n');
  });

  it('buildSetPartialCutter emits "SET PARTIAL_CUTTER <n>\\r\\n"', () => {
    expect(decode(buildSetPartialCutter(1))).toBe('SET PARTIAL_CUTTER 1\r\n');
    expect(decode(buildSetPartialCutter(3))).toBe('SET PARTIAL_CUTTER 3\r\n');
  });

  it('buildSetRibbon emits "SET RIBBON <mode>\\r\\n"', () => {
    expect(decode(buildSetRibbon('ON'))).toBe('SET RIBBON ON\r\n');
    expect(decode(buildSetRibbon('OFF'))).toBe('SET RIBBON OFF\r\n');
  });

  it('buildSetTear emits "SET TEAR <state>\\r\\n"', () => {
    expect(decode(buildSetTear('ON'))).toBe('SET TEAR ON\r\n');
    expect(decode(buildSetTear('OFF'))).toBe('SET TEAR OFF\r\n');
  });

  it('buildSetPeel emits "SET PEEL <state>\\r\\n"', () => {
    expect(decode(buildSetPeel('ON'))).toBe('SET PEEL ON\r\n');
    expect(decode(buildSetPeel('OFF'))).toBe('SET PEEL OFF\r\n');
  });

  it('buildSetHead emits "SET HEAD <state>\\r\\n"', () => {
    expect(decode(buildSetHead('ON'))).toBe('SET HEAD ON\r\n');
    expect(decode(buildSetHead('OFF'))).toBe('SET HEAD OFF\r\n');
  });

  it('buildSetCounter emits "SET COUNTER @<slot> <mode>\\r\\n"', () => {
    expect(decode(buildSetCounter(0, '+1'))).toBe('SET COUNTER @0 +1\r\n');
    expect(decode(buildSetCounter(1, '-1'))).toBe('SET COUNTER @1 -1\r\n');
  });

  it('buildSetResponse emits "SET RESPONSE <state>\\r\\n"', () => {
    expect(decode(buildSetResponse('ON'))).toBe('SET RESPONSE ON\r\n');
    expect(decode(buildSetResponse('OFF'))).toBe('SET RESPONSE OFF\r\n');
    expect(decode(buildSetResponse('BATCH'))).toBe('SET RESPONSE BATCH\r\n');
  });

  it('buildSetPrintkey emits "SET PRINTKEY <state>\\r\\n"', () => {
    expect(decode(buildSetPrintkey('ON'))).toBe('SET PRINTKEY ON\r\n');
    expect(decode(buildSetPrintkey('OFF'))).toBe('SET PRINTKEY OFF\r\n');
  });

  it('buildSetReprint emits "SET REPRINT <state>\\r\\n"', () => {
    expect(decode(buildSetReprint('ON'))).toBe('SET REPRINT ON\r\n');
    expect(decode(buildSetReprint('OFF'))).toBe('SET REPRINT OFF\r\n');
  });

  it('buildLimitfeed emits "LIMITFEED <n>\\r\\n"', () => {
    expect(decode(buildLimitfeed(0))).toBe('LIMITFEED 0\r\n');
    expect(decode(buildLimitfeed(800))).toBe('LIMITFEED 800\r\n');
  });

  it('buildEoj emits "EOJ\\r\\n"', () => {
    expect(decode(buildEoj())).toBe('EOJ\r\n');
  });
});

describe('status query / output builders (§ 1.3)', () => {
  it('buildEcho emits "ECHO \\"<text>\\"\\r\\n"', () => {
    expect(decode(buildEcho('ping'))).toBe('ECHO "ping"\r\n');
    expect(decode(buildEcho(''))).toBe('ECHO ""\r\n');
  });

  it('buildOut emits "OUT \\"<text>\\"\\r\\n"', () => {
    expect(decode(buildOut('ready'))).toBe('OUT "ready"\r\n');
    expect(decode(buildOut(''))).toBe('OUT ""\r\n');
  });
});

describe('concatBytes', () => {
  it('joins multiple Uint8Arrays in order', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5]);
    const c = new Uint8Array([6]);
    expect(concatBytes(a, b, c)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });

  it('returns a zero-length buffer for no input', () => {
    expect(concatBytes()).toEqual(new Uint8Array(0));
  });

  it('handles empty constituent buffers', () => {
    const a = new Uint8Array([1, 2]);
    const empty = new Uint8Array(0);
    expect(concatBytes(empty, a, empty)).toEqual(new Uint8Array([1, 2]));
  });
});
