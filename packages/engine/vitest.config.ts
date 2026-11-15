import { defineConfig } from 'vitest/config';

// Ambiente (node) e padrão de arquivos de teste são os padrões do Vitest.
// Aqui fica só o que é específico da Engine: o piso de cobertura (ADR-0013, RNF-028).
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
