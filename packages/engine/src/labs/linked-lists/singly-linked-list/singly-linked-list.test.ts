import { describe, expect, it } from 'vitest';
import type { Execution, OperationAttempt } from '../../../core/execution';
import { LIMITS } from '../../../core/limits';
import { EngineInvariantError } from '../../../core/problems';
import { createRng } from '../../../core/rng';
import type { LinkedListState, StructureState } from '../../../core/state';
import { deepClone, deepFreeze } from '../../../testing/deep';
import { SinglyLinkedList } from './list';
import { singlyLinkedListItem as item } from './singly-linked-list';

function stateOf(values: readonly number[]): LinkedListState {
  const created = item.createInitialState(values);
  if (!created.ok || created.state.kind !== 'linked-list') {
    throw new Error('estado inicial inválido no teste');
  }
  return created.state;
}

function executionOf(attempt: OperationAttempt): Execution {
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected') {
    throw new Error(`esperava execução, recebi ${attempt.outcome}`);
  }
  return attempt.execution;
}

function listState(state: StructureState): LinkedListState {
  if (state.kind !== 'linked-list') throw new Error('estado não é lista encadeada');
  return state;
}

/** Valores na ordem da lista, seguindo `head -> next` (nunca a ordem do vetor `nodes`). */
function orderOf(state: StructureState): number[] {
  const s = listState(state);
  const out: number[] = [];
  for (let id = s.head; id !== null;) {
    const node = s.nodes.find((n) => n.id === id);
    if (node === undefined) throw new Error(`nó ${id} ausente`);
    out.push(node.value);
    id = node.next;
  }
  return out;
}

const run = (state: StructureState, operation: unknown): Execution =>
  executionOf(item.run(state, operation));

describe('estado inicial', () => {
  it('lista vazia: sem nós, head e tail nulos', () => {
    expect(stateOf([])).toEqual({
      kind: 'linked-list',
      variant: 'singly',
      nextId: 0,
      nodes: [],
      head: null,
      tail: null,
    });
  });

  it('liga os nós em sequência por id, sem referência para trás', () => {
    expect(stateOf([4, 8, 15])).toEqual({
      kind: 'linked-list',
      variant: 'singly',
      nextId: 3,
      nodes: [
        { id: 0, value: 4, next: 1, prev: null },
        { id: 1, value: 8, next: 2, prev: null },
        { id: 2, value: 15, next: null, prev: null },
      ],
      head: 0,
      tail: 2,
    });
  });

  it('aceita o limite exato e rejeita acima dele, fora da faixa ou de outro tipo', () => {
    const full = Array.from({ length: LIMITS.maxElements }, (_, i) => i);
    expect(item.createInitialState(full).ok).toBe(true);
    expect(item.createInitialState([...full, 1])).toMatchObject({
      ok: false,
      problems: [{ code: 'LIMIT_EXCEEDED', path: 'values' }],
    });
    expect(item.createInitialState([1000, 'x', 1.5])).toMatchObject({
      ok: false,
      problems: [
        { code: 'OUT_OF_RANGE', path: 'values[0]' },
        { code: 'INVALID_TYPE', path: 'values[1]' },
        { code: 'INVALID_TYPE', path: 'values[2]' },
      ],
    });
  });

  it('aceita valores repetidos, negativos e zero (faixa -999..999)', () => {
    expect(orderOf(stateOf([0, -999, 999, 0, 0]))).toEqual([0, -999, 999, 0, 0]);
  });
});

describe('insertHead', () => {
  it('em lista vazia: o nó vira head e tail; tamanho 1', () => {
    const execution = run(stateOf([]), { type: 'insertHead', value: 7 });
    expect(execution.outcome).toBe('completed');
    expect(execution.finalState).toEqual({
      kind: 'linked-list',
      variant: 'singly',
      nextId: 1,
      nodes: [{ id: 0, value: 7, next: null, prev: null }],
      head: 0,
      tail: 0,
    });
    expect(execution.result).toEqual({ type: 'none' });
    expect(execution.metadata).toMatchObject({ elementsBefore: 0, elementsAfter: 1 });
  });

  it('em lista com elementos: vai para o início, aponta para o antigo head e preserva o tail', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'insertHead', value: 1 });
    const final = listState(execution.finalState);
    expect(orderOf(final)).toEqual([1, 4, 8, 15]);
    expect(final.head).toBe(3);
    expect(final.tail).toBe(2);
    expect(final.nodes.find((n) => n.id === 3)).toEqual({ id: 3, value: 1, next: 0, prev: null });
    expect(execution.metadata).toMatchObject({ elementsBefore: 3, elementsAfter: 4 });
  });

  it('o nó nasce solto: existe no estado, mas ainda não está na lista (passo intermediário)', () => {
    const execution = run(stateOf([4, 8]), { type: 'insertHead', value: 1 });
    const allocated = listState(execution.steps[1]?.state as StructureState);
    expect(allocated.nodes).toHaveLength(3);
    expect(orderOf(allocated)).toEqual([4, 8]); // o novo ainda não é alcançável
    expect(allocated.head).toBe(0);
    expect(execution.steps[1]?.anchor).toBe('sll.insertHead.allocate');
  });

  it('segue a ordem de passos: aloca, liga o next, move o head e conclui', () => {
    const execution = run(stateOf([4, 8]), { type: 'insertHead', value: 1 });
    expect(execution.steps.map((s) => s.anchor)).toEqual([
      'sll.insertHead.entry',
      'sll.insertHead.allocate',
      'sll.insertHead.link-next',
      'sll.insertHead.set-head',
      'sll.insertHead.done',
    ]);
    expect(execution.steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    // Em lista vazia há um passo a mais: o único nó também vira tail.
    const empty = run(stateOf([]), { type: 'insertHead', value: 1 });
    expect(empty.steps.map((s) => s.anchor)).toContain('sll.insertHead.set-tail');
  });

  it('contadores: 2 gravações de ponteiro (3 se a lista estava vazia), sem comparações', () => {
    expect(run(stateOf([4, 8]), { type: 'insertHead', value: 1 }).metadata.counters).toEqual({
      comparisons: 0,
      moves: 2,
      accesses: 0,
    });
    expect(run(stateOf([]), { type: 'insertHead', value: 1 }).metadata.counters).toEqual({
      comparisons: 0,
      moves: 3,
      accesses: 0,
    });
  });

  it('mantém o custo constante: a mesma quantidade de passos com 1 ou 40 elementos', () => {
    const small = run(stateOf([1]), { type: 'insertHead', value: 5 });
    const large = run(stateOf(Array.from({ length: 40 }, (_, i) => i)), {
      type: 'insertHead',
      value: 5,
    });
    expect(large.steps).toHaveLength(small.steps.length);
    expect(large.metadata.counters).toEqual(small.metadata.counters);
  });
});

describe('insertTail', () => {
  it('em lista vazia: o nó vira head e tail; tamanho 1', () => {
    const execution = run(stateOf([]), { type: 'insertTail', value: 7 });
    expect(execution.finalState).toEqual({
      kind: 'linked-list',
      variant: 'singly',
      nextId: 1,
      nodes: [{ id: 0, value: 7, next: null, prev: null }],
      head: 0,
      tail: 0,
    });
  });

  it('em lista com elementos: o antigo tail aponta para o novo, que vira tail; head preservado', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'insertTail', value: 16 });
    const final = listState(execution.finalState);
    expect(orderOf(final)).toEqual([4, 8, 15, 16]);
    expect(final.head).toBe(0);
    expect(final.tail).toBe(3);
    expect(final.nodes.find((n) => n.id === 2)?.next).toBe(3);
    expect(final.nodes.find((n) => n.id === 3)?.next).toBeNull();
  });

  it('o nó nasce solto e só entra na lista quando o antigo tail aponta para ele', () => {
    const execution = run(stateOf([4, 8]), { type: 'insertTail', value: 16 });
    const allocated = listState(execution.steps[2]?.state as StructureState);
    expect(execution.steps[2]?.anchor).toBe('sll.insertTail.allocate');
    expect(allocated.nodes).toHaveLength(3);
    expect(orderOf(allocated)).toEqual([4, 8]);
    const linked = listState(execution.steps[3]?.state as StructureState);
    expect(execution.steps[3]?.anchor).toBe('sll.insertTail.link-tail');
    expect(orderOf(linked)).toEqual([4, 8, 16]);
    expect(linked.tail).toBe(1); // o ponteiro tail só muda no passo seguinte
  });

  it('segue a ordem de passos esperada', () => {
    expect(
      run(stateOf([4, 8]), { type: 'insertTail', value: 1 }).steps.map((s) => s.anchor),
    ).toEqual([
      'sll.insertTail.entry',
      'sll.insertTail.check-empty',
      'sll.insertTail.allocate',
      'sll.insertTail.link-tail',
      'sll.insertTail.set-tail',
      'sll.insertTail.done',
    ]);
    expect(run(stateOf([]), { type: 'insertTail', value: 1 }).steps.map((s) => s.anchor)).toEqual([
      'sll.insertTail.entry',
      'sll.insertTail.check-empty',
      'sll.insertTail.allocate',
      'sll.insertTail.set-head',
      'sll.insertTail.set-tail',
      'sll.insertTail.done',
    ]);
  });

  it('contadores: 1 acesso ao tail + 2 gravações (2 gravações se vazia)', () => {
    expect(run(stateOf([4, 8]), { type: 'insertTail', value: 1 }).metadata.counters).toEqual({
      comparisons: 0,
      moves: 2,
      accesses: 1,
    });
    expect(run(stateOf([]), { type: 'insertTail', value: 1 }).metadata.counters).toEqual({
      comparisons: 0,
      moves: 2,
      accesses: 0,
    });
  });

  it('não percorre a lista: a quantidade de passos não depende do tamanho', () => {
    const small = run(stateOf([1]), { type: 'insertTail', value: 5 });
    const large = run(stateOf(Array.from({ length: 40 }, (_, i) => i)), {
      type: 'insertTail',
      value: 5,
    });
    expect(large.steps).toHaveLength(small.steps.length);
  });
});

describe('preservação da ordem e tamanho em sequências de inserções', () => {
  it('mistura de insertHead e insertTail posiciona cada valor corretamente', () => {
    let state: StructureState = stateOf([]);
    const script = [
      ['insertTail', 2],
      ['insertHead', 1],
      ['insertTail', 3],
      ['insertHead', 0],
      ['insertTail', 4],
    ] as const;
    script.forEach(([type, value], i) => {
      const execution = run(state, { type, value });
      state = execution.finalState;
      expect(execution.metadata).toMatchObject({ elementsBefore: i, elementsAfter: i + 1 });
    });
    expect(orderOf(state)).toEqual([0, 1, 2, 3, 4]);
  });

  it('ids são sempre novos e crescentes; nextId nunca repete', () => {
    let state: StructureState = stateOf([9]);
    for (let i = 0; i < 6; i += 1) {
      state = run(state, { type: i % 2 === 0 ? 'insertHead' : 'insertTail', value: i }).finalState;
    }
    const s = listState(state);
    expect(s.nodes.map((n) => n.id)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(s.nextId).toBe(7);
  });

  it('elementos repetidos viram nós distintos, com ids distintos', () => {
    let state: StructureState = stateOf([5, 5]);
    state = run(state, { type: 'insertHead', value: 5 }).finalState;
    state = run(state, { type: 'insertTail', value: 5 }).finalState;
    expect(orderOf(state)).toEqual([5, 5, 5, 5]);
    expect(new Set(listState(state).nodes.map((n) => n.id)).size).toBe(4);
  });

  it('aceita os extremos da faixa permitida', () => {
    let state: StructureState = stateOf([]);
    state = run(state, { type: 'insertTail', value: LIMITS.minValue }).finalState;
    state = run(state, { type: 'insertTail', value: LIMITS.maxValue }).finalState;
    state = run(state, { type: 'insertHead', value: 0 }).finalState;
    expect(orderOf(state)).toEqual([0, LIMITS.minValue, LIMITS.maxValue]);
  });
});

describe('toArray', () => {
  it('lista vazia: [] em 2 passos e nenhum acesso', () => {
    const execution = run(stateOf([]), { type: 'toArray' });
    expect(execution.result).toEqual({ type: 'values', values: [] });
    expect(execution.steps).toHaveLength(2);
    expect(execution.metadata.counters).toEqual({ comparisons: 0, moves: 0, accesses: 0 });
  });

  it('devolve os valores na ordem da lista, não na ordem dos ids', () => {
    const after = run(stateOf([2, 3]), { type: 'insertHead', value: 1 }).finalState;
    const execution = run(after, { type: 'toArray' });
    expect(execution.result).toEqual({ type: 'values', values: [1, 2, 3] });
    // Os ids em `nodes` estão em 0,1,2; a lista está em 2,0,1: a ordem vem dos ponteiros.
    expect(listState(after).nodes.map((n) => n.value)).toEqual([2, 3, 1]);
  });

  it('um passo por nó visitado e um acesso por nó; o estado não muda', () => {
    const initial = stateOf([4, 8, 15]);
    const execution = run(initial, { type: 'toArray' });
    expect(execution.finalState).toEqual(initial);
    expect(execution.steps.map((s) => s.anchor)).toEqual([
      'sll.toArray.entry',
      'sll.toArray.visit',
      'sll.toArray.visit',
      'sll.toArray.visit',
      'sll.toArray.done',
    ]);
    expect(execution.metadata.counters.accesses).toBe(3);
    expect(execution.steps[2]?.highlights).toEqual([
      { target: { type: 'element', id: 0 }, role: 'visited' },
      { target: { type: 'element', id: 1 }, role: 'current' },
    ]);
  });

  it('o custo cresce com o tamanho (O(n))', () => {
    const n5 = run(stateOf([1, 2, 3, 4, 5]), { type: 'toArray' });
    const n10 = run(stateOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { type: 'toArray' });
    expect(n10.steps.length - n5.steps.length).toBe(5);
  });

  it('inserir e converter em seguida dá o mesmo array que a lista de referência', () => {
    const inserted = run(stateOf([]), { type: 'insertTail', value: 1 }).finalState;
    const withHead = run(inserted, { type: 'insertHead', value: 0 }).finalState;
    expect(run(withHead, { type: 'toArray' }).result).toEqual({ type: 'values', values: [0, 1] });
  });
});

describe('limites e entradas inválidas', () => {
  it('inserir além do limite é entrada inválida e não gera execução', () => {
    const full = stateOf(Array.from({ length: LIMITS.maxElements }, (_, i) => i));
    for (const type of ['insertHead', 'insertTail']) {
      expect(item.run(full, { type, value: 1 })).toMatchObject({
        outcome: 'invalid-input',
        problems: [{ code: 'LIMIT_EXCEEDED' }],
      });
    }
  });

  it('toArray continua permitido com a lista cheia', () => {
    const full = stateOf(Array.from({ length: LIMITS.maxElements }, (_, i) => i));
    expect(run(full, { type: 'toArray' }).outcome).toBe('completed');
  });

  it('valor ausente, de outro tipo, fora da faixa ou operação desconhecida não geram execução', () => {
    const state = stateOf([1]);
    expect(item.run(state, { type: 'insertHead' }).outcome).toBe('invalid-input');
    expect(item.run(state, { type: 'insertTail', value: '3' }).outcome).toBe('invalid-input');
    expect(item.run(state, { type: 'insertTail', value: 1.5 }).outcome).toBe('invalid-input');
    expect(item.run(state, { type: 'insertHead', value: 1000 }).outcome).toBe('invalid-input');
    expect(item.run(state, { type: 'remove' }).outcome).toBe('invalid-input');
    expect(item.run(state, null).outcome).toBe('invalid-input');
  });
});

describe('imutabilidade e determinismo', () => {
  it('não altera o estado de entrada (congelado em profundidade)', () => {
    const initial = deepFreeze(stateOf([4, 8, 15]));
    const snapshot = deepClone(initial);
    for (const operation of [
      { type: 'insertHead', value: 1 },
      { type: 'insertTail', value: 1 },
      { type: 'toArray' },
    ]) {
      run(initial, operation);
      expect(initial).toEqual(snapshot);
    }
  });

  it('a mesma entrada produz exatamente a mesma execução', () => {
    const operation = { type: 'insertTail', value: 3 };
    expect(run(stateOf([1, 2]), operation)).toEqual(run(stateOf([1, 2]), operation));
  });

  it('o resultado é serializável em JSON sem perdas', () => {
    const execution = run(stateOf([1, 2]), { type: 'insertHead', value: 0 });
    expect(JSON.parse(JSON.stringify(execution))).toEqual(execution);
  });
});

describe('conformidade com a lista de referência (SinglyLinkedList)', () => {
  it('após qualquer sequência de inserções, a simulação e a lista real têm a mesma ordem e o mesmo tamanho', () => {
    const rng = createRng(2026);
    for (let round = 0; round < 20; round += 1) {
      const reference = new SinglyLinkedList<number>();
      let state: StructureState = stateOf([]);
      const operations = 1 + rng.nextInt(25);
      for (let i = 0; i < operations; i += 1) {
        const value = rng.nextInt(1999) - 999;
        if (rng.nextInt(2) === 0) {
          reference.prepend(value);
          state = run(state, { type: 'insertHead', value }).finalState;
        } else {
          reference.append(value);
          state = run(state, { type: 'insertTail', value }).finalState;
        }
        const current = listState(state);
        expect(orderOf(current)).toEqual(reference.toArray());
        expect(current.nodes.length).toBe(reference.size);
        expect(current.head === null).toBe(reference.isEmpty());
      }
      expect(run(state, { type: 'toArray' }).result).toEqual({
        type: 'values',
        values: reference.toArray(),
      });
    }
  });
});

describe('defesa contra estado corrompido (nunca produzido pela própria engine)', () => {
  it('ciclo em next: lança EngineInvariantError em vez de travar', () => {
    const cyclic: LinkedListState = {
      ...stateOf([1, 2]),
      nodes: [
        { id: 0 as never, value: 1, next: 1 as never, prev: null },
        { id: 1 as never, value: 2, next: 0 as never, prev: null },
      ],
    };
    expect(() => item.run(cyclic, { type: 'toArray' })).toThrow(EngineInvariantError);
  });

  it('next apontando para nó inexistente: lança EngineInvariantError', () => {
    const dangling: LinkedListState = {
      ...stateOf([1]),
      nodes: [{ id: 0 as never, value: 1, next: 7 as never, prev: null }],
    };
    expect(() => item.run(dangling, { type: 'toArray' })).toThrow(EngineInvariantError);
  });
});
