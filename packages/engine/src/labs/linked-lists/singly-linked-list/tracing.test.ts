import { describe, expect, it } from 'vitest';
import type { Execution } from '../../../core/execution';
import type { LinkedListState, StructureState } from '../../../core/state';
import { deepClone } from '../../../testing/deep';
import { checkItemInvariants } from '../../../testing/invariants';
import { singlyLinkedListItem as item } from './singly-linked-list';

type Op = Record<string, unknown> & { type: string };

function stateOf(values: readonly number[]): LinkedListState {
  const created = item.createInitialState(values);
  if (!created.ok || created.state.kind !== 'linked-list') throw new Error('estado inválido');
  return created.state;
}

function orderIds(state: StructureState): number[] {
  if (state.kind !== 'linked-list') throw new Error('estado não é lista encadeada');
  const ids: number[] = [];
  for (let id = state.head; id !== null;) {
    ids.push(id);
    id = state.nodes.find((n) => n.id === id)?.next ?? null;
  }
  return ids;
}

/** Listas de 0, 1, 2 e 4 elementos (com repetidos) × todas as operações × posições -1 a 5. */
function scenarios(): { state: LinkedListState; op: Op }[] {
  const states = [[], [3], [3, 3], [3, 5, 3, 7]].map(stateOf);
  const ops: Op[] = [
    { type: 'removeHead' },
    { type: 'removeTail' },
    { type: 'traverse' },
    { type: 'toArray' },
  ];
  for (const value of [3, 5, 9]) {
    ops.push(
      { type: 'insertHead', value },
      { type: 'insertTail', value },
      { type: 'search', value },
    );
    for (let position = -1; position <= 5; position += 1) {
      ops.push({ type: 'insertAt', position, value });
    }
  }
  for (let position = -1; position <= 5; position += 1) {
    ops.push({ type: 'removeAt', position }, { type: 'getAt', position });
  }
  return states.flatMap((state) => ops.map((op) => ({ state, op })));
}

/** Execuções de todos os cenários que geram execução (entrada inválida não gera). */
function executions(): { state: LinkedListState; op: Op; execution: Execution }[] {
  const out: { state: LinkedListState; op: Op; execution: Execution }[] = [];
  for (const { state, op } of scenarios()) {
    const attempt = item.run(state, op);
    if (attempt.outcome === 'completed' || attempt.outcome === 'rejected') {
      out.push({ state, op, execution: attempt.execution });
    }
  }
  return out;
}

const ALL = executions();

describe('o que cada passo registra', () => {
  it('o conjunto de cenários é grande e exercita conclusões e rejeições', () => {
    expect(ALL.length).toBeGreaterThan(150);
    expect(ALL.some((e) => e.execution.outcome === 'rejected')).toBe(true);
    expect(ALL.some((e) => e.execution.outcome === 'completed')).toBe(true);
  });

  it('todo passo traz estado, descrição (chave + parâmetros), destaques, pseudocódigo e contadores', () => {
    for (const { execution } of ALL) {
      execution.steps.forEach((step, i) => {
        expect(step.index).toBe(i);
        expect(step.state.kind).toBe('linked-list');
        expect(Array.isArray((step.state as LinkedListState).nodes)).toBe(true);
        expect(typeof step.message.key).toBe('string');
        for (const param of Object.values(step.message.params)) {
          expect(['number', 'boolean', 'string']).toContain(typeof param);
        }
        expect(Array.isArray(step.highlights)).toBe(true);
        expect(step.anchor).not.toBeNull(); // esta estrutura sempre aponta uma linha de pseudocódigo
        for (const counter of Object.values(step.counters)) {
          expect(Number.isInteger(counter) && counter >= 0).toBe(true);
        }
        expect(Object.keys(step.counters).sort()).toEqual(['accesses', 'comparisons', 'moves']);
      });
    }
  });

  it('a operação executada acompanha a execução (nome e parâmetros)', () => {
    for (const { op, execution } of ALL) {
      expect(execution.operationName).toBe(op.type);
      expect(execution.operation).toEqual(op);
    }
  });

  it('todas as invariantes genéricas (I-01 a I-15) valem em todos os cenários', () => {
    for (const { state, op } of scenarios()) {
      expect(checkItemInvariants(item, state, op)).toEqual([]);
    }
  });

  it('âncoras e mensagens declaradas = âncoras e mensagens realmente usadas (nada morto, nada oculto)', () => {
    const anchors = new Set<string>();
    const keys = new Set<string>();
    for (const { execution } of ALL) {
      for (const step of execution.steps) {
        if (step.anchor !== null) anchors.add(step.anchor);
        keys.add(step.message.key);
      }
    }
    expect([...anchors].sort()).toEqual([...item.descriptor.anchors].sort());
    expect([...keys].sort()).toEqual([...item.descriptor.messageKeys].sort());
  });

  it('toda âncora e toda mensagem seguem o prefixo da estrutura (sll.)', () => {
    expect(item.descriptor.anchors.every((a) => a.startsWith('sll.'))).toBe(true);
    expect(item.descriptor.messageKeys.every((k) => k.startsWith('sll.'))).toBe(true);
  });
});

describe('nó atual e nós destacados', () => {
  const VISIT_KEYS = new Set([
    'sll.insertAt.visit',
    'sll.removeAt.visit',
    'sll.getAt.visit',
    'sll.traverse.visit',
    'sll.toArray.visit',
    'sll.search.compare',
  ]);

  it('em todo passo de visita há exatamente um nó atual, na posição anunciada, e os anteriores como visitados', () => {
    let checked = 0;
    for (const { execution } of ALL) {
      for (const step of execution.steps) {
        if (!VISIT_KEYS.has(step.message.key)) continue;
        const { index } = step.message.params as { index: number };
        const order = orderIds(step.state);
        const current = step.highlights.filter((h) => h.role === 'current');
        expect(current).toEqual([
          { target: { type: 'element', id: order[index] }, role: 'current' },
        ]);
        const visited = step.highlights.filter((h) => h.role === 'visited').map((h) => h.target);
        expect(visited).toEqual(order.slice(0, index).map((id) => ({ type: 'element', id })));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(60);
  });

  it('o percurso destaca ponteiros head/tail na abertura e deixa o rastro "visited" no fim', () => {
    const execution = executionOfTraverse([4, 8, 15]);
    expect(execution.steps[0]?.highlights).toEqual([
      { target: { type: 'element', id: 0 }, role: 'head' },
      { target: { type: 'element', id: 2 }, role: 'tail' },
    ]);
    expect(execution.steps.at(-1)?.highlights).toEqual([
      { target: { type: 'element', id: 0 }, role: 'visited' },
      { target: { type: 'element', id: 1 }, role: 'visited' },
      { target: { type: 'element', id: 2 }, role: 'visited' },
    ]);
  });

  it('a pesquisa destaca o encontrado como "found"; o ausente destaca tudo como "not-found"', () => {
    const found = run(stateOf([4, 8, 15]), { type: 'search', value: 8 });
    expect(found.steps.at(-1)?.highlights).toEqual([
      { target: { type: 'element', id: 0 }, role: 'visited' },
      { target: { type: 'element', id: 1 }, role: 'found' },
    ]);
    const missing = run(stateOf([4, 8]), { type: 'search', value: 1 });
    expect(missing.steps.at(-1)?.highlights.map((h) => h.role)).toEqual(['not-found', 'not-found']);
  });

  it('as inserções destacam o nó novo e a aresta recém-criada', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'insertAt', position: 2, value: 9 });
    const linkPrevious = execution.steps.find((s) => s.anchor === 'sll.insertAt.link-previous');
    expect(linkPrevious?.highlights).toContainEqual({
      target: { type: 'element', id: 3 },
      role: 'inserted',
    });
    expect(linkPrevious?.highlights).toContainEqual({
      target: { type: 'edge', from: 1, to: 3 },
      role: 'inserted',
    });
    expect(linkPrevious?.highlights).toContainEqual({
      target: { type: 'element', id: 1 },
      role: 'previous',
    });
  });

  it('as remoções destacam o nó removido, inclusive no último passo (já fora do estado)', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeAt', position: 1 });
    const last = execution.steps.at(-1);
    expect(last?.highlights).toEqual([{ target: { type: 'element', id: 1 }, role: 'removed' }]);
    expect((last?.state as LinkedListState).nodes.some((n) => n.id === 1)).toBe(false);
  });
});

describe('evolução da lista sem modificar estados anteriores', () => {
  it('insertAt: cada passo guarda a lista como ela era naquele instante', () => {
    const initial = stateOf([4, 8, 15]);
    const before = deepClone(initial);
    const execution = run(initial, { type: 'insertAt', position: 2, value: 9 });
    const next = (step: number, id: number) =>
      (execution.steps[step]?.state as LinkedListState).nodes.find((n) => n.id === id)?.next;
    const count = (step: number) => (execution.steps[step]?.state as LinkedListState).nodes.length;

    expect(initial).toEqual(before); // a entrada não foi tocada
    expect(execution.steps[0]?.state).toEqual(before); // passo 0 = estado anterior à operação
    // 0 entry, 1-2 walk, 3 allocate, 4 link-next, 5 link-previous, 6 done
    expect([1, 2, 3].map(count)).toEqual([3, 3, 4]);
    expect(next(3, 3)).toBeNull(); // nó solto: ainda não aponta para ninguém
    expect(next(4, 3)).toBe(2); // agora aponta para o 15...
    expect(next(4, 1)).toBe(2); // ...mas o 8 ainda aponta para o 15
    expect(next(5, 1)).toBe(3); // só agora o 8 aponta para o 9
    expect(next(3, 1)).toBe(2); // e o passo 3, já registrado, continua mostrando o 8 -> 15
    expect(next(0, 1)).toBe(2);
  });

  it('removeAt: o nó desligado continua existindo nos passos em que ainda existia', () => {
    const execution = run(stateOf([4, 8, 15, 16]), { type: 'removeAt', position: 1 });
    const stateAt = (anchor: string) =>
      execution.steps.find((s) => s.anchor === anchor)?.state as LinkedListState;
    const had = (state: LinkedListState, id: number) => state.nodes.some((n) => n.id === id);
    expect(had(stateAt('sll.removeAt.read-target'), 1)).toBe(true);
    expect(had(stateAt('sll.removeAt.unlink'), 1)).toBe(true); // desligado, ainda existe
    expect(orderIds(stateAt('sll.removeAt.unlink'))).toEqual([0, 2, 3]); // mas fora da ordem
    expect(had(stateAt('sll.removeAt.done'), 1)).toBe(false); // liberado só no fim
    expect(had(execution.steps[0]?.state as LinkedListState, 1)).toBe(true); // o passo 0 nunca perde o nó
  });

  it('os estados de passos consecutivos que diferem são objetos distintos (nada é reaproveitado e alterado)', () => {
    for (const { execution } of ALL) {
      execution.steps.forEach((step, i) => {
        const previous = execution.steps[i - 1];
        if (previous === undefined) return;
        const changed = JSON.stringify(previous.state) !== JSON.stringify(step.state);
        if (changed) {
          expect(step.state).not.toBe(previous.state);
          const a = (previous.state as LinkedListState).nodes;
          const b = (step.state as LinkedListState).nodes;
          if (JSON.stringify(a) !== JSON.stringify(b)) expect(b).not.toBe(a);
        }
      });
    }
  });

  it('o estado final de cada execução é exatamente o do último passo', () => {
    for (const { execution } of ALL) {
      expect(execution.steps.at(-1)?.state).toEqual(execution.finalState);
      expect(execution.steps[0]?.state).toEqual(execution.initialState);
    }
  });

  it('a execução inteira sobrevive à ida e volta por JSON (pode ser guardada e reproduzida)', () => {
    for (const { execution } of ALL) {
      expect(JSON.parse(JSON.stringify(execution))).toEqual(execution);
    }
  });

  it('contadores só crescem e fecham com o total dos metadados', () => {
    for (const { execution } of ALL) {
      let previous = { comparisons: 0, moves: 0, accesses: 0 };
      for (const step of execution.steps) {
        expect(step.counters.comparisons).toBeGreaterThanOrEqual(previous.comparisons);
        expect(step.counters.moves).toBeGreaterThanOrEqual(previous.moves);
        expect(step.counters.accesses).toBeGreaterThanOrEqual(previous.accesses);
        previous = step.counters;
      }
      expect(execution.steps.at(-1)?.counters).toEqual(execution.metadata.counters);
    }
  });
});

describe('exemplo de uso (o mesmo que a documentação mostra)', () => {
  it('criar, inserir no meio, pesquisar e remover, encadeando os estados finais', () => {
    const created = item.createInitialState([4, 8, 15]);
    if (!created.ok) throw new Error('estado inválido');

    const inserted = run(created.state, { type: 'insertAt', position: 1, value: 6 });
    expect(inserted.metadata).toMatchObject({ elementsBefore: 3, elementsAfter: 4, stepCount: 6 });

    const searched = run(inserted.finalState, { type: 'search', value: 15 });
    expect(searched.result).toEqual({ type: 'found', id: 2, index: 3 });

    const removed = run(searched.finalState, { type: 'removeAt', position: 3 });
    expect(removed.result).toEqual({ type: 'value', value: 15 });
    expect(orderIds(removed.finalState)).toEqual([0, 3, 1]);
  });
});

// ------------------------------------------------------------------------------------------
function run(state: StructureState, op: Op): Execution {
  const attempt = item.run(state, op);
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected') {
    throw new Error(`esperava execução, recebi ${attempt.outcome}`);
  }
  return attempt.execution;
}

function executionOfTraverse(values: readonly number[]): Execution {
  return run(stateOf(values), { type: 'traverse' });
}
