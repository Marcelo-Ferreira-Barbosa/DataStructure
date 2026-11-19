import type { ElementId } from '../../../core/ids';
import type { StepRecorder } from '../../../core/item';
import type { Message } from '../../../core/message';
import type { RejectionReason } from '../../../core/problems';
import type { LinkedListState, ListNode } from '../../../core/state';
import type { Highlight } from '../../../core/step';
import { pointerHighlights } from './list-state';
import type {
  SinglyLinkedListAnchor,
  SinglyLinkedListMessages,
  SinglyLinkedListTypes,
} from './types';

/**
 * Mecanismo de rastreamento da lista: o que TODAS as operações usam para narrar o que fazem.
 * Cada passo é registrado pelo `StepRecorder` do núcleo (estado novo, mensagem, destaques,
 * âncora de pseudocódigo e contadores acumulados); aqui ficam só as peças específicas da lista.
 */

export type Recorder = StepRecorder<SinglyLinkedListTypes>;
export type ListMessage = Message<SinglyLinkedListMessages>;

export interface Rejection {
  readonly outcome: 'rejected';
  readonly reason: RejectionReason;
}

export const element = (id: ElementId, role: Highlight['role']): Highlight => ({
  target: { type: 'element', id },
  role,
});

export const edge = (from: ElementId, to: ElementId, role: Highlight['role']): Highlight => ({
  target: { type: 'edge', from, to },
  role,
});

export const visitedHighlights = (nodes: readonly ListNode[]): Highlight[] =>
  nodes.map((node) => element(node.id, 'visited'));

/** Lista vazia (ERR-004): o passo explica e a operação termina rejeitada, estado intacto. */
export function rejectEmpty(
  state: LinkedListState,
  recorder: Recorder,
  anchor: SinglyLinkedListAnchor,
): Rejection {
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.empty', params: {} },
    anchor,
  });
  return { outcome: 'rejected', reason: 'EMPTY_STRUCTURE' };
}

/** Posição inexistente nesta lista (ERR-005): o passo traz a posição pedida e o tamanho. */
export function rejectPosition(
  state: LinkedListState,
  recorder: Recorder,
  position: number,
  size: number,
  anchor: SinglyLinkedListAnchor,
): Rejection {
  recorder.step({
    state,
    highlights: pointerHighlights(state),
    message: { key: 'sll.position.out-of-range', params: { position, size } },
    anchor,
  });
  return { outcome: 'rejected', reason: 'POSITION_OUT_OF_RANGE' };
}

export interface Visit {
  readonly node: ListNode;
  readonly index: number;
  /** Destaques dos nós já percorridos (papel `visited`), para somar ao nó atual. */
  readonly before: readonly Highlight[];
}

/** Destaques de uma visita: nós anteriores como `visited` e o nó da vez como `current`. */
export const visitHighlights = (visit: Visit): Highlight[] => [
  ...visit.before,
  element(visit.node.id, 'current'),
];

/**
 * O percurso da lista, escrito uma única vez. Visita os nós nas posições 0 a `last`
 * (inclusive), contando 1 acesso por nó, e chama `onVisit` para que a operação narre o passo.
 * Se `onVisit` devolver `true`, o percurso para (ex.: valor encontrado).
 * Devolve quantos nós foram visitados.
 */
export function walk(
  ordered: readonly ListNode[],
  recorder: Recorder,
  last: number,
  onVisit: (visit: Visit) => boolean,
): number {
  const before: Highlight[] = [];
  let visited = 0;
  for (let index = 0; index <= last; index += 1) {
    const node = ordered[index];
    if (node === undefined) break;
    recorder.access();
    visited += 1;
    if (onVisit({ node, index, before: [...before] })) break;
    before.push(element(node.id, 'visited'));
  }
  return visited;
}
