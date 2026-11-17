import { describe, expect, it } from 'vitest';
import { LIMITS } from './limits';
import { EngineInvariantError } from './problems';
import { createRng, generateRandomValues } from './rng';

describe('createRng', () => {
  it('é determinístico: mesma semente, mesma sequência', () => {
    const a = createRng(123456);
    const b = createRng(123456);
    const seqA = Array.from({ length: 20 }, () => a.nextInt(1000));
    const seqB = Array.from({ length: 20 }, () => b.nextInt(1000));
    expect(seqA).toEqual(seqB);
  });

  it('sementes diferentes dão sequências diferentes', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(Array.from({ length: 10 }, () => a.nextInt(1_000_000))).not.toEqual(
      Array.from({ length: 10 }, () => b.nextInt(1_000_000)),
    );
  });

  // Valores conferidos contra uma implementação independente do mulberry32 (uint32 % 1000).
  it('mantém a sequência estável entre versões (valores fixados)', () => {
    const rng = createRng(42);
    expect(Array.from({ length: 5 }, () => rng.nextInt(1000))).toEqual([956, 290, 704, 805, 978]);
  });

  it('respeita o intervalo [0, max)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 2000; i++) {
      const n = rng.nextInt(10);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);
    }
    expect(createRng(7).nextInt(1)).toBe(0);
  });

  it('cobre todo o intervalo em muitas amostras', () => {
    const rng = createRng(99);
    const seen = new Set(Array.from({ length: 500 }, () => rng.nextInt(6)));
    expect(seen.size).toBe(6);
  });

  it.each([0, -1, 1.5, Number.NaN, 2 ** 32 + 1])('lança para maxExclusive inválido (%s)', (max) => {
    expect(() => createRng(1).nextInt(max)).toThrow(EngineInvariantError);
  });

  it('trata a semente como inteiro sem sinal de 32 bits', () => {
    expect(createRng(-1).nextInt(1000)).toBe(createRng(2 ** 32 - 1).nextInt(1000));
  });
});

describe('generateRandomValues', () => {
  it('gera a quantidade pedida, dentro da faixa e de forma determinística', () => {
    const values = generateRandomValues(123456, LIMITS.maxElements);
    expect(values).toHaveLength(LIMITS.maxElements);
    expect(
      values.every((v) => Number.isInteger(v) && v >= LIMITS.minValue && v <= LIMITS.maxValue),
    ).toBe(true);
    expect(generateRandomValues(123456, LIMITS.maxElements)).toEqual(values);
  });

  it('aceita zero elementos', () => {
    expect(generateRandomValues(1, 0)).toEqual([]);
  });

  it.each([-1, 51, 2.5])('lança para quantidade inválida (%s)', (count) => {
    expect(() => generateRandomValues(1, count)).toThrow(EngineInvariantError);
  });
});
