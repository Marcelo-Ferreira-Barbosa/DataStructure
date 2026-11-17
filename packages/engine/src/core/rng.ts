import { LIMITS } from './limits';
import { EngineInvariantError } from './problems';

/** Gerador pseudoaleatório semeado (substitui Math.random). Mesma semente, mesma sequência. */
export interface Rng {
  /** Inteiro em [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
}

/** mulberry32: pequeno, rápido e suficiente para dados didáticos. Semente: inteiro sem sinal de 32 bits. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return {
    nextInt(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) {
        throw new EngineInvariantError(`maxExclusive inválido: ${maxExclusive}`);
      }
      return next32() % maxExclusive;
    },
  };
}

/** `count` inteiros em [minValue, maxValue], determinísticos para a mesma semente. */
export function generateRandomValues(seed: number, count: number): readonly number[] {
  if (!Number.isInteger(count) || count < 0 || count > LIMITS.maxElements) {
    throw new EngineInvariantError(`count inválido: ${count}`);
  }
  const rng = createRng(seed);
  const span = LIMITS.maxValue - LIMITS.minValue + 1;
  return Array.from({ length: count }, () => LIMITS.minValue + rng.nextInt(span));
}
