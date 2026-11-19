import { describe, expect, it } from 'vitest';
import { getItem, listItems } from '../catalog/registry';
import { sampleOperations } from '../testing/invariants';
import type { Execution } from './execution';
import type { Item } from './item';
import { deepFreeze } from './freeze';
import { createRecorder } from './recorder';
import type { StructureState } from './state';

/** Todas as execuções amostradas do catálogo (conclusões e rejeições), de todas as estruturas. */
const items: Item[] = listItems().flatMap((descriptor) => {
  const item = getItem(descriptor.id);
  return item === undefined ? [] : [item];
});

function sampledExecutions(): { name: string; execution: Execution; initial: StructureState }[] {
  const out: { name: string; execution: Execution; initial: StructureState }[] = [];
  for (const item of items) {
    const states: StructureState[] = [];
    const empty = item.createInitialState([]);
    if (empty.ok) states.push(empty.state);
    for (const example of item.descriptor.examples) {
      const created = item.createInitialState(example.values);
      if (created.ok) states.push(created.state);
    }
    for (const state of states) {
      for (const operation of item.descriptor.operations) {
        for (const sample of sampleOperations(operation)) {
          const attempt = item.run(state, sample);
          if (attempt.outcome === 'completed' || attempt.outcome === 'rejected') {
            out.push({
              name: `${item.descriptor.id}.${attempt.execution.operationName}`,
              execution: attempt.execution,
              initial: state,
            });
          }
        }
      }
    }
  }
  return out;
}

function everyObjectIsFrozen(value: unknown, path = 'execution'): string[] {
  if (typeof value !== 'object' || value === null) return [];
  const problems = Object.isFrozen(value) ? [] : [path];
  for (const [key, child] of Object.entries(value)) {
    problems.push(...everyObjectIsFrozen(child, `${path}.${key}`));
  }
  return problems;
}

describe('deepFreeze', () => {
  it('congela objetos e listas em qualquer profundidade e devolve o mesmo valor', () => {
    const value = { a: [{ b: 1 }], c: { d: [1, 2] } };
    expect(deepFreeze(value)).toBe(value);
    expect(Object.isFrozen(value.a[0])).toBe(true);
    expect(Object.isFrozen(value.c.d)).toBe(true);
  });

  it('é idempotente e aceita primitivos, null e estruturas já congeladas', () => {
    expect(deepFreeze(3)).toBe(3);
    expect(deepFreeze(null)).toBeNull();
    const frozen = Object.freeze({ x: 1 });
    expect(deepFreeze(frozen)).toBe(frozen);
    expect(deepFreeze(deepFreeze({ y: [1] }))).toEqual({ y: [1] });
  });
});

describe('a execução entregue é um valor imutável (todas as estruturas do catálogo)', () => {
  const all = sampledExecutions();

  it('há execuções de todas as estruturas, concluídas e rejeitadas', () => {
    expect(new Set(all.map((e) => e.name.split('.')[0])).size).toBe(items.length);
    expect(all.some((e) => e.execution.outcome === 'rejected')).toBe(true);
    expect(all.some((e) => e.execution.outcome === 'completed')).toBe(true);
  });

  it('nenhum objeto ou lista dentro da execução está solto (inclusive o array de passos)', () => {
    for (const { name, execution } of all) {
      expect(everyObjectIsFrozen(execution), name).toEqual([]);
    }
  });

  it('tentar alterar passos, estados, metadados ou o array de passos lança TypeError', () => {
    for (const { name, execution } of all) {
      const step = execution.steps[0];
      expect(() => (execution.steps as unknown[]).push({}), name).toThrow(TypeError);
      expect(() => ((execution as { outcome: string }).outcome = 'x'), name).toThrow(TypeError);
      expect(() => ((execution.metadata as { stepCount: number }).stepCount = 0), name).toThrow(
        TypeError,
      );
      expect(() => ((step as { anchor: string | null }).anchor = 'x'), name).toThrow(TypeError);
      expect(() => ((step?.counters as { moves: number }).moves = 99), name).toThrow(TypeError);
      expect(() => (step?.highlights as unknown[]).push({}), name).toThrow(TypeError);
    }
  });

  it('o estado de entrada do chamador também fica congelado (os passos o referenciam)', () => {
    for (const { name, initial } of all) {
      expect(Object.isFrozen(initial), name).toBe(true);
    }
  });
});

describe('o registrador congela cada passo no instante em que o registra', () => {
  it('código que tente alterar um passo já registrado, durante a execução, falha na hora', () => {
    const { recorder, steps } = createRecorder();
    const working = { kind: 'stack', nextId: 1, elements: [{ id: 0, value: 1 }] };
    recorder.step({
      state: working as never,
      message: { key: 'k', params: { n: 1 } },
      anchor: null,
    });
    // O algoritmo ainda "tem" o objeto e tenta reaproveitá-lo alterando-o: não consegue.
    expect(() => working.elements.push({ id: 1, value: 2 })).toThrow(TypeError);
    expect(() => ((working.elements[0] as { value: number }).value = 9)).toThrow(TypeError);
    expect(steps()[0]?.state).toEqual({
      kind: 'stack',
      nextId: 1,
      elements: [{ id: 0, value: 1 }],
    });
  });

  it('contadores registrados em um passo não mudam quando os seguintes contam mais', () => {
    const { recorder, steps } = createRecorder();
    const frame = {
      state: { kind: 'stack' } as never,
      message: { key: 'k', params: {} } as never,
      anchor: null,
    };
    recorder.step(frame);
    recorder.access();
    recorder.move(2);
    recorder.step(frame);
    expect(steps().map((s) => s.counters)).toEqual([
      { comparisons: 0, moves: 0, accesses: 0 },
      { comparisons: 0, moves: 2, accesses: 1 },
    ]);
  });
});
