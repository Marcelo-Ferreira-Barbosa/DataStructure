import { describe, expect, it } from 'vitest';
import { getItem } from '../catalog/registry';
import { LIMITS } from './limits';
import { replay } from './replay';

const stack = getItem('stack');
if (stack === undefined) throw new Error('item "stack" ausente do catálogo');

describe('replay', () => {
  it('reproduz uma receita e devolve estado final e resumos (sem passos)', () => {
    const result = replay(
      stack,
      [4, 8, 15],
      [{ type: 'push', value: 16 }, { type: 'pop' }, { type: 'pop' }],
    );
    expect(result).toEqual({
      ok: true,
      finalState: {
        kind: 'stack',
        nextId: 4,
        elements: [
          { id: 0, value: 4 },
          { id: 1, value: 8 },
        ],
      },
      summaries: [
        {
          operationName: 'push',
          outcome: 'completed',
          stepCount: 2,
          counters: { comparisons: 0, moves: 1, accesses: 0 },
        },
        {
          operationName: 'pop',
          outcome: 'completed',
          stepCount: 3,
          counters: { comparisons: 0, moves: 1, accesses: 1 },
        },
        {
          operationName: 'pop',
          outcome: 'completed',
          stepCount: 3,
          counters: { comparisons: 0, moves: 1, accesses: 1 },
        },
      ],
    });
  });

  it('operações rejeitadas fazem parte da receita', () => {
    const result = replay(stack, [], [{ type: 'pop' }]);
    expect(result).toMatchObject({
      ok: true,
      summaries: [{ operationName: 'pop', outcome: 'rejected' }],
    });
  });

  it('receita vazia devolve o estado inicial', () => {
    expect(replay(stack, [1, 2], [])).toMatchObject({ ok: true, summaries: [] });
  });

  it('é determinística', () => {
    const operations = [{ type: 'push', value: 1 }, { type: 'pop' }, { type: 'pop' }];
    expect(replay(stack, [5], operations)).toEqual(replay(stack, [5], operations));
  });

  it('aponta a operação inválida que impede a reprodução', () => {
    expect(
      replay(
        stack,
        [],
        [
          { type: 'push', value: 1 },
          { type: 'push', value: 5000 },
        ],
      ),
    ).toEqual({
      ok: false,
      failedAt: 1,
      reason: 'invalid-input',
    });
  });

  it('dados iniciais inválidos são um problema global', () => {
    expect(replay(stack, [1.5], [])).toEqual({
      ok: false,
      failedAt: null,
      reason: 'invalid-initial-data',
    });
  });

  it('limita a quantidade de operações da receita', () => {
    const operations = Array.from({ length: LIMITS.maxOperationsPerSimulation + 1 }, () => ({
      type: 'peek',
    }));
    expect(replay(stack, [1], operations)).toEqual({
      ok: false,
      failedAt: null,
      reason: 'too-many-operations',
    });
    expect(replay(stack, [1], operations.slice(0, LIMITS.maxOperationsPerSimulation)).ok).toBe(
      true,
    );
  });

  it('uma push além do limite de elementos inviabiliza a receita', () => {
    const operations = Array.from({ length: 2 }, () => ({ type: 'push', value: 1 }));
    expect(
      replay(
        stack,
        Array.from({ length: LIMITS.maxElements - 1 }, () => 0),
        operations,
      ),
    ).toMatchObject({
      ok: false,
      failedAt: 1,
      reason: 'invalid-input',
    });
  });
});
