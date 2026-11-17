import { describe, expect, it } from 'vitest';
import * as engine from './index';

describe('API pública da Engine', () => {
  it('expõe a revisão como inteiro positivo (ADR-0006 exige engineRevision >= 1)', () => {
    expect(Number.isInteger(engine.ENGINE_REVISION)).toBe(true);
    expect(engine.ENGINE_REVISION).toBeGreaterThanOrEqual(1);
  });

  it('expõe exatamente a superfície prevista (nada interno vaza)', () => {
    expect(Object.keys(engine).sort()).toEqual(
      [
        'ENGINE_REVISION',
        'EngineInvariantError',
        'LIMITS',
        'createRng',
        'generateRandomValues',
        'getItem',
        'inspectState',
        'listItems',
        'replay',
      ].sort(),
    );
  });

  it('permite o fluxo completo só pela porta pública', () => {
    const item = engine.getItem('stack');
    expect(item?.descriptor.labId).toBe('linear');
    expect(engine.listItems().map((d) => d.id)).toContain('stack');
    const created = item?.createInitialState(engine.generateRandomValues(7, 5));
    expect(created?.ok).toBe(true);
    expect(engine.replay(item!, [1], [{ type: 'pop' }, { type: 'pop' }])).toMatchObject({
      ok: true,
    });
  });
});
