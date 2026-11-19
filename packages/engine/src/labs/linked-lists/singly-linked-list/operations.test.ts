import { describe, expect, it } from 'vitest';
import type { Execution, OperationAttempt } from '../../../core/execution';
import { LIMITS } from '../../../core/limits';
import { createRng } from '../../../core/rng';
import type { LinkedListState, StructureState } from '../../../core/state';
import { deepClone, deepFreeze } from '../../../testing/deep';
import { SinglyLinkedList } from './list';
import { singlyLinkedListItem as item } from './singly-linked-list';

function stateOf(values: readonly number[]): LinkedListState {
  const created = item.createInitialState(values);
  if (!created.ok || created.state.kind !== 'linked-list') throw new Error('estado inválido');
  return created.state;
}

function executionOf(attempt: OperationAttempt): Execution {
  if (attempt.outcome !== 'completed' && attempt.outcome !== 'rejected') {
    throw new Error(`esperava execução, recebi ${attempt.outcome}`);
  }
  return attempt.execution;
}

const run = (state: StructureState, operation: unknown): Execution =>
  executionOf(item.run(state, operation));

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

const anchorsOf = (execution: Execution): (string | null)[] => execution.steps.map((s) => s.anchor);
const countersOf = (execution: Execution) => execution.metadata.counters;

/** Estado coerente: nós = alcançáveis, `tail` = último nó, ids sem repetição. */
function expectConsistent(state: StructureState): void {
  const s = listState(state);
  const order = orderOf(s);
  expect(s.nodes).toHaveLength(order.length);
  expect(new Set(s.nodes.map((n) => n.id)).size).toBe(s.nodes.length);
  if (order.length === 0) {
    expect(s.head).toBeNull();
    expect(s.tail).toBeNull();
  } else {
    expect(s.nodes.find((n) => n.id === s.tail)?.next).toBeNull();
  }
}

// ------------------------------------------------------------------------------------------
describe('insertAt', () => {
  it('no meio: liga o novo entre o anterior e o seguinte; head e tail intactos', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'insertAt', position: 2, value: 9 });
    expect(execution.outcome).toBe('completed');
    const final = listState(execution.finalState);
    expect(orderOf(final)).toEqual([4, 8, 9, 15]);
    expect(final.head).toBe(0);
    expect(final.tail).toBe(2);
    expect(final.nodes.find((n) => n.id === 1)?.next).toBe(3); // 8 -> 9
    expect(final.nodes.find((n) => n.id === 3)?.next).toBe(2); // 9 -> 15
    expectConsistent(final);
  });

  it('no meio: o nó nasce solto, é ligado ao seguinte e só depois o anterior aponta para ele', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'insertAt', position: 2, value: 9 });
    expect(anchorsOf(execution)).toEqual([
      'sll.insertAt.entry',
      'sll.insertAt.walk',
      'sll.insertAt.walk',
      'sll.insertAt.allocate',
      'sll.insertAt.link-next',
      'sll.insertAt.link-previous',
      'sll.insertAt.done',
    ]);
    // Cada fase vista de fora: a lista só "ganha" o nó no passo link-previous.
    expect(orderOf(listState(execution.steps[3]?.state as StructureState))).toEqual([4, 8, 15]);
    expect(orderOf(listState(execution.steps[4]?.state as StructureState))).toEqual([4, 8, 15]);
    expect(orderOf(listState(execution.steps[5]?.state as StructureState))).toEqual([4, 8, 9, 15]);
  });

  it('no meio: custo = 1 acesso por nó percorrido até o anterior e 2 gravações', () => {
    expect(
      countersOf(run(stateOf([1, 2, 3, 4, 5]), { type: 'insertAt', position: 3, value: 9 })),
    ).toEqual({ comparisons: 0, moves: 2, accesses: 3 });
  });

  it('posição 0: reaproveita a inserção no início (mesmos passos e contadores)', () => {
    const at = run(stateOf([4, 8]), { type: 'insertAt', position: 0, value: 1 });
    const head = run(stateOf([4, 8]), { type: 'insertHead', value: 1 });
    expect(orderOf(at.finalState)).toEqual([1, 4, 8]);
    expect(at.finalState).toEqual(head.finalState);
    expect(countersOf(at)).toEqual(countersOf(head));
    expect(anchorsOf(at)).toContain('sll.insertHead.set-head');
  });

  it('posição = tamanho: reaproveita a inserção no final (sem percorrer)', () => {
    const at = run(stateOf([4, 8]), { type: 'insertAt', position: 2, value: 1 });
    const tail = run(stateOf([4, 8]), { type: 'insertTail', value: 1 });
    expect(orderOf(at.finalState)).toEqual([4, 8, 1]);
    expect(at.finalState).toEqual(tail.finalState);
    expect(countersOf(at)).toEqual(countersOf(tail));
  });

  it('lista vazia: só a posição 0 é possível', () => {
    const ok = run(stateOf([]), { type: 'insertAt', position: 0, value: 7 });
    expect(orderOf(ok.finalState)).toEqual([7]);
    expectConsistent(ok.finalState);
    const rejected = run(stateOf([]), { type: 'insertAt', position: 1, value: 7 });
    expect(rejected.outcome).toBe('rejected');
    expect(rejected.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
  });

  it('um só elemento: posições 0 e 1 existem; a 2 não', () => {
    expect(
      orderOf(run(stateOf([5]), { type: 'insertAt', position: 0, value: 1 }).finalState),
    ).toEqual([1, 5]);
    expect(
      orderOf(run(stateOf([5]), { type: 'insertAt', position: 1, value: 1 }).finalState),
    ).toEqual([5, 1]);
    expect(run(stateOf([5]), { type: 'insertAt', position: 2, value: 1 }).outcome).toBe('rejected');
  });

  it('posição acima do tamanho é rejeitada: estado intacto, 2 passos, motivo e faixa nos parâmetros', () => {
    const initial = stateOf([4, 8, 15]);
    const execution = run(initial, { type: 'insertAt', position: 7, value: 1 });
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
    expect(execution.finalState).toEqual(initial);
    expect(execution.steps).toHaveLength(2);
    expect(execution.steps[1]?.message).toEqual({
      key: 'sll.position.out-of-range',
      params: { position: 7, size: 3 },
    });
    expect(execution.result).toEqual({ type: 'none' });
  });

  it('elementos repetidos entram na posição pedida', () => {
    let state: StructureState = stateOf([5, 5, 5]);
    state = run(state, { type: 'insertAt', position: 1, value: 5 }).finalState;
    state = run(state, { type: 'insertAt', position: 2, value: 7 }).finalState;
    expect(orderOf(state)).toEqual([5, 5, 7, 5, 5]);
    expectConsistent(state);
  });

  it('posição negativa, não inteira, ausente ou acima de 49 é entrada inválida (sem execução)', () => {
    const state = stateOf([1, 2]);
    expect(item.run(state, { type: 'insertAt', position: -1, value: 1 })).toMatchObject({
      outcome: 'invalid-input',
      problems: [{ code: 'OUT_OF_RANGE', path: 'position', meta: { min: 0, max: 49 } }],
    });
    expect(item.run(state, { type: 'insertAt', position: 1.5, value: 1 })).toMatchObject({
      outcome: 'invalid-input',
      problems: [{ code: 'INVALID_TYPE', path: 'position' }],
    });
    expect(item.run(state, { type: 'insertAt', value: 1 })).toMatchObject({
      outcome: 'invalid-input',
      problems: [{ code: 'REQUIRED', path: 'position' }],
    });
    expect(item.run(state, { type: 'insertAt', position: 50, value: 1 }).outcome).toBe(
      'invalid-input',
    );
  });

  it('lista cheia: entrada inválida por limite', () => {
    const full = stateOf(Array.from({ length: LIMITS.maxElements }, (_, i) => i));
    expect(item.run(full, { type: 'insertAt', position: 3, value: 1 })).toMatchObject({
      outcome: 'invalid-input',
      problems: [{ code: 'LIMIT_EXCEEDED' }],
    });
  });
});

// ------------------------------------------------------------------------------------------
describe('removeHead', () => {
  it('com vários: devolve o valor, mantém ordem e tail, e libera o nó', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeHead' });
    expect(execution.result).toEqual({ type: 'value', value: 4 });
    const final = listState(execution.finalState);
    expect(orderOf(final)).toEqual([8, 15]);
    expect(final.head).toBe(1);
    expect(final.tail).toBe(2);
    expect(final.nodes.map((n) => n.id)).toEqual([1, 2]);
    expect(final.nextId).toBe(3); // o id 0 nunca é reutilizado
    expectConsistent(final);
  });

  it('o nó sai da lista antes de sair do estado (passo intermediário com nó desligado)', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeHead' });
    expect(anchorsOf(execution)).toEqual([
      'sll.removeHead.check-empty',
      'sll.removeHead.read',
      'sll.removeHead.set-head',
      'sll.removeHead.done',
    ]);
    const detached = listState(execution.steps[2]?.state as StructureState);
    expect(detached.nodes).toHaveLength(3); // ainda existe...
    expect(orderOf(detached)).toEqual([8, 15]); // ...mas já não está na lista
    expect(execution.steps[2]?.highlights).toContainEqual({
      target: { type: 'element', id: 0 },
      role: 'removed',
    });
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 1, accesses: 1 });
  });

  it('um só elemento: a lista fica vazia e o fim também é limpo', () => {
    const execution = run(stateOf([7]), { type: 'removeHead' });
    expect(execution.result).toEqual({ type: 'value', value: 7 });
    expect(execution.finalState).toEqual({
      kind: 'linked-list',
      variant: 'singly',
      nextId: 1,
      nodes: [],
      head: null,
      tail: null,
    });
    expect(anchorsOf(execution)).toContain('sll.removeHead.set-tail');
    expect(countersOf(execution).moves).toBe(2);
  });

  it('lista vazia: rejeitada com EMPTY_STRUCTURE, estado intacto', () => {
    const initial = stateOf([]);
    const execution = run(initial, { type: 'removeHead' });
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('EMPTY_STRUCTURE');
    expect(execution.finalState).toEqual(initial);
    expect(execution.steps.map((s) => s.message.key)).toEqual([
      'sll.removeHead.start',
      'sll.empty',
    ]);
  });

  it('esvaziar com remoções sucessivas passa por todos os tamanhos', () => {
    let state: StructureState = stateOf([1, 2, 3]);
    const seen: number[][] = [];
    for (let i = 0; i < 3; i += 1) {
      state = run(state, { type: 'removeHead' }).finalState;
      seen.push(orderOf(state));
      expectConsistent(state);
    }
    expect(seen).toEqual([[2, 3], [3], []]);
  });

  it('custo constante: mesmos passos e contadores com 2 ou 40 elementos', () => {
    const a = run(stateOf([1, 2]), { type: 'removeHead' });
    const b = run(stateOf(Array.from({ length: 40 }, (_, i) => i)), { type: 'removeHead' });
    expect(b.steps).toHaveLength(a.steps.length);
    expect(countersOf(b)).toEqual(countersOf(a));
  });
});

// ------------------------------------------------------------------------------------------
describe('removeTail', () => {
  it('com vários: devolve o último e o fim passa a ser o penúltimo', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeTail' });
    expect(execution.result).toEqual({ type: 'value', value: 15 });
    const final = listState(execution.finalState);
    expect(orderOf(final)).toEqual([4, 8]);
    expect(final.tail).toBe(1);
    expect(final.nodes.find((n) => n.id === 1)?.next).toBeNull();
    expectConsistent(final);
  });

  it('percorre até o penúltimo (singular: não há como voltar do último)', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeTail' });
    expect(anchorsOf(execution)).toEqual([
      'sll.removeTail.check-empty',
      'sll.removeTail.delegate',
      'sll.removeAt.walk',
      'sll.removeAt.walk',
      'sll.removeAt.read-target',
      'sll.removeAt.unlink',
      'sll.removeAt.set-tail',
      'sll.removeAt.done',
    ]);
    // n = 3: percorre 2 nós + lê o alvo = 3 acessos; 2 gravações (next do penúltimo e tail).
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 2, accesses: 3 });
  });

  it('o custo cresce com n: cada nó a mais é 1 acesso a mais', () => {
    const accesses = (n: number): number =>
      countersOf(run(stateOf(Array.from({ length: n }, (_, i) => i)), { type: 'removeTail' }))
        .accesses;
    expect([accesses(2), accesses(5), accesses(10)]).toEqual([2, 5, 10]);
  });

  it('um só elemento: vira remoção do início e a lista fica vazia', () => {
    const execution = run(stateOf([7]), { type: 'removeTail' });
    expect(execution.result).toEqual({ type: 'value', value: 7 });
    expect(orderOf(execution.finalState)).toEqual([]);
    expect(listState(execution.finalState).tail).toBeNull();
    expect(anchorsOf(execution)).toContain('sll.removeHead.set-tail');
  });

  it('lista vazia: rejeitada com EMPTY_STRUCTURE', () => {
    const execution = run(stateOf([]), { type: 'removeTail' });
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('EMPTY_STRUCTURE');
  });

  it('o fim fica certo para novas inserções depois da remoção', () => {
    let state: StructureState = run(stateOf([1, 2, 3]), { type: 'removeTail' }).finalState;
    state = run(state, { type: 'insertTail', value: 9 }).finalState;
    expect(orderOf(state)).toEqual([1, 2, 9]);
    expectConsistent(state);
  });

  it('é o mesmo resultado que removeAt na última posição', () => {
    const tail = run(stateOf([4, 8, 15]), { type: 'removeTail' });
    const at = run(stateOf([4, 8, 15]), { type: 'removeAt', position: 2 });
    expect(tail.finalState).toEqual(at.finalState);
    expect(tail.result).toEqual(at.result);
  });
});

// ------------------------------------------------------------------------------------------
describe('removeAt', () => {
  it('no meio: religa anterior -> seguinte; custo = acessos até o alvo, 1 gravação', () => {
    const execution = run(stateOf([4, 8, 15, 16]), { type: 'removeAt', position: 2 });
    expect(execution.result).toEqual({ type: 'value', value: 15 });
    expect(orderOf(execution.finalState)).toEqual([4, 8, 16]);
    expect(anchorsOf(execution)).toEqual([
      'sll.removeAt.check-position',
      'sll.removeAt.walk',
      'sll.removeAt.walk',
      'sll.removeAt.read-target',
      'sll.removeAt.unlink',
      'sll.removeAt.done',
    ]);
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 1, accesses: 3 });
    expect(listState(execution.finalState).tail).toBe(3); // o fim não muda
    expectConsistent(execution.finalState);
  });

  it('no meio: o alvo já está desligado em um passo e só depois é liberado', () => {
    const execution = run(stateOf([4, 8, 15, 16]), { type: 'removeAt', position: 2 });
    const unlinked = listState(execution.steps[4]?.state as StructureState);
    expect(execution.steps[4]?.anchor).toBe('sll.removeAt.unlink');
    expect(unlinked.nodes).toHaveLength(4);
    expect(orderOf(unlinked)).toEqual([4, 8, 16]);
  });

  it('última posição: o fim recua para o anterior', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'removeAt', position: 2 });
    expect(listState(execution.finalState).tail).toBe(1);
    expect(anchorsOf(execution)).toContain('sll.removeAt.set-tail');
    expect(countersOf(execution).moves).toBe(2);
    expectConsistent(execution.finalState);
  });

  it('posição 0: usa a remoção do início', () => {
    const at = run(stateOf([4, 8, 15]), { type: 'removeAt', position: 0 });
    const head = run(stateOf([4, 8, 15]), { type: 'removeHead' });
    expect(at.finalState).toEqual(head.finalState);
    expect(at.result).toEqual(head.result);
  });

  it('um só elemento: a posição 0 esvazia a lista; a 1 não existe', () => {
    const execution = run(stateOf([7]), { type: 'removeAt', position: 0 });
    expect(orderOf(execution.finalState)).toEqual([]);
    expect(listState(execution.finalState).tail).toBeNull();
    const rejected = run(stateOf([7]), { type: 'removeAt', position: 1 });
    expect(rejected.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
  });

  it('posição fora do tamanho: rejeitada, estado intacto, parâmetros com posição e tamanho', () => {
    const initial = stateOf([4, 8, 15]);
    const execution = run(initial, { type: 'removeAt', position: 3 });
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
    expect(execution.finalState).toEqual(initial);
    expect(execution.steps.at(-1)?.message).toEqual({
      key: 'sll.position.out-of-range',
      params: { position: 3, size: 3 },
    });
  });

  it('lista vazia: EMPTY_STRUCTURE (e não "posição fora")', () => {
    const execution = run(stateOf([]), { type: 'removeAt', position: 0 });
    expect(execution.outcome).toBe('rejected');
    expect(execution.metadata.rejection).toBe('EMPTY_STRUCTURE');
  });

  it('posição negativa ou não inteira: entrada inválida', () => {
    const state = stateOf([1, 2, 3]);
    expect(item.run(state, { type: 'removeAt', position: -1 })).toMatchObject({
      outcome: 'invalid-input',
      problems: [{ code: 'OUT_OF_RANGE', path: 'position' }],
    });
    expect(item.run(state, { type: 'removeAt', position: 0.5 }).outcome).toBe('invalid-input');
  });

  it('elementos repetidos: remove só o nó da posição, não os iguais', () => {
    const execution = run(stateOf([5, 7, 5, 7, 5]), { type: 'removeAt', position: 2 });
    expect(orderOf(execution.finalState)).toEqual([5, 7, 7, 5]);
    expect(execution.result).toEqual({ type: 'value', value: 5 });
  });
});

// ------------------------------------------------------------------------------------------
describe('search', () => {
  it('encontra e devolve id e posição; custo = 1 acesso e 1 comparação por nó até achar', () => {
    const execution = run(stateOf([4, 8, 15, 16]), { type: 'search', value: 15 });
    expect(execution.outcome).toBe('completed');
    expect(execution.result).toEqual({ type: 'found', id: 2, index: 2 });
    expect(countersOf(execution)).toEqual({ comparisons: 3, moves: 0, accesses: 3 });
    expect(execution.finalState).toEqual(execution.initialState);
  });

  it('para na primeira ocorrência quando há repetidos', () => {
    const execution = run(stateOf([4, 7, 4, 7]), { type: 'search', value: 7 });
    expect(execution.result).toEqual({ type: 'found', id: 1, index: 1 });
    expect(countersOf(execution).comparisons).toBe(2);
    expect(anchorsOf(execution).filter((a) => a === 'sll.search.compare')).toHaveLength(2);
  });

  it('melhor caso: valor no primeiro nó custa 1 comparação', () => {
    const execution = run(stateOf(Array.from({ length: 30 }, (_, i) => i)), {
      type: 'search',
      value: 0,
    });
    expect(countersOf(execution).comparisons).toBe(1);
  });

  it('valor ausente: percorre tudo e termina em not-found (não é erro)', () => {
    const execution = run(stateOf([4, 8, 15]), { type: 'search', value: 99 });
    expect(execution.outcome).toBe('completed');
    expect(execution.result).toEqual({ type: 'not-found' });
    expect(countersOf(execution)).toEqual({ comparisons: 3, moves: 0, accesses: 3 });
    expect(execution.steps.at(-1)?.anchor).toBe('sll.search.not-found');
    expect(execution.steps.at(-1)?.highlights.every((h) => h.role === 'not-found')).toBe(true);
  });

  it('lista vazia: not-found sem nenhuma comparação', () => {
    const execution = run(stateOf([]), { type: 'search', value: 1 });
    expect(execution.outcome).toBe('completed');
    expect(execution.result).toEqual({ type: 'not-found' });
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 0, accesses: 0 });
  });

  it('valor fora da faixa é entrada inválida', () => {
    expect(item.run(stateOf([1]), { type: 'search', value: 1000 }).outcome).toBe('invalid-input');
  });

  it('funciona com a lista cheia (não insere nada)', () => {
    const full = stateOf(Array.from({ length: LIMITS.maxElements }, (_, i) => i));
    expect(run(full, { type: 'search', value: 49 }).result).toMatchObject({
      type: 'found',
      index: 49,
    });
  });
});

// ------------------------------------------------------------------------------------------
describe('getAt', () => {
  it('devolve o valor da posição; custo = posição + 1 acessos', () => {
    const execution = run(stateOf([4, 8, 15, 16]), { type: 'getAt', position: 2 });
    expect(execution.result).toEqual({ type: 'value', value: 15 });
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 0, accesses: 3 });
    expect(execution.finalState).toEqual(execution.initialState);
  });

  it('posição 0 é o melhor caso (1 acesso) e a última percorre tudo', () => {
    const state = stateOf([1, 2, 3, 4, 5]);
    expect(countersOf(run(state, { type: 'getAt', position: 0 })).accesses).toBe(1);
    expect(countersOf(run(state, { type: 'getAt', position: 4 })).accesses).toBe(5);
  });

  it('um só elemento: posição 0 existe; 1 não', () => {
    expect(run(stateOf([9]), { type: 'getAt', position: 0 }).result).toEqual({
      type: 'value',
      value: 9,
    });
    expect(run(stateOf([9]), { type: 'getAt', position: 1 }).metadata.rejection).toBe(
      'POSITION_OUT_OF_RANGE',
    );
  });

  it('lista vazia: EMPTY_STRUCTURE; posição fora: POSITION_OUT_OF_RANGE', () => {
    expect(run(stateOf([]), { type: 'getAt', position: 0 }).metadata.rejection).toBe(
      'EMPTY_STRUCTURE',
    );
    const out = run(stateOf([1, 2]), { type: 'getAt', position: 2 });
    expect(out.outcome).toBe('rejected');
    expect(out.metadata.rejection).toBe('POSITION_OUT_OF_RANGE');
    expect(out.finalState).toEqual(out.initialState);
  });

  it('posição negativa: entrada inválida', () => {
    expect(item.run(stateOf([1, 2]), { type: 'getAt', position: -1 }).outcome).toBe(
      'invalid-input',
    );
  });

  it('repetidos: devolve o valor da posição pedida, qualquer que seja', () => {
    const state = stateOf([5, 5, 6, 5]);
    expect([0, 1, 2, 3].map((p) => run(state, { type: 'getAt', position: p }).result)).toEqual([
      { type: 'value', value: 5 },
      { type: 'value', value: 5 },
      { type: 'value', value: 6 },
      { type: 'value', value: 5 },
    ]);
  });
});

// ------------------------------------------------------------------------------------------
describe('traverse', () => {
  it('visita cada nó uma vez, em ordem, sem alterar o estado nem devolver resultado', () => {
    const initial = stateOf([4, 8, 15]);
    const execution = run(initial, { type: 'traverse' });
    expect(execution.result).toEqual({ type: 'none' });
    expect(execution.finalState).toEqual(initial);
    expect(anchorsOf(execution)).toEqual([
      'sll.traverse.entry',
      'sll.traverse.visit',
      'sll.traverse.visit',
      'sll.traverse.visit',
      'sll.traverse.done',
    ]);
    expect(
      execution.steps
        .filter((s) => s.message.key === 'sll.traverse.visit')
        .map((s) => s.message.params),
    ).toEqual([
      { value: 4, index: 0 },
      { value: 8, index: 1 },
      { value: 15, index: 2 },
    ]);
    expect(countersOf(execution)).toEqual({ comparisons: 0, moves: 0, accesses: 3 });
  });

  it('segue a ordem dos ponteiros, não a dos ids', () => {
    const state = run(stateOf([2, 3]), { type: 'insertHead', value: 1 }).finalState;
    const values = run(state, { type: 'traverse' })
      .steps.filter((s) => s.message.key === 'sll.traverse.visit')
      .map((s) => (s.message.params as { value: number }).value);
    expect(values).toEqual([1, 2, 3]);
  });

  it('lista vazia: só abertura e fechamento', () => {
    const execution = run(stateOf([]), { type: 'traverse' });
    expect(anchorsOf(execution)).toEqual(['sll.traverse.entry', 'sll.traverse.done']);
  });

  it('o custo é sempre n, e toArray tem o mesmo percurso mas devolve os valores', () => {
    const state = stateOf([1, 2, 3, 4]);
    const traverse = run(state, { type: 'traverse' });
    const array = run(state, { type: 'toArray' });
    expect(traverse.steps).toHaveLength(array.steps.length);
    expect(countersOf(traverse)).toEqual(countersOf(array));
    expect(array.result).toEqual({ type: 'values', values: [1, 2, 3, 4] });
  });
});

// ------------------------------------------------------------------------------------------
describe('complexidade declarada (teórica, não medição de tempo)', () => {
  const complexityOf = (type: string) => {
    const spec = item.descriptor.operations.find((o) => o.type === type);
    if (spec === undefined) throw new Error(`operação ${type} não declarada`);
    return spec.complexity;
  };

  it.each([
    ['insertHead', 'O(1)', 'O(1)', 'O(1)', 'O(1)'],
    ['insertTail', 'O(1)', 'O(1)', 'O(1)', 'O(1)'],
    ['removeHead', 'O(1)', 'O(1)', 'O(1)', 'O(1)'],
    ['insertAt', 'O(1)', 'O(n)', 'O(n)', 'O(1)'],
    ['removeTail', 'O(1)', 'O(n)', 'O(n)', 'O(1)'],
    ['removeAt', 'O(1)', 'O(n)', 'O(n)', 'O(1)'],
    ['search', 'O(1)', 'O(n)', 'O(n)', 'O(1)'],
    ['getAt', 'O(1)', 'O(n)', 'O(n)', 'O(1)'],
    ['traverse', 'O(n)', 'O(n)', 'O(n)', 'O(1)'],
    ['toArray', 'O(n)', 'O(n)', 'O(n)', 'O(n)'],
  ] as const)(
    '%s: melhor %s, médio %s, pior %s, espaço extra %s',
    (type, best, avg, worst, space) => {
      expect(complexityOf(type)).toEqual({
        time: { best, average: avg, worst },
        space,
        amortized: null,
      });
    },
  );

  it('a execução leva a complexidade da operação, e nenhum campo de tempo', () => {
    const execution = run(stateOf([1, 2, 3]), { type: 'removeAt', position: 1 });
    expect(execution.complexity).toEqual(complexityOf('removeAt'));
    expect(JSON.stringify(execution)).not.toMatch(/duration|elapsed|timestamp|millis|"time":\d/i);
  });

  it('o crescimento observado nos contadores acompanha o declarado (pior caso linear)', () => {
    const worst = (n: number) => {
      const state = stateOf(Array.from({ length: n }, (_, i) => i));
      return {
        search: countersOf(run(state, { type: 'search', value: 999 })).comparisons,
        getAt: countersOf(run(state, { type: 'getAt', position: n - 1 })).accesses,
        head: countersOf(run(state, { type: 'removeHead' })).accesses,
      };
    };
    expect(worst(4)).toEqual({ search: 4, getAt: 4, head: 1 });
    expect(worst(20)).toEqual({ search: 20, getAt: 20, head: 1 });
  });
});

// ------------------------------------------------------------------------------------------
describe('imutabilidade das novas operações', () => {
  it('nenhuma operação altera o estado de entrada (congelado em profundidade)', () => {
    const initial = deepFreeze(stateOf([4, 8, 15]));
    const snapshot = deepClone(initial);
    const operations = [
      { type: 'insertAt', position: 1, value: 1 },
      { type: 'insertAt', position: 9, value: 1 },
      { type: 'removeHead' },
      { type: 'removeTail' },
      { type: 'removeAt', position: 1 },
      { type: 'removeAt', position: 9 },
      { type: 'search', value: 8 },
      { type: 'search', value: 99 },
      { type: 'getAt', position: 2 },
      { type: 'traverse' },
    ];
    for (const operation of operations) {
      run(initial, operation);
      expect(initial).toEqual(snapshot);
    }
  });
});

// ------------------------------------------------------------------------------------------
describe('conformidade com a lista de referência (todas as operações, inclusive inválidas)', () => {
  type Op = Record<string, unknown> & { type: string };

  /** Aplica a operação na lista real. Devolve o resultado (se houver) e se ela recusou. */
  function applyToReference(
    list: SinglyLinkedList<number>,
    op: Op,
  ): { failed: boolean; result: unknown } {
    const position = op['position'] as number;
    const value = op['value'] as number;
    try {
      switch (op.type) {
        case 'insertHead':
          list.prepend(value);
          return { failed: false, result: undefined };
        case 'insertTail':
          list.append(value);
          return { failed: false, result: undefined };
        case 'insertAt':
          list.insertAt(position, value);
          return { failed: false, result: undefined };
        case 'removeHead':
          return { failed: false, result: list.removeFirst() };
        case 'removeTail':
          return { failed: false, result: list.removeLast() };
        case 'removeAt':
          return { failed: false, result: list.removeAt(position) };
        case 'getAt':
          return { failed: false, result: list.get(position) };
        case 'search':
          return { failed: false, result: list.indexOf(value) };
        default:
          return { failed: false, result: undefined };
      }
    } catch (error) {
      if (error instanceof RangeError) return { failed: true, result: undefined };
      throw error;
    }
  }

  it('simulação e lista real concordam em resultado, erro, ordem, tamanho e fim', () => {
    const rng = createRng(11);
    let refusals = 0;
    let successes = 0;
    for (let round = 0; round < 40; round += 1) {
      const reference = new SinglyLinkedList<number>();
      let state: StructureState = stateOf([]);
      for (let i = 0; i < 40; i += 1) {
        const value = rng.nextInt(5); // poucos valores diferentes: muitos repetidos
        const position = rng.nextInt(reference.size + 4) - 1; // de -1 até size + 2
        const kinds: Op[] = [
          { type: 'insertHead', value },
          { type: 'insertTail', value },
          { type: 'insertAt', position, value },
          { type: 'removeHead' },
          { type: 'removeTail' },
          { type: 'removeAt', position },
          { type: 'getAt', position },
          { type: 'search', value },
          { type: 'traverse' },
        ];
        const op = kinds[rng.nextInt(kinds.length)] as Op;
        const grows = op.type.startsWith('insert');
        if (grows && reference.size >= 30) continue; // longe do limite de 50 elementos

        const expected = applyToReference(reference, op);
        const attempt = item.run(state, op);

        if (expected.failed) {
          // A lista real recusou: o item recusa a MESMA operação e deixa tudo como estava.
          refusals += 1;
          expect(['rejected', 'invalid-input']).toContain(attempt.outcome);
          if (attempt.outcome === 'rejected') expect(attempt.execution.finalState).toEqual(state);
        } else {
          successes += 1;
          expect(attempt.outcome).toBe('completed');
          const execution = executionOf(attempt);
          state = execution.finalState;
          if (op.type === 'search') {
            expect(execution.result.type === 'found' ? execution.result.index : -1).toBe(
              expected.result,
            );
          } else if (expected.result !== undefined) {
            expect(execution.result).toEqual({ type: 'value', value: expected.result });
          }
        }
        expect(orderOf(state)).toEqual(reference.toArray());
        expect(listState(state).nodes).toHaveLength(reference.size);
        expectConsistent(state);
      }
    }
    // O teste só vale se exercitou os dois lados em quantidade.
    expect(refusals).toBeGreaterThan(100);
    expect(successes).toBeGreaterThan(500);
  });
});
