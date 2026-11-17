import { describe, expect, it } from 'vitest';
import type { Execution, OperationAttempt } from '../../../core/execution';
import type { StructureState } from '../../../core/state';
import { LIMITS } from '../../../core/limits';
import { EngineInvariantError } from '../../../core/problems';
import { stackItem } from './stack';

function stateOf(values: readonly number[]): StructureState {
  const created = stackItem.createInitialState(values);
  if (!created.ok) throw new Error('estado inicial inválido no teste');
  return created.state;
}

function executionOf(attempt: OperationAttempt): Execution {
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected') {
    throw new Error(`esperava execução, recebi ${attempt.outcome}`);
  }
  return attempt.execution;
}

const valuesOf = (state: StructureState): number[] =>
  state.kind === 'stack' ? state.elements.map((e) => e.value) : [];

describe('estado inicial da Pilha', () => {
  it('cria elementos com ids sequenciais do fundo para o topo', () => {
    expect(stateOf([4, 8, 15])).toEqual({
      kind: 'stack',
      nextId: 3,
      elements: [
        { id: 0, value: 4 },
        { id: 1, value: 8 },
        { id: 2, value: 15 },
      ],
    });
  });

  it('aceita lista vazia e exatamente o limite de elementos', () => {
    expect(stackItem.createInitialState([]).ok).toBe(true);
    const full = Array.from({ length: LIMITS.maxElements }, (_, i) => i);
    expect(stackItem.createInitialState(full).ok).toBe(true);
  });

  it('rejeita acima do limite, valores não inteiros, fora da faixa e não lista', () => {
    const tooMany = Array.from({ length: LIMITS.maxElements + 1 }, () => 1);
    expect(stackItem.createInitialState(tooMany)).toMatchObject({
      ok: false,
      problems: [{ code: 'LIMIT_EXCEEDED', path: 'values' }],
    });
    expect(stackItem.createInitialState([1, 2.5, 99999, 'x'])).toEqual({
      ok: false,
      problems: [
        { code: 'INVALID_TYPE', path: 'values[1]', meta: null },
        { code: 'OUT_OF_RANGE', path: 'values[2]', meta: { min: -999, max: 999 } },
        { code: 'INVALID_TYPE', path: 'values[3]', meta: null },
      ],
    });
    expect(stackItem.createInitialState('abc')).toMatchObject({
      ok: false,
      problems: [{ code: 'INVALID_TYPE', path: 'values' }],
    });
  });
});

describe('push', () => {
  it('produz a execução completa esperada (fixture dourado)', () => {
    const execution = executionOf(stackItem.run(stateOf([4, 8, 15]), { type: 'push', value: 16 }));
    const initial = stateOf([4, 8, 15]);
    const final = {
      kind: 'stack',
      nextId: 4,
      elements: [
        { id: 0, value: 4 },
        { id: 1, value: 8 },
        { id: 2, value: 15 },
        { id: 3, value: 16 },
      ],
    };
    expect(execution).toEqual({
      operationName: 'push',
      operation: { type: 'push', value: 16 },
      outcome: 'completed',
      initialState: initial,
      finalState: final,
      steps: [
        {
          index: 0,
          state: initial,
          highlights: [],
          message: { key: 'stack.push.start', params: { value: 16 } },
          anchor: 'stack.push.entry',
          counters: { comparisons: 0, moves: 0, accesses: 0 },
        },
        {
          index: 1,
          state: final,
          highlights: [
            { target: { type: 'element', id: 3 }, role: 'inserted' },
            { target: { type: 'element', id: 3 }, role: 'top' },
          ],
          message: { key: 'stack.push.done', params: { value: 16, size: 4 } },
          anchor: 'stack.push.write',
          counters: { comparisons: 0, moves: 1, accesses: 0 },
        },
      ],
      result: { type: 'none' },
      complexity: {
        time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
        space: 'O(1)',
        amortized: null,
      },
      metadata: {
        itemId: 'stack',
        labId: 'linear',
        engineRevision: 1,
        elementsBefore: 3,
        elementsAfter: 4,
        stepCount: 2,
        rejection: null,
        counters: { comparisons: 0, moves: 1, accesses: 0 },
      },
    });
  });

  it('funciona sobre pilha vazia', () => {
    const execution = executionOf(stackItem.run(stateOf([]), { type: 'push', value: -999 }));
    expect(valuesOf(execution.finalState)).toEqual([-999]);
  });
});

describe('pop', () => {
  it('remove o topo, devolve o valor e destaca o removido no último passo', () => {
    const execution = executionOf(stackItem.run(stateOf([4, 8, 15]), { type: 'pop' }));
    expect(execution.outcome).toBe('completed');
    expect(execution.result).toEqual({ type: 'value', value: 15 });
    expect(valuesOf(execution.finalState)).toEqual([4, 8]);
    expect(execution.steps).toHaveLength(3);
    expect(execution.steps[1]?.highlights).toEqual([
      { target: { type: 'element', id: 2 }, role: 'top' },
    ]);
    // O elemento removido já não está no estado final, mas continua destacado (animação de saída).
    expect(execution.steps[2]?.highlights).toEqual([
      { target: { type: 'element', id: 2 }, role: 'removed' },
    ]);
    expect(execution.metadata.counters).toEqual({ comparisons: 0, moves: 1, accesses: 1 });
  });

  it('em pilha vazia é rejeitada: execução curta, estado intacto, motivo registrado', () => {
    const initial = stateOf([]);
    const execution = executionOf(stackItem.run(initial, { type: 'pop' }));
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('EMPTY_STRUCTURE');
    expect(execution.steps).toHaveLength(2);
    expect(execution.steps[1]?.message).toEqual({ key: 'stack.empty', params: {} });
    expect(execution.finalState).toEqual(initial);
    expect(execution.result).toEqual({ type: 'none' });
  });
});

describe('peek', () => {
  it('lê o topo sem alterar a pilha', () => {
    const initial = stateOf([4, 8, 15]);
    const execution = executionOf(stackItem.run(initial, { type: 'peek' }));
    expect(execution.result).toEqual({ type: 'value', value: 15 });
    expect(execution.finalState).toEqual(initial);
    expect(execution.metadata.counters).toEqual({ comparisons: 0, moves: 0, accesses: 1 });
  });

  it('em pilha vazia é rejeitada', () => {
    const execution = executionOf(stackItem.run(stateOf([]), { type: 'peek' }));
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('EMPTY_STRUCTURE');
  });
});

describe('identidade dos elementos', () => {
  it('nunca reutiliza um id depois de remover o elemento', () => {
    let state = stateOf([4]);
    for (const operation of [
      { type: 'push', value: 1 },
      { type: 'pop' },
      { type: 'push', value: 2 },
    ]) {
      state = executionOf(stackItem.run(state, operation)).finalState;
    }
    expect(state.kind === 'stack' && state.elements.map((e) => e.id)).toEqual([0, 2]);
  });
});

describe('entradas inválidas (não geram execução)', () => {
  const state = stateOf([4, 8, 15]);
  const cases: [string, unknown, { code: string; path: string }][] = [
    [
      'valor acima da faixa',
      { type: 'push', value: 1000 },
      { code: 'OUT_OF_RANGE', path: 'value' },
    ],
    [
      'valor abaixo da faixa',
      { type: 'push', value: -1000 },
      { code: 'OUT_OF_RANGE', path: 'value' },
    ],
    ['valor não inteiro', { type: 'push', value: 1.5 }, { code: 'INVALID_TYPE', path: 'value' }],
    ['valor em texto', { type: 'push', value: '7' }, { code: 'INVALID_TYPE', path: 'value' }],
    ['valor ausente', { type: 'push' }, { code: 'REQUIRED', path: 'value' }],
    ['parâmetro extra', { type: 'pop', value: 1 }, { code: 'NOT_ALLOWED', path: 'value' }],
    ['tipo desconhecido', { type: 'fly' }, { code: 'NOT_ALLOWED', path: 'type' }],
    ['tipo ausente', { value: 1 }, { code: 'REQUIRED', path: 'type' }],
    ['operação nula', null, { code: 'INVALID_TYPE', path: 'operation' }],
    ['operação em lista', [], { code: 'INVALID_TYPE', path: 'operation' }],
  ];

  it.each(cases)('%s', (_name, operation, expected) => {
    const attempt = stackItem.run(state, operation);
    expect(attempt.outcome).toBe('invalid-input');
    expect(attempt).toMatchObject({ problems: [expected] });
  });

  it('push com a pilha cheia é LIMIT_EXCEEDED (ERR-003), não rejeição', () => {
    const full = stateOf(Array.from({ length: LIMITS.maxElements }, (_, i) => i));
    expect(stackItem.run(full, { type: 'push', value: 1 })).toEqual({
      outcome: 'invalid-input',
      problems: [
        { code: 'LIMIT_EXCEEDED', path: 'value', meta: { min: 0, max: LIMITS.maxElements } },
      ],
    });
    // pop e peek continuam permitidos na pilha cheia
    expect(stackItem.run(full, { type: 'pop' }).outcome).toBe('completed');
  });

  it('acumula todos os problemas de forma, na ordem do descritor', () => {
    const attempt = stackItem.run(state, { type: 'push', value: 'x', extra: true });
    expect(attempt).toMatchObject({
      outcome: 'invalid-input',
      problems: [
        { code: 'NOT_ALLOWED', path: 'extra' },
        { code: 'INVALID_TYPE', path: 'value' },
      ],
    });
  });
});

describe('erro de programação', () => {
  it('lança EngineInvariantError ao receber estado de outra estrutura', () => {
    const queue: StructureState = { kind: 'queue', nextId: 0, elements: [] };
    expect(() => stackItem.run(queue, { type: 'pop' })).toThrow(EngineInvariantError);
  });
});
