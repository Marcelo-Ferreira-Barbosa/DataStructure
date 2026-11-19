import { elementId, type ElementId } from '../../../core/ids';
import type { LinkedListState } from '../../../core/state';
import type { Highlight } from '../../../core/step';
import {
  isEmpty,
  nodeAt,
  nodeById,
  nodesInOrder,
  pointerHighlights,
  sizeOf,
  withNext,
} from './list-state';
import { edge, element, walk, type Recorder } from './steps';

/** Cria o nó "solto": existe no estado, mas ninguém aponta para ele ainda. */
function allocate(
  state: LinkedListState,
  value: number,
): { state: LinkedListState; id: ElementId } {
  const id = elementId(state.nextId);
  return {
    id,
    state: {
      ...state,
      nextId: state.nextId + 1,
      nodes: [...state.nodes, { id, value, next: null, prev: null }],
    },
  };
}

/** Insere no início. Devolve o estado final. */
export function insertHeadSteps(
  state: LinkedListState,
  value: number,
  recorder: Recorder,
): LinkedListState {
  const wasEmpty = isEmpty(state);
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.insertHead.start', params: { value } },
    anchor: 'sll.insertHead.entry',
  });

  // 1. O nó nasce solto.
  const { state: allocated, id: newId } = allocate(state, value);
  recorder.step({
    state: allocated,
    highlights: [element(newId, 'inserted')],
    message: { key: 'sll.insertHead.allocated', params: { value } },
    anchor: 'sll.insertHead.allocate',
  });

  // 2. O novo nó aponta para o antigo início (ou para nada, se a lista estava vazia).
  const linked = withNext(allocated, newId, state.head);
  const linkHighlights: Highlight[] = [element(newId, 'inserted')];
  if (state.head !== null) {
    linkHighlights.push(element(state.head, 'head'), edge(newId, state.head, 'inserted'));
  }
  recorder.move();
  recorder.step({
    state: linked,
    highlights: linkHighlights,
    message: { key: 'sll.insertHead.linked-next', params: { value, hasNext: state.head !== null } },
    anchor: 'sll.insertHead.link-next',
  });

  // 3. O início da lista passa a ser o novo nó.
  let current: LinkedListState = { ...linked, head: newId };
  recorder.move();
  recorder.step({
    state: current,
    highlights: [element(newId, 'head')],
    message: { key: 'sll.head.updated', params: { value } },
    anchor: 'sll.insertHead.set-head',
  });

  // 4. Lista que estava vazia: o único nó também é o último.
  if (wasEmpty) {
    current = { ...current, tail: newId };
    recorder.move();
    recorder.step({
      state: current,
      highlights: [element(newId, 'tail')],
      message: { key: 'sll.tail.updated', params: { value } },
      anchor: 'sll.insertHead.set-tail',
    });
  }

  recorder.step({
    state: current,
    highlights: [element(newId, 'inserted')],
    message: { key: 'sll.insertHead.done', params: { value, size: sizeOf(current) } },
    anchor: 'sll.insertHead.done',
  });
  return current;
}

/** Insere no final, usando a referência `tail` (sem percorrer a lista). Devolve o estado final. */
export function insertTailSteps(
  state: LinkedListState,
  value: number,
  recorder: Recorder,
): LinkedListState {
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.insertTail.start', params: { value } },
    anchor: 'sll.insertTail.entry',
  });

  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.insertTail.checking', params: { empty: isEmpty(state) } },
    anchor: 'sll.insertTail.check-empty',
  });

  const { state: allocated, id: newId } = allocate(state, value);
  recorder.step({
    state: allocated,
    highlights: [element(newId, 'inserted')],
    message: { key: 'sll.insertTail.allocated', params: { value } },
    anchor: 'sll.insertTail.allocate',
  });

  let current: LinkedListState = allocated;
  if (state.tail === null) {
    // Lista vazia: o novo nó é, ao mesmo tempo, início e fim.
    current = { ...current, head: newId };
    recorder.move();
    recorder.step({
      state: current,
      highlights: [element(newId, 'head')],
      message: { key: 'sll.head.updated', params: { value } },
      anchor: 'sll.insertTail.set-head',
    });
  } else {
    // Lista com elementos: o último nó passa a apontar para o novo.
    const oldTail = nodeById(state, state.tail);
    recorder.access();
    current = withNext(current, oldTail.id, newId);
    recorder.move();
    recorder.step({
      state: current,
      highlights: [
        element(oldTail.id, 'tail'),
        element(newId, 'inserted'),
        edge(oldTail.id, newId, 'inserted'),
      ],
      message: { key: 'sll.insertTail.linked-tail', params: { tailValue: oldTail.value, value } },
      anchor: 'sll.insertTail.link-tail',
    });
  }

  current = { ...current, tail: newId };
  recorder.move();
  recorder.step({
    state: current,
    highlights: [element(newId, 'tail')],
    message: { key: 'sll.tail.updated', params: { value } },
    anchor: 'sll.insertTail.set-tail',
  });

  recorder.step({
    state: current,
    highlights: [element(newId, 'inserted')],
    message: { key: 'sll.insertTail.done', params: { value, size: sizeOf(current) } },
    anchor: 'sll.insertTail.done',
  });
  return current;
}

/**
 * Insere na posição `position` (0 a tamanho, ambos inclusive: o chamador já verificou).
 * Nas pontas, reaproveita as inserções no início e no final; no meio, percorre até o nó anterior
 * e religa dois ponteiros: primeiro o do novo nó, depois o do anterior (nessa ordem, para
 * nunca perder o resto da lista).
 */
export function insertAtSteps(
  state: LinkedListState,
  position: number,
  value: number,
  recorder: Recorder,
): LinkedListState {
  const ordered = nodesInOrder(state);
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.insertAt.start', params: { position, value } },
    anchor: 'sll.insertAt.entry',
  });

  if (position === 0) {
    recorder.step({
      state,
      highlights: pointerHighlights(state),
      message: { key: 'sll.insertAt.at-head', params: {} },
      anchor: 'sll.insertAt.check-position',
    });
    return insertHeadSteps(state, value, recorder);
  }
  if (position === ordered.length) {
    recorder.step({
      state,
      highlights: pointerHighlights(state),
      message: { key: 'sll.insertAt.at-tail', params: {} },
      anchor: 'sll.insertAt.check-position',
    });
    return insertTailSteps(state, value, recorder);
  }

  // Percorre do início até o nó ANTERIOR à posição.
  walk(ordered, recorder, position - 1, (visit) => {
    recorder.step({
      state,
      highlights: [...visit.before, element(visit.node.id, 'current')],
      message: {
        key: 'sll.insertAt.visit',
        params: { value: visit.node.value, index: visit.index },
      },
      anchor: 'sll.insertAt.walk',
    });
    return false;
  });
  const previous = nodeAt(ordered, position - 1);
  const next = nodeAt(ordered, position);

  const { state: allocated, id: newId } = allocate(state, value);
  recorder.step({
    state: allocated,
    highlights: [element(previous.id, 'previous'), element(newId, 'inserted')],
    message: { key: 'sll.insertAt.allocated', params: { value } },
    anchor: 'sll.insertAt.allocate',
  });

  // O novo nó aponta para quem estava na posição.
  const linkedNext = withNext(allocated, newId, next.id);
  recorder.move();
  recorder.step({
    state: linkedNext,
    highlights: [
      element(previous.id, 'previous'),
      element(newId, 'inserted'),
      edge(newId, next.id, 'inserted'),
    ],
    message: { key: 'sll.insertAt.linked-next', params: { value, nextValue: next.value } },
    anchor: 'sll.insertAt.link-next',
  });

  // O nó anterior passa a apontar para o novo.
  const final = withNext(linkedNext, previous.id, newId);
  recorder.move();
  recorder.step({
    state: final,
    highlights: [
      element(previous.id, 'previous'),
      element(newId, 'inserted'),
      edge(previous.id, newId, 'inserted'),
    ],
    message: {
      key: 'sll.insertAt.linked-previous',
      params: { previousValue: previous.value, value },
    },
    anchor: 'sll.insertAt.link-previous',
  });

  recorder.step({
    state: final,
    highlights: [element(newId, 'inserted')],
    message: { key: 'sll.insertAt.done', params: { value, position, size: sizeOf(final) } },
    anchor: 'sll.insertAt.done',
  });
  return final;
}
