import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      // Type-only modules and tests don't need coverage tracking.
      // The barrel `index.ts` is pure re-exports — no runtime code.
      exclude: ['src/types.ts', 'src/index.ts', 'src/__tests__/**', 'dist/**', 'vitest.config.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
