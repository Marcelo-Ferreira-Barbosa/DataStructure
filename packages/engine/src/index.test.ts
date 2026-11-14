import { describe, expect, it } from 'vitest';
import { ENGINE_REVISION } from './index';

describe('engine', () => {
  it('expõe a revisão como inteiro não negativo', () => {
    expect(Number.isInteger(ENGINE_REVISION)).toBe(true);
    expect(ENGINE_REVISION).toBeGreaterThanOrEqual(0);
  });
});
