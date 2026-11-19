import type { LinkedListState, ListNode } from '../../../core/state';
import { nodeAt, nodesInOrder, sizeOf, withNext, withoutNode } from './list-state';
import { edge, element, walk, type Recorder } from './steps';

export interface Removal {
  readonly state: LinkedListState;
  readonly value: number;
}

/**
 * Remove o primeiro nó (a lista NÃO está vazia: o chamador já verificou).
 * O nó sai da lista antes de sair do estado: há um passo em que ele já está desligado
 * (ninguém aponta para ele) e ainda existe, e só no último passo é liberado.
 */
export function removeHeadSteps(state: LinkedListState, recorder: Recorder): Removal {
  const head = nodeAt(nodesInOrder(state), 0);

  recorder.access();
  recorder.step({
    state,
    highlights: [element(head.id, 'head')],
    message: { key: 'sll.removeHead.reading', params: { value: head.value } },
    anchor: 'sll.removeHead.read',
  });

  let current: LinkedListState = { ...state, head: head.next };
  recorder.move();
  recorder.step({
    state: current,
    highlights: [
      element(head.id, 'removed'),
      ...(head.next === null ? [] : [element(head.next, 'head')]),
    ],
    message: { key: 'sll.removeHead.head-moved', params: { hasNext: head.next !== null } },
    anchor: 'sll.removeHead.set-head',
  });

  // Era o único nó: a lista fica vazia, então o fim também deixa de apontar para ele.
  if (head.next === null) {
    current = { ...current, tail: null };
    recorder.move();
    recorder.step({
      state: current,
      highlights: [element(head.id, 'removed')],
      message: { key: 'sll.tail.cleared', params: {} },
      anchor: 'sll.removeHead.set-tail',
    });
  }

  const final = withoutNode(current, head.id);
  recorder.step({
    state: final,
    highlights: [element(head.id, 'removed')],
    message: { key: 'sll.removeHead.done', params: { value: head.value, size: sizeOf(final) } },
    anchor: 'sll.removeHead.done',
  });
  return { state: final, value: head.value };
}

/**
 * Remove o nó da posição `position` (existente: o chamador já verificou). É também o núcleo de
 * `removeTail` (remover a última posição), para que o desligamento exista em um só lugar.
 * Posição 0 usa a remoção do início; as demais percorrem até o nó anterior e o religam
 * para o seguinte ao alvo; se o alvo era o último, `tail` recua para o anterior.
 */
export function removeAtCore(
  state: LinkedListState,
  position: number,
  recorder: Recorder,
): Removal {
  if (position === 0) return removeHeadSteps(state, recorder);

  const ordered = nodesInOrder(state);
  walk(ordered, recorder, position - 1, (visit) => {
    recorder.step({
      state,
      highlights: [...visit.before, element(visit.node.id, 'current')],
      message: {
        key: 'sll.removeAt.visit',
        params: { value: visit.node.value, index: visit.index },
      },
      anchor: 'sll.removeAt.walk',
    });
    return false;
  });
  const previous: ListNode = nodeAt(ordered, position - 1);
  const target: ListNode = nodeAt(ordered, position);

  recorder.access();
  recorder.step({
    state,
    highlights: [element(previous.id, 'previous'), element(target.id, 'current')],
    message: { key: 'sll.removeAt.target', params: { value: target.value, position } },
    anchor: 'sll.removeAt.read-target',
  });

  // O anterior passa a apontar para o seguinte ao alvo: o alvo sai da lista.
  let current = withNext(state, previous.id, target.next);
  recorder.move();
  recorder.step({
    state: current,
    highlights: [
      element(previous.id, 'previous'),
      element(target.id, 'removed'),
      ...(target.next === null ? [] : [edge(previous.id, target.next, 'inserted')]),
    ],
    message: {
      key: 'sll.removeAt.unlinked',
      params: { previousValue: previous.value, hasNext: target.next !== null },
    },
    anchor: 'sll.removeAt.unlink',
  });

  if (state.tail === target.id) {
    current = { ...current, tail: previous.id };
    recorder.move();
    recorder.step({
      state: current,
      highlights: [element(previous.id, 'tail'), element(target.id, 'removed')],
      message: { key: 'sll.tail.updated', params: { value: previous.value } },
      anchor: 'sll.removeAt.set-tail',
    });
  }

  const final = withoutNode(current, target.id);
  recorder.step({
    state: final,
    highlights: [element(target.id, 'removed')],
    message: { key: 'sll.removeAt.done', params: { value: target.value, size: sizeOf(final) } },
    anchor: 'sll.removeAt.done',
  });
  return { state: final, value: target.value };
}
