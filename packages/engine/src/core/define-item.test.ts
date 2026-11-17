import { describe, expect, it } from 'vitest';
import { defineItem } from './define-item';
import type { ItemDefinition } from './item';
import { LIMITS } from './limits';
import { EngineInvariantError } from './problems';
import type { SequenceState } from './state';

/** Item mínimo, só para exercitar o núcleo em situações que a Pilha não provoca. */
type Types = {
  readonly state: SequenceState;
  readonly operation: { readonly type: 'run'; readonly steps: number };
  readonly messages: { 'x.tick': { n: number } };
  readonly anchors: 'x.loop';
};

const complexity = {
  time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
  space: 'O(1)',
  amortized: null,
} as const;

function build(overrides: Partial<ItemDefinition<Types>> = {}) {
  const definition: ItemDefinition<Types> = {
    descriptor: {
      id: 'probe',
      labId: 'sorting',
      stateKind: 'sequence',
      operations: [
        {
          type: 'run',
          params: [{ name: 'steps', role: 'value', min: 0, max: 100_000 }],
          complexity,
        },
      ],
      anchors: ['x.loop'],
      messageKeys: ['x.tick'],
      examples: [{ id: 'e', values: [1] }],
    },
    createInitialState: (values) => ({
      kind: 'sequence',
      nextId: values.length,
      elements: [],
      auxiliary: [],
    }),
    execute({ state, operation, recorder }) {
      for (let n = 0; n < operation.steps; n++) {
        recorder.step({ state, message: { key: 'x.tick', params: { n } }, anchor: 'x.loop' });
      }
      return { outcome: 'completed', finalState: state, result: { type: 'none' } };
    },
    ...overrides,
  };
  return defineItem(definition);
}

const empty: SequenceState = { kind: 'sequence', nextId: 0, elements: [], auxiliary: [] };

describe('defineItem: teto de passos', () => {
  it('aceita exatamente o teto', () => {
    const attempt = build().run(empty, { type: 'run', steps: LIMITS.maxStepsPerExecution });
    expect(attempt.outcome).toBe('completed');
  });

  it('lança EngineInvariantError ao ultrapassar o teto (erro de programação)', () => {
    expect(() =>
      build().run(empty, { type: 'run', steps: LIMITS.maxStepsPerExecution + 1 }),
    ).toThrow(EngineInvariantError);
  });
});

describe('defineItem: invariantes do próprio núcleo', () => {
  it('lança se o item não registrar nenhum passo', () => {
    expect(() => build().run(empty, { type: 'run', steps: 0 })).toThrow(EngineInvariantError);
  });

  it('lança se o descritor não declarar a complexidade da operação executada', () => {
    const base = build();
    const op = base.descriptor.operations[0];
    if (op === undefined) throw new Error('operação ausente');
    const item = build({
      descriptor: {
        ...base.descriptor,
        // força o estado impossível pelo tipo: operação sem complexidade
        operations: [{ type: 'run', params: op.params, complexity: undefined as never }],
        anchors: ['x.loop'],
        messageKeys: ['x.tick'],
      },
    });
    expect(() => item.run(empty, { type: 'run', steps: 1 })).toThrow(EngineInvariantError);
  });
});

describe('defineItem: ganchos opcionais', () => {
  it('pré-condição não atendida não gera execução', () => {
    const item = build({ checkPrecondition: () => ({ code: 'INPUT_NOT_SORTED' }) });
    expect(item.run(empty, { type: 'run', steps: 1 })).toEqual({
      outcome: 'precondition-failed',
      problem: { code: 'INPUT_NOT_SORTED' },
    });
  });

  it('a verificação de estado vem antes da pré-condição', () => {
    const item = build({
      checkOperation: () => [{ code: 'LIMIT_EXCEEDED', path: 'steps', meta: null }],
      checkPrecondition: () => ({ code: 'INPUT_NOT_SORTED' }),
    });
    expect(item.run(empty, { type: 'run', steps: 1 }).outcome).toBe('invalid-input');
  });

  it('operação rejeitada devolve execução com o estado intacto', () => {
    const item = build({
      execute({ state, recorder }) {
        recorder.step({ state, message: { key: 'x.tick', params: { n: 0 } }, anchor: null });
        return { outcome: 'rejected', reason: 'VALUE_NOT_FOUND' };
      },
    });
    const attempt = item.run(empty, { type: 'run', steps: 1 });
    expect(attempt).toMatchObject({
      outcome: 'rejected',
      execution: {
        outcome: 'rejected',
        finalState: empty,
        metadata: { rejection: 'VALUE_NOT_FOUND' },
      },
    });
  });
});

describe('defineItem: contadores', () => {
  it('acumulam por passo e o total vai para os metadados', () => {
    const item = build({
      execute({ state, recorder }) {
        recorder.compare();
        recorder.step({ state, message: { key: 'x.tick', params: { n: 0 } }, anchor: 'x.loop' });
        recorder.compare(2);
        recorder.move(3);
        recorder.access();
        recorder.step({ state, message: { key: 'x.tick', params: { n: 1 } }, anchor: 'x.loop' });
        return { outcome: 'completed', finalState: state, result: { type: 'none' } };
      },
    });
    const attempt = item.run(empty, { type: 'run', steps: 1 });
    if (attempt.outcome !== 'completed') throw new Error('esperava concluída');
    const { steps, metadata } = attempt.execution;
    expect(steps.map((s) => s.counters)).toEqual([
      { comparisons: 1, moves: 0, accesses: 0 },
      { comparisons: 3, moves: 3, accesses: 1 },
    ]);
    expect(metadata.counters).toEqual({ comparisons: 3, moves: 3, accesses: 1 });
  });
});

describe('defineItem: createInitialState', () => {
  it('só chama o item com valores já validados', () => {
    let received: readonly number[] | undefined;
    const item = build({
      createInitialState: (values) => {
        received = values;
        return empty;
      },
    });
    expect(item.createInitialState([1, 2, 3]).ok).toBe(true);
    expect(received).toEqual([1, 2, 3]);
    received = undefined;
    expect(item.createInitialState([1, 1.5]).ok).toBe(false);
    expect(received).toBeUndefined();
  });
});
