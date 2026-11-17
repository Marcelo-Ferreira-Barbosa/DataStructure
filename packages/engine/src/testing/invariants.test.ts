import { describe, expect, it } from 'vitest';
import { defineItem } from '../core/define-item';
import type { Execution } from '../core/execution';
import { elementId } from '../core/ids';
import type { ItemDefinition } from '../core/item';
import { LIMITS } from '../core/limits';
import type { SequenceState, StackState } from '../core/state';
import { getItem } from '../catalog/registry';
import { deepClone, deepEqual, deepFreeze } from './deep';
import { checkExecutionInvariants, checkItemInvariants, sampleOperations } from './invariants';

const stack = getItem('stack');
if (stack === undefined) throw new Error('item "stack" ausente');

function realExecution(operation: unknown, values: readonly number[] = [4, 8, 15]): Execution {
  const created = stack!.createInitialState(values);
  if (!created.ok) throw new Error('estado inválido');
  const attempt = stack!.run(created.state, operation);
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected')
    throw new Error('sem execução');
  return attempt.execution;
}

const codes = (violations: readonly string[]): string[] => violations.map((v) => v.slice(0, 4));

describe('checkExecutionInvariants: aceita execuções corretas', () => {
  it.each([
    ['push', { type: 'push', value: 1 }],
    ['pop', { type: 'pop' }],
    ['peek', { type: 'peek' }],
  ])('%s', (_name, operation) => {
    expect(checkExecutionInvariants(realExecution(operation), stack.descriptor)).toEqual([]);
  });

  it('aceita operação rejeitada', () => {
    expect(checkExecutionInvariants(realExecution({ type: 'pop' }, []), stack.descriptor)).toEqual(
      [],
    );
  });
});

/** Cada caso corrompe UMA propriedade de uma execução real e exige que a invariante certa dispare. */
describe('checkExecutionInvariants: detecta violações', () => {
  const base = realExecution({ type: 'push', value: 16 });
  const mutable = (): { [key: string]: unknown } & Execution => deepClone(base) as never;
  const detect = (broken: Execution): string[] =>
    codes(checkExecutionInvariants(broken, stack.descriptor));

  it('I-00: execução sem passos', () => {
    expect(detect({ ...mutable(), steps: [] })).toEqual(['I-00']);
  });

  it('I-01: passo 0 diferente do estado inicial', () => {
    const e = mutable();
    expect(detect({ ...e, initialState: realExecution({ type: 'pop' }).finalState })).toContain(
      'I-01',
    );
  });

  it('I-02: último passo diferente do estado final', () => {
    const e = mutable();
    expect(detect({ ...e, finalState: e.initialState })).toContain('I-02');
  });

  it('I-03: índices fora de ordem', () => {
    const e = mutable();
    const [first, second] = e.steps;
    expect(detect({ ...e, steps: [{ ...first!, index: 1 }, second!] })).toContain('I-03');
  });

  it('I-04: contadores decrescendo', () => {
    const e = mutable();
    const [first, second] = e.steps;
    const dropped = { ...first!, counters: { comparisons: 5, moves: 0, accesses: 0 } };
    expect(detect({ ...e, steps: [dropped, second!] })).toContain('I-04');
  });

  it('I-05: âncora não declarada', () => {
    const e = mutable();
    const [first, second] = e.steps;
    expect(
      detect({ ...e, steps: [{ ...first!, anchor: 'stack.inexistente' }, second!] }),
    ).toContain('I-05');
  });

  it('I-06: mensagem não declarada', () => {
    const e = mutable();
    const [first, second] = e.steps;
    const bad = { ...first!, message: { key: 'stack.inexistente', params: {} } };
    expect(detect({ ...e, steps: [bad, second!] })).toContain('I-06');
  });

  it('I-07: ids repetidos em um estado', () => {
    const e = mutable();
    const duplicated: StackState = {
      kind: 'stack',
      nextId: 9,
      elements: [
        { id: elementId(1), value: 1 },
        { id: elementId(1), value: 2 },
      ],
    };
    const [first, second] = e.steps;
    expect(detect({ ...e, steps: [{ ...first!, state: duplicated }, second!] })).toContain('I-07');
  });

  it('I-08: destaque de elemento que não existe', () => {
    const e = mutable();
    const [first, second] = e.steps;
    const ghost = {
      ...first!,
      highlights: [{ target: { type: 'element', id: elementId(99) }, role: 'top' }],
    } as const;
    expect(detect({ ...e, steps: [ghost, second!] })).toContain('I-08');
  });

  it('I-09: parâmetro que não sobrevive ao JSON (undefined)', () => {
    const e = mutable();
    const [first, second] = e.steps;
    const bad = { ...first!, message: { key: 'stack.push.start', params: { value: undefined } } };
    expect(detect({ ...e, steps: [bad as never, second!] })).toContain('I-09');
  });

  it('I-09: valor NaN não sobrevive ao JSON', () => {
    const e = mutable();
    const [first, second] = e.steps;
    const bad = { ...first!, message: { key: 'stack.push.start', params: { value: Number.NaN } } };
    expect(detect({ ...e, steps: [bad, second!] })).toContain('I-09');
  });

  it('I-12: acima do teto de passos', () => {
    const e = mutable();
    const step = e.steps[0]!;
    const many = Array.from({ length: LIMITS.maxStepsPerExecution + 1 }, (_, index) => ({
      ...step,
      index,
    }));
    expect(detect({ ...e, steps: many, finalState: step.state })).toContain('I-12');
  });

  it('I-13: rejeitada que altera o estado, ou concluída com motivo', () => {
    const e = mutable();
    expect(
      detect({
        ...e,
        outcome: 'rejected',
        metadata: { ...e.metadata, rejection: 'EMPTY_STRUCTURE' },
      }),
    ).toContain('I-13');
    expect(detect({ ...e, outcome: 'rejected' })).toContain('I-13');
    expect(detect({ ...e, metadata: { ...e.metadata, rejection: 'EMPTY_STRUCTURE' } })).toContain(
      'I-13',
    );
  });

  it('I-14: stepCount incoerente', () => {
    const e = mutable();
    expect(detect({ ...e, metadata: { ...e.metadata, stepCount: 99 } })).toContain('I-14');
  });

  it('I-15: estado final acima do limite de elementos ou com valor fora da faixa', () => {
    const e = mutable();
    const tooMany: StackState = {
      kind: 'stack',
      nextId: 51,
      elements: Array.from({ length: LIMITS.maxElements + 1 }, (_, i) => ({
        id: elementId(i),
        value: 0,
      })),
    };
    const outOfRange: StackState = {
      kind: 'stack',
      nextId: 1,
      elements: [{ id: elementId(0), value: 5000 }],
    };
    const lastIndex = e.steps.length - 1;
    const withFinal = (state: StackState): Execution => ({
      ...e,
      finalState: state,
      steps: e.steps.map((s, i) => (i === lastIndex ? { ...s, state } : s)),
    });
    expect(detect(withFinal(tooMany))).toContain('I-15');
    expect(detect(withFinal(outOfRange))).toContain('I-15');
  });
});

describe('checkItemInvariants: detecta itens defeituosos', () => {
  const complexity = {
    time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
    space: 'O(1)',
    amortized: null,
  } as const;
  type Types = {
    readonly state: SequenceState;
    readonly operation: { readonly type: 'go' };
    readonly messages: { 'x.go': { n: number } };
    readonly anchors: 'x.a';
  };
  const empty: SequenceState = { kind: 'sequence', nextId: 0, elements: [], auxiliary: [] };

  function faulty(execute: ItemDefinition<Types>['execute']) {
    return defineItem<Types>({
      descriptor: {
        id: 'faulty',
        labId: 'sorting',
        stateKind: 'sequence',
        operations: [{ type: 'go', params: [], complexity }],
        anchors: ['x.a'],
        messageKeys: ['x.go'],
        examples: [{ id: 'e', values: [] }],
      },
      createInitialState: () => empty,
      execute,
    });
  }

  it('I-10: resultado que muda entre execuções (não determinístico)', () => {
    let calls = 0;
    const item = faulty(({ state, recorder }) => {
      recorder.step({ state, message: { key: 'x.go', params: { n: calls++ } }, anchor: 'x.a' });
      return { outcome: 'completed', finalState: state, result: { type: 'none' } };
    });
    expect(codes(checkItemInvariants(item, empty, { type: 'go' }))).toContain('I-10');
  });

  it('I-11: item que altera o estado recebido', () => {
    const item = faulty(({ state, recorder }) => {
      (state.elements as unknown as unknown[]).push({ id: 0, value: 1 });
      recorder.step({ state, message: { key: 'x.go', params: { n: 0 } }, anchor: 'x.a' });
      return { outcome: 'completed', finalState: state, result: { type: 'none' } };
    });
    expect(codes(checkItemInvariants(item, empty, { type: 'go' }))).toEqual(['I-11']);
  });

  it('não acusa nada em um item correto', () => {
    const item = faulty(({ state, recorder }) => {
      recorder.step({ state, message: { key: 'x.go', params: { n: 0 } }, anchor: 'x.a' });
      return { outcome: 'completed', finalState: state, result: { type: 'none' } };
    });
    expect(checkItemInvariants(item, empty, { type: 'go' })).toEqual([]);
  });
});

describe('sampleOperations', () => {
  const complexity = {
    time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
    space: 'O(1)',
    amortized: null,
  } as const;

  it('sem parâmetros: uma única operação', () => {
    expect(sampleOperations({ type: 'pop', params: [], complexity })).toEqual([{ type: 'pop' }]);
  });

  it('com parâmetros: mínimo, zero (se couber) e máximo, sem repetir', () => {
    const op = {
      type: 'push',
      params: [{ name: 'value', role: 'value', min: -5, max: 5 }],
      complexity,
    } as const;
    expect(sampleOperations(op)).toEqual([
      { type: 'push', value: -5 },
      { type: 'push', value: 0 },
      { type: 'push', value: 5 },
    ]);
    const positive = {
      type: 'at',
      params: [{ name: 'position', role: 'position', min: 2, max: 4 }],
      complexity,
    } as const;
    expect(sampleOperations(positive).map((o) => o['position'])).toEqual([2, 4]);
  });

  it('combina os parâmetros (produto cartesiano)', () => {
    const op = {
      type: 'insertAt',
      params: [
        { name: 'position', role: 'position', min: 0, max: 3 },
        { name: 'value', role: 'value', min: -1, max: 1 },
      ],
      complexity,
    } as const;
    expect(sampleOperations(op)).toHaveLength(2 * 3);
  });
});

describe('deepEqual, deepFreeze e deepClone', () => {
  it('deepEqual: estrutural, estrito e sem depender da ordem das chaves', () => {
    expect(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([], {})).toBe(false);
    expect(deepEqual(0, -0)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it('deepFreeze: congela em profundidade e é idempotente', () => {
    const value = deepFreeze({ a: [{ b: 1 }] });
    expect(Object.isFrozen(value.a[0])).toBe(true);
    expect(() => deepFreeze(value)).not.toThrow();
  });

  it('deepClone: copia sem compartilhar referências', () => {
    const original = { a: [{ b: 1 }], c: null };
    const copy = deepClone(original);
    expect(copy).toEqual(original);
    expect(copy.a[0]).not.toBe(original.a[0]);
  });
});
