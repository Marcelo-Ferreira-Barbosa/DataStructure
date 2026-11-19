import type { Complexity } from '../../../core/complexity';
import { defineItem } from '../../../core/define-item';
import { elementId } from '../../../core/ids';
import type { ExecuteOutcome, ItemDefinition } from '../../../core/item';
import { LIMITS } from '../../../core/limits';
import type { LinkedListState } from '../../../core/state';
import { insertAtSteps, insertHeadSteps, insertTailSteps } from './insert';
import { isEmpty, nodesInOrder, pointerHighlights } from './list-state';
import { getAtSteps, searchSteps, toArraySteps, traverseSteps } from './query';
import { removeAtCore, removeHeadSteps, type Removal } from './remove';
import { rejectEmpty, rejectPosition, type Recorder } from './steps';
import type { SinglyLinkedListOperation, SinglyLinkedListTypes } from './types';

export type {
  SinglyLinkedListAnchor,
  SinglyLinkedListMessages,
  SinglyLinkedListOperation,
  SinglyLinkedListTypes,
} from './types';

// ---------------------------------------------------------------------------------------------
// Complexidade teórica por operação (n = nós). Não é medição de tempo de execução (benchmark):
// descreve como o NÚMERO DE PASSOS ELEMENTARES cresce com n. Ver SINGLY_LINKED_LIST.md §5.
// ---------------------------------------------------------------------------------------------

/** Não depende do tamanho: mexe em um número fixo de ponteiros. */
const CONSTANT: Complexity = {
  time: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
  space: 'O(1)',
  amortized: null,
};

/**
 * Chega ao alvo andando de nó em nó: o melhor caso é o alvo estar na ponta de entrada
 * (início, ou o 1º nó); no médio e no pior, percorre uma fração de n ou n nós.
 */
const WALKS_TO_TARGET: Complexity = {
  time: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
  space: 'O(1)',
  amortized: null,
};

/** Percorre sempre todos os nós, sem guardar nada: O(n) em tempo, O(1) em espaço extra. */
const FULL_WALK: Complexity = {
  time: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  space: 'O(1)',
  amortized: null,
};

/** Igual ao percurso, mas o resultado é um array novo com n posições: O(n) de espaço. */
const FULL_WALK_COPYING: Complexity = { ...FULL_WALK, space: 'O(n)' };

const VALUE_PARAM = {
  name: 'value',
  role: 'value',
  min: LIMITS.minValue,
  max: LIMITS.maxValue,
} as const;

/** Índice a partir de 0. O maior índice possível é o do 50º nó (a lista cabe no máximo 50). */
const POSITION_PARAM = {
  name: 'position',
  role: 'position',
  min: 0,
  max: LIMITS.maxElements - 1,
} as const;

const TARGET_PARAM = { ...VALUE_PARAM, role: 'target' } as const;

// ---------------------------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------------------------

type Outcome = ExecuteOutcome<SinglyLinkedListTypes>;

const done = (finalState: LinkedListState): Outcome => ({
  outcome: 'completed',
  finalState,
  result: { type: 'none' },
});

const removed = (removal: Removal): Outcome => ({
  outcome: 'completed',
  finalState: removal.state,
  result: { type: 'value', value: removal.value },
});

function executeRemoveHead(state: LinkedListState, recorder: Recorder): Outcome {
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.removeHead.start', params: {} },
    anchor: 'sll.removeHead.check-empty',
  });
  if (isEmpty(state)) return rejectEmpty(state, recorder, 'sll.removeHead.check-empty');
  return removed(removeHeadSteps(state, recorder));
}

function executeRemoveTail(state: LinkedListState, recorder: Recorder): Outcome {
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.removeTail.start', params: {} },
    anchor: 'sll.removeTail.check-empty',
  });
  if (isEmpty(state)) return rejectEmpty(state, recorder, 'sll.removeTail.check-empty');
  // Remover o último é remover a última posição: o desligamento existe em um só lugar.
  const last = nodesInOrder(state).length - 1;
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.removeTail.delegate', params: { position: last } },
    anchor: 'sll.removeTail.delegate',
  });
  return removed(removeAtCore(state, last, recorder));
}

function executeRemoveAt(state: LinkedListState, position: number, recorder: Recorder): Outcome {
  const size = nodesInOrder(state).length;
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.removeAt.start', params: { position } },
    anchor: 'sll.removeAt.check-position',
  });
  if (size === 0) return rejectEmpty(state, recorder, 'sll.removeAt.check-position');
  if (position >= size) {
    return rejectPosition(state, recorder, position, size, 'sll.removeAt.check-position');
  }
  if (position === 0) {
    recorder.step({
      state,
      highlights: pointerHighlights(state),
      message: { key: 'sll.removeAt.at-head', params: {} },
      anchor: 'sll.removeAt.check-position',
    });
  }
  return removed(removeAtCore(state, position, recorder));
}

function executeInsertAt(
  state: LinkedListState,
  position: number,
  value: number,
  recorder: Recorder,
): Outcome {
  const size = nodesInOrder(state).length;
  // Inserir é possível de 0 até `size` (em `size`, vira inserção no final).
  if (position > size) {
    recorder.step({
      state,
      highlights: pointerHighlights(state),
      message: { key: 'sll.insertAt.start', params: { position, value } },
      anchor: 'sll.insertAt.entry',
    });
    return rejectPosition(state, recorder, position, size, 'sll.insertAt.check-position');
  }
  return done(insertAtSteps(state, position, value, recorder));
}

const singlyLinkedListDefinition: ItemDefinition<SinglyLinkedListTypes> = {
  descriptor: {
    id: 'singly-linked-list',
    labId: 'linked-lists',
    stateKind: 'linked-list',
    operations: [
      { type: 'insertHead', params: [VALUE_PARAM], complexity: CONSTANT },
      { type: 'insertTail', params: [VALUE_PARAM], complexity: CONSTANT },
      { type: 'insertAt', params: [POSITION_PARAM, VALUE_PARAM], complexity: WALKS_TO_TARGET },
      { type: 'removeHead', params: [], complexity: CONSTANT },
      { type: 'removeTail', params: [], complexity: WALKS_TO_TARGET },
      { type: 'removeAt', params: [POSITION_PARAM], complexity: WALKS_TO_TARGET },
      { type: 'search', params: [TARGET_PARAM], complexity: WALKS_TO_TARGET },
      { type: 'getAt', params: [POSITION_PARAM], complexity: WALKS_TO_TARGET },
      { type: 'traverse', params: [], complexity: FULL_WALK },
      { type: 'toArray', params: [], complexity: FULL_WALK_COPYING },
    ],
    anchors: [
      'sll.insertHead.entry',
      'sll.insertHead.allocate',
      'sll.insertHead.link-next',
      'sll.insertHead.set-head',
      'sll.insertHead.set-tail',
      'sll.insertHead.done',
      'sll.insertTail.entry',
      'sll.insertTail.check-empty',
      'sll.insertTail.allocate',
      'sll.insertTail.set-head',
      'sll.insertTail.link-tail',
      'sll.insertTail.set-tail',
      'sll.insertTail.done',
      'sll.insertAt.entry',
      'sll.insertAt.check-position',
      'sll.insertAt.walk',
      'sll.insertAt.allocate',
      'sll.insertAt.link-next',
      'sll.insertAt.link-previous',
      'sll.insertAt.done',
      'sll.removeHead.check-empty',
      'sll.removeHead.read',
      'sll.removeHead.set-head',
      'sll.removeHead.set-tail',
      'sll.removeHead.done',
      'sll.removeTail.check-empty',
      'sll.removeTail.delegate',
      'sll.removeAt.check-position',
      'sll.removeAt.walk',
      'sll.removeAt.read-target',
      'sll.removeAt.unlink',
      'sll.removeAt.set-tail',
      'sll.removeAt.done',
      'sll.search.entry',
      'sll.search.compare',
      'sll.search.found',
      'sll.search.not-found',
      'sll.getAt.check-position',
      'sll.getAt.walk',
      'sll.getAt.done',
      'sll.traverse.entry',
      'sll.traverse.visit',
      'sll.traverse.done',
      'sll.toArray.entry',
      'sll.toArray.visit',
      'sll.toArray.done',
    ],
    messageKeys: [
      'sll.empty',
      'sll.position.out-of-range',
      'sll.head.updated',
      'sll.tail.updated',
      'sll.tail.cleared',
      'sll.insertHead.start',
      'sll.insertHead.allocated',
      'sll.insertHead.linked-next',
      'sll.insertHead.done',
      'sll.insertTail.start',
      'sll.insertTail.checking',
      'sll.insertTail.allocated',
      'sll.insertTail.linked-tail',
      'sll.insertTail.done',
      'sll.insertAt.start',
      'sll.insertAt.at-head',
      'sll.insertAt.at-tail',
      'sll.insertAt.visit',
      'sll.insertAt.allocated',
      'sll.insertAt.linked-next',
      'sll.insertAt.linked-previous',
      'sll.insertAt.done',
      'sll.removeHead.start',
      'sll.removeHead.reading',
      'sll.removeHead.head-moved',
      'sll.removeHead.done',
      'sll.removeTail.start',
      'sll.removeTail.delegate',
      'sll.removeAt.start',
      'sll.removeAt.at-head',
      'sll.removeAt.visit',
      'sll.removeAt.target',
      'sll.removeAt.unlinked',
      'sll.removeAt.done',
      'sll.search.start',
      'sll.search.compare',
      'sll.search.found',
      'sll.search.not-found',
      'sll.getAt.start',
      'sll.getAt.visit',
      'sll.getAt.done',
      'sll.traverse.start',
      'sll.traverse.visit',
      'sll.traverse.done',
      'sll.toArray.start',
      'sll.toArray.visit',
      'sll.toArray.done',
    ],
    examples: [{ id: 'basic', values: [4, 8, 15] }],
  },

  createInitialState(values) {
    const last = values.length - 1;
    return {
      kind: 'linked-list',
      variant: 'singly',
      nextId: values.length,
      nodes: values.map((value, i) => ({
        id: elementId(i),
        value,
        next: i < last ? elementId(i + 1) : null,
        prev: null,
      })),
      head: values.length > 0 ? elementId(0) : null,
      tail: values.length > 0 ? elementId(last) : null,
    };
  },

  checkOperation(state, operation) {
    const inserts =
      operation.type === 'insertHead' ||
      operation.type === 'insertTail' ||
      operation.type === 'insertAt';
    if (inserts && state.nodes.length >= LIMITS.maxElements) {
      return [{ code: 'LIMIT_EXCEEDED', path: 'value', meta: { min: 0, max: LIMITS.maxElements } }];
    }
    return [];
  },

  execute({ state, operation, recorder }) {
    const op: SinglyLinkedListOperation = operation;
    switch (op.type) {
      case 'insertHead':
        return done(insertHeadSteps(state, op.value, recorder));
      case 'insertTail':
        return done(insertTailSteps(state, op.value, recorder));
      case 'insertAt':
        return executeInsertAt(state, op.position, op.value, recorder);
      case 'removeHead':
        return executeRemoveHead(state, recorder);
      case 'removeTail':
        return executeRemoveTail(state, recorder);
      case 'removeAt':
        return executeRemoveAt(state, op.position, recorder);
      case 'search':
        return searchSteps(state, op.value, recorder);
      case 'getAt':
        return getAtSteps(state, op.position, recorder);
      case 'traverse':
        return traverseSteps(state, recorder);
      case 'toArray':
        return toArraySteps(state, recorder);
    }
  },
};

export const singlyLinkedListItem = defineItem(singlyLinkedListDefinition);
